import os
import time
import json
import random
import logging
import psycopg2
import paho.mqtt.client as mqtt

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DB_USER = os.environ.get("POSTGRES_USER", "rawbin")
DB_PASS = os.environ.get("POSTGRES_PASSWORD", "rawbin_dev_secret")
DB_HOST = os.environ.get("POSTGRES_HOST", "db")
DB_PORT = os.environ.get("POSTGRES_PORT", "5432")
DB_NAME = os.environ.get("POSTGRES_DB", "rawbin")

MQTT_HOST = os.environ.get("MQTT_BROKER_HOST", "mosquitto")
MQTT_PORT = int(os.environ.get("MQTT_BROKER_PORT", "1883"))
MQTT_USER = os.environ.get("MQTT_USERNAME", "rawbin")
MQTT_PASS = os.environ.get("MQTT_PASSWORD", "rawbin_mqtt_secret")

def get_paired_devices():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
        )
        cur = conn.cursor()
        cur.execute("SELECT id FROM devices WHERE is_paired = true;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [str(row[0]) for row in rows]
    except Exception as e:
        logger.error(f"DB connection failed: {e}")
        return []

def main():
    logger.info("Starting Telemetry Simulator...")
    
    # Wait for DB and MQTT to be ready
    time.sleep(5)
    
    client = mqtt.Client(client_id=f"rawbin-simulator-{random.randint(1000, 9999)}", protocol=mqtt.MQTTv5)
    if MQTT_USER and MQTT_PASS:
        client.username_pw_set(MQTT_USER, MQTT_PASS)
        
    try:
        client.connect(MQTT_HOST, MQTT_PORT, 60)
        client.loop_start()
        logger.info(f"Connected to MQTT broker at {MQTT_HOST}:{MQTT_PORT}")
    except Exception as e:
        logger.error(f"MQTT connection failed: {e}")
        return

    # Keep track of device states
    device_states = {}

    while True:
        devices = get_paired_devices()
        
        for dev_id in devices:
            if dev_id not in device_states:
                device_states[dev_id] = {
                    "temperature_c": random.uniform(20.0, 60.0),
                    "humidity_pct": random.uniform(40.0, 80.0),
                    "co2_ppm": random.randint(400, 2000),
                    "ph_level": random.uniform(6.0, 8.0),
                    "ambient_temp_c": 22.0,
                    "fan_speed_rpm": random.randint(800, 2000),
                    "fill_level_pct": random.uniform(10.0, 90.0),
                    "weight_kg": random.uniform(5.0, 15.0),
                    "firmware_version": "1.0.1",
                    "timestamp": int(time.time())
                }
            else:
                # Random walk
                state = device_states[dev_id]
                state["temperature_c"] += random.uniform(-0.5, 0.5)
                state["temperature_c"] = max(10, min(80, state["temperature_c"]))
                
                state["humidity_pct"] += random.uniform(-1.0, 1.0)
                state["humidity_pct"] = max(0, min(100, state["humidity_pct"]))
                
                state["co2_ppm"] += random.randint(-50, 50)
                state["co2_ppm"] = max(400, min(5000, state["co2_ppm"]))
                
                state["ph_level"] += random.uniform(-0.1, 0.1)
                state["ph_level"] = max(4.0, min(9.0, state["ph_level"]))
                
                state["timestamp"] = int(time.time())
            
            topic = f"telemetry/{dev_id}"
            payload = json.dumps(device_states[dev_id])
            client.publish(topic, payload, qos=1)
            logger.debug(f"Published to {topic}: {payload}")
            
        time.sleep(5)

if __name__ == "__main__":
    main()
