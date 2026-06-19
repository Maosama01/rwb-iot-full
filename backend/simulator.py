#!/usr/bin/env python3
"""
Rawbin Hardware Simulator
Publishes mock telemetry data to the Mosquitto MQTT broker.
"""

import argparse
import json
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

def generate_normal_reading():
    return {
        "time": datetime.now(timezone.utc).isoformat(),
        "temperature_c": round(random.uniform(25.0, 55.0), 1),
        "humidity_pct": round(random.uniform(50.0, 70.0), 1),
        "co2_ppm": round(random.uniform(800.0, 1500.0), 1),
        "ph_level": round(random.uniform(6.5, 7.5), 1),
        "ambient_temp_c": round(random.uniform(20.0, 25.0), 1),
        "fan_speed_rpm": int(random.uniform(800, 1200)),
        "fill_level_pct": round(random.uniform(30.0, 60.0), 1),
        "weight_kg": round(random.uniform(5.0, 15.0), 1),
        "firmware_version": "1.4.2"
    }

def generate_alert_reading():
    reading = generate_normal_reading()
    # Trigger a high temperature and CO2 spike
    reading["temperature_c"] = 75.0
    reading["co2_ppm"] = 45000.0  # Below schema max of 50,000, but dangerously high
    return reading

def main():
    parser = argparse.ArgumentParser(description="Rawbin MQTT Hardware Simulator")
    parser.add_argument("device_id", help="UUID of the device to simulate")
    parser.add_argument("--trigger-alert", action="store_true", help="Send an alert spike and exit")
    parser.add_argument("--host", default="localhost", help="MQTT broker host")
    parser.add_argument("--port", type=int, default=1883, help="MQTT broker port")
    parser.add_argument("--interval", type=int, default=5, help="Publish interval in seconds")
    parser.add_argument("--username", default="rawbin", help="MQTT username")
    parser.add_argument("--password", default="rawbin_mqtt_secret", help="MQTT password")
    args = parser.parse_args()

    topic = f"rawbin/telemetry/{args.device_id}"

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"simulator_{args.device_id[:8]}")
    client.username_pw_set(args.username, args.password)
    
    print(f"Connecting to MQTT broker at {args.host}:{args.port}...")
    try:
        client.connect(args.host, args.port, 60)
    except Exception as e:
        print(f"Failed to connect to broker: {e}")
        return

    client.loop_start()

    try:
        if args.trigger_alert:
            payload = generate_alert_reading()
            print(f"Publishing ALERT reading to {topic}...")
            client.publish(topic, json.dumps(payload))
            time.sleep(1) # wait for publish to complete
            return
            
        print("Starting continuous simulation (press Ctrl+C to stop)...")
        # Simulating a compost cycle warming up
        base_temp = 22.0
        while True:
            payload = generate_normal_reading()
            
            # Smoothly ramp up temperature to simulate active composting
            if base_temp < 60.0:
                base_temp += random.uniform(0.1, 1.0)
            payload["temperature_c"] = round(base_temp + random.uniform(-1.0, 1.0), 1)
            
            print(f"[{payload['time']}] Publishing T={payload['temperature_c']}°C H={payload['humidity_pct']}% -> {topic}")
            client.publish(topic, json.dumps(payload))
            time.sleep(args.interval)
            
    except KeyboardInterrupt:
        print("\nStopping simulator...")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
