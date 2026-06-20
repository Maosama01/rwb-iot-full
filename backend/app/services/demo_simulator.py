import asyncio
import json
import logging
import random
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
import paho.mqtt.client as mqtt

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.db.models.device import Device

logger = logging.getLogger(__name__)
settings = get_settings()

@dataclass
class DeviceState:
    temperature_c: float = 40.0
    humidity_pct: float = 60.0
    co2_ppm: float = 1200.0
    ph_level: float = 7.0
    ambient_temp_c: float = 22.0
    fan_speed_rpm: int = 1000
    fill_level_pct: float = 40.0
    weight_kg: float = 10.0
    
    in_anomaly: bool = False
    anomaly_ticks_remaining: int = 0
    anomaly_type: str = "none"

# Global state tracker
simulated_states: dict[str, DeviceState] = {}

def evolve_device_state(device_id: str) -> dict:
    if device_id not in simulated_states:
        # Initialize slightly randomized baseline
        simulated_states[device_id] = DeviceState(
            temperature_c=random.uniform(40.0, 50.0),
            humidity_pct=random.uniform(55.0, 65.0),
            co2_ppm=random.uniform(1000.0, 1500.0)
        )
    
    state = simulated_states[device_id]
    
    # ── Anomaly Logic ──
    # 1% chance every 5s to trigger an anomaly if not in one (~every 8 minutes)
    if not state.in_anomaly and random.random() < 0.01:
        state.in_anomaly = True
        state.anomaly_ticks_remaining = random.randint(12, 24) # 1-2 minutes sustained
        state.anomaly_type = random.choice(["overheat", "high_co2"])
        logger.info(f"Anomaly {state.anomaly_type} triggered for {device_id}!")
        
    if state.in_anomaly:
        state.anomaly_ticks_remaining -= 1
        if state.anomaly_ticks_remaining <= 0:
            state.in_anomaly = False
            state.anomaly_type = "none"
            logger.info(f"Anomaly resolved for {device_id}.")

    # ── Target Selection ──
    if state.anomaly_type == "overheat":
        temp_target = 70.0  # Above typical max
        co2_target = 3000.0
    elif state.anomaly_type == "high_co2":
        temp_target = 55.0
        co2_target = 8000.0
    else:
        # Normal targets
        temp_target = 45.0
        co2_target = 1200.0
        
    # ── Physics Simulation (Mean-Reverting Random Walk) ──
    # Temperature (high inertia)
    temp_drift = (temp_target - state.temperature_c) * 0.1
    state.temperature_c += temp_drift + random.uniform(-0.5, 0.5)
    
    # CO2 (medium inertia)
    co2_drift = (co2_target - state.co2_ppm) * 0.15
    state.co2_ppm += co2_drift + random.uniform(-50.0, 50.0)
    
    # Humidity (slow drift)
    humidity_target = 60.0
    hum_drift = (humidity_target - state.humidity_pct) * 0.05
    state.humidity_pct += hum_drift + random.uniform(-1.0, 1.0)
    
    # pH (very stable)
    state.ph_level += random.uniform(-0.02, 0.02)
    state.ph_level = max(0.0, min(14.0, state.ph_level))
    
    # Ambient temp (slow daily drift, simulated as stable here)
    state.ambient_temp_c += random.uniform(-0.1, 0.1)
    
    # Fan speed (noisy)
    state.fan_speed_rpm += int(random.uniform(-50, 50))
    state.fan_speed_rpm = max(800, min(1500, state.fan_speed_rpm))
    
    # Fill level & weight (very slow monotonic growth)
    state.fill_level_pct += random.uniform(0.0, 0.01)
    state.weight_kg += random.uniform(0.0, 0.005)

    return {
        "time": datetime.now(timezone.utc).isoformat(),
        "temperature_c": round(state.temperature_c, 1),
        "humidity_pct": round(state.humidity_pct, 1),
        "co2_ppm": round(state.co2_ppm, 1),
        "ph_level": round(state.ph_level, 2),
        "ambient_temp_c": round(state.ambient_temp_c, 1),
        "fan_speed_rpm": state.fan_speed_rpm,
        "fill_level_pct": round(state.fill_level_pct, 1),
        "weight_kg": round(state.weight_kg, 2),
        "firmware_version": "1.4.2"
    }

async def run_demo_simulator():
    """Continuously publishes MQTT data for all demo devices."""
    try:
        logger.info("Starting stateful demo simulator background task...")
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="demo_simulator_api")
        if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
            client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
            
        client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, 60)
        client.loop_start()
        
        while True:
            try:
                async with AsyncSessionLocal() as db:
                    stmt = select(Device).where(Device.hardware_uid.like("DEMO-%"))
                    result = await db.execute(stmt)
                    demo_devices = result.scalars().all()
                    
                    for device in demo_devices:
                        topic = f"rawbin/telemetry/{device.id}"
                        payload = evolve_device_state(str(device.id))
                        client.publish(topic, json.dumps(payload))
            except Exception as e:
                logger.error(f"Error in demo simulator loop: {e}")
                
            await asyncio.sleep(5)
            
    except asyncio.CancelledError:
        logger.info("Demo simulator task cancelled.")
        client.loop_stop()
        client.disconnect()
