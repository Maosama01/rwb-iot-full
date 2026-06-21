#!/usr/bin/env python3
"""
Rawbin Hardware Simulator (enhanced)
Publishes mock telemetry to the Mosquitto MQTT broker.

Builds on the original co-intern version. Additions:
  --fixed-time TS   Publish with a specific ISO timestamp instead of "now".
                    Enables the dedup test (publish same time twice) and the
                    store-and-forward test (publish a PAST timestamp).
  --breach METRIC   Make every reading breach ONE specific alert threshold,
                    so each alert rule can be tested in isolation.
  --once / --count  Publish exactly one / exactly N readings, then exit.

Also reports MQTT auth failures clearly instead of silently publishing into
the void (useful while sorting out broker credentials).

Alert thresholds (from backend code review):
  temperature_c > 80.0  -> CRITICAL     temperature_c < 40.0 -> WARNING
  co2_ppm       > 5000  -> WARNING
  humidity_pct  < 40.0  -> WARNING      humidity_pct  > 80.0 -> WARNING
  ph_level      < 5.0   -> WARNING      ph_level      > 8.5  -> WARNING
Only these 4 metrics ever alert; the others are stored but never alert.
"""

import argparse
import json
import random
import sys
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

# Maps a --breach choice to (field, value-just-past-the-threshold, severity).
# Values are kept close to the threshold to clearly fire the alert without
# risking any upstream payload-validation ceilings.
BREACH_VALUES = {
    "temp_high":     ("temperature_c", 85.0, "CRITICAL (> 80)"),
    "temp_low":      ("temperature_c", 35.0, "WARNING  (< 40)"),
    "co2_high":      ("co2_ppm",       6000.0, "WARNING  (> 5000)"),
    "humidity_low":  ("humidity_pct",  30.0, "WARNING  (< 40)"),
    "humidity_high": ("humidity_pct",  85.0, "WARNING  (> 80)"),
    "ph_low":        ("ph_level",      4.0,  "WARNING  (< 5.0)"),
    "ph_high":       ("ph_level",      9.0,  "WARNING  (> 8.5)"),
}


def generate_normal_reading(fixed_time=None):
    """One realistic, in-range reading. Uses fixed_time if provided, else now()."""
    ts = fixed_time if fixed_time else datetime.now(timezone.utc).isoformat()
    return {
        "time": ts,
        "temperature_c": round(random.uniform(25.0, 55.0), 1),
        "humidity_pct": round(random.uniform(50.0, 70.0), 1),
        "co2_ppm": round(random.uniform(800.0, 1500.0), 1),
        "ph_level": round(random.uniform(6.5, 7.5), 1),
        "ambient_temp_c": round(random.uniform(20.0, 25.0), 1),
        "fan_speed_rpm": int(random.uniform(800, 1200)),
        "fill_level_pct": round(random.uniform(30.0, 60.0), 1),
        "weight_kg": round(random.uniform(5.0, 15.0), 1),
        "firmware_version": "1.4.2",
    }


def apply_breach(reading, breach):
    """Override a single metric so it crosses exactly one alert threshold."""
    field, value, _ = BREACH_VALUES[breach]
    reading[field] = value
    return reading


# ---- connection state, set by the on_connect callback -----------------------
_connected = {"ok": False, "reported": False}


def on_connect(client, userdata, flags, reason_code, properties=None):
    # paho VERSION2: reason_code is a ReasonCode; 0 / "Success" means connected.
    if reason_code == 0 or getattr(reason_code, "is_failure", False) is False:
        _connected["ok"] = True
        print(f"Connected to broker (reason: {reason_code}).")
    else:
        _connected["ok"] = False
        print(f"!! Broker refused connection: {reason_code}")
        if "not authori" in str(reason_code).lower():
            print("   -> This is an AUTH failure. Check --username/--password "
                  "match the broker's real credentials (the ones the MQTT "
                  "worker uses), not necessarily the config.py defaults.")
    _connected["reported"] = True


def wait_for_connection(timeout=5.0):
    """Block until on_connect fires, or timeout. Returns True if connected."""
    start = time.time()
    while not _connected["reported"] and (time.time() - start) < timeout:
        time.sleep(0.05)
    return _connected["ok"]


def publish_one(client, topic, payload, qos=1, label=""):
    info = client.publish(topic, json.dumps(payload), qos=qos)
    info.wait_for_publish(timeout=5)
    tag = f" [{label}]" if label else ""
    print(f"Published{tag} (qos={qos}) -> {topic}  time={payload['time']}")


def main():
    p = argparse.ArgumentParser(description="Rawbin MQTT Hardware Simulator (enhanced)")
    p.add_argument("device_id", help="UUID of the device to simulate")

    # connection
    p.add_argument("--host", default="localhost", help="MQTT broker host")
    p.add_argument("--port", type=int, default=1883, help="MQTT broker port")
    p.add_argument("--username", default="rawbin", help="MQTT username")
    p.add_argument("--password", default="rawbin_mqtt_secret", help="MQTT password")

    # cadence / count
    p.add_argument("--interval", type=int, default=5, help="Seconds between readings (continuous mode)")
    p.add_argument("--count", type=int, default=0, help="Publish N readings then exit (0 = run forever)")
    p.add_argument("--once", action="store_true", help="Publish exactly one reading and exit (same as --count 1)")
    p.add_argument("--qos", type=int, default=1, choices=[0, 1, 2],
                   help="MQTT QoS level (default 1). QoS 1+ is REQUIRED for the "
                        "worker-offline durability test; QoS 0 messages are dropped "
                        "if no subscriber is connected.")

    # test modifiers
    p.add_argument("--fixed-time", dest="fixed_time", default=None,
                   help='ISO timestamp to stamp on readings, e.g. "2026-06-18T10:30:00Z". '
                        "Reuse the same value twice for the dedup test; use a past value "
                        "for the store-and-forward test.")
    p.add_argument("--breach", choices=sorted(BREACH_VALUES.keys()), default=None,
                   help="Breach one alert threshold on every reading (for isolated alert tests).")

    # backward-compat shortcut from the original script
    p.add_argument("--trigger-alert", action="store_true",
                   help="One-shot combined breach (temp + co2). Equivalent to a quick "
                        "'does any alert fire' smoke test.")

    args = p.parse_args()

    topic = f"rawbin/telemetry/{args.device_id}"

    # Resolve how many messages to send.
    count = args.count
    if args.once or args.trigger_alert or args.breach:
        # these are inherently one-shot unless the user explicitly asked for more
        if count == 0:
            count = 1

    if args.fixed_time and count == 0:
        print("Note: --fixed-time in continuous mode produces duplicate timestamps; "
              "after the first, the DB should reject them as duplicates. "
              "Add --once (or --count N) for a clean dedup test.")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                         client_id=f"simulator_{args.device_id[:8]}")
    client.username_pw_set(args.username, args.password)
    client.on_connect = on_connect

    print(f"Connecting to MQTT broker at {args.host}:{args.port} ...")
    try:
        client.connect(args.host, args.port, 60)
    except Exception as e:
        print(f"Failed to reach broker: {e}")
        return

    client.loop_start()
    if not wait_for_connection():
        print("Aborting: not connected to broker (see message above).")
        client.loop_stop()
        client.disconnect()
        sys.exit(1)

    try:
        # ---- one-shot / fixed count mode --------------------------------
        if count > 0:
            for i in range(count):
                if args.trigger_alert:
                    reading = generate_normal_reading(args.fixed_time)
                    reading["temperature_c"] = 85.0   # CRITICAL (> 80)
                    reading["co2_ppm"] = 6000.0        # WARNING  (> 5000)
                    publish_one(client, topic, reading, args.qos, "ALERT temp+co2")
                elif args.breach:
                    reading = apply_breach(generate_normal_reading(args.fixed_time), args.breach)
                    field, value, sev = BREACH_VALUES[args.breach]
                    publish_one(client, topic, reading, args.qos, f"BREACH {field}={value} {sev}")
                else:
                    reading = generate_normal_reading(args.fixed_time)
                    publish_one(client, topic, reading, args.qos, "normal")
                if i < count - 1:
                    time.sleep(args.interval)
            return

        # ---- continuous mode (original behavior, with optional breach) --
        print("Starting continuous simulation (Ctrl+C to stop) ...")
        base_temp = 22.0
        while True:
            reading = generate_normal_reading(args.fixed_time)

            # Smoothly ramp temperature to mimic an active composting cycle,
            # unless we're deliberately breaching temperature.
            if not (args.breach and BREACH_VALUES[args.breach][0] == "temperature_c"):
                if base_temp < 60.0:
                    base_temp += random.uniform(0.1, 1.0)
                reading["temperature_c"] = round(base_temp + random.uniform(-1.0, 1.0), 1)

            if args.breach:
                reading = apply_breach(reading, args.breach)

            label = f"BREACH {args.breach}" if args.breach else "normal"
            print(f"[{reading['time']}] T={reading['temperature_c']}C "
                  f"H={reading['humidity_pct']}% CO2={reading['co2_ppm']} "
                  f"pH={reading['ph_level']} ({label}) -> {topic}")
            client.publish(topic, json.dumps(reading), qos=args.qos)
            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\nStopping simulator ...")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()