import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.sensor_reading import SensorReading
from datetime import datetime, timezone, timedelta

async def _seed_reading(db_session: AsyncSession, device_id: str, time: datetime) -> None:
    db_session.add(
        SensorReading(
            device_id=uuid.UUID(device_id),
            time=time,
            temperature_c=25.0,
            humidity_pct=50.0,
            co2_ppm=400.0,
            ph_level=7.0,
            ambient_temp_c=20.0,
            fan_speed_rpm=1000,
            fill_level_pct=20.0,
            weight_kg=10.0,
            firmware_version="1.0.0"
        )
    )
    await db_session.commit()

@pytest.mark.asyncio
async def test_telemetry_export_csv_raw(
    async_client: AsyncClient,
    db_session: AsyncSession,
    auth_headers: dict,
    paired_device: dict,
):
    now = datetime.now(timezone.utc)
    await _seed_reading(db_session, paired_device["device_id"], now - timedelta(hours=1))

    response = await async_client.get(
        f"/api/v1/telemetry/{paired_device['device_id']}/export?interval=raw",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=telemetry" in response.headers["content-disposition"]
    
    content = response.text
    lines = content.strip().split("\r\n")
    assert len(lines) >= 2 # header + 1 row
    assert "time,temperature_c,humidity_pct" in lines[0]
    assert "25.0" in lines[1]
