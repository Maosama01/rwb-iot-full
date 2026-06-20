import uuid
from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient

from app.db.models.compost_cycle import CompostCycle
from app.db.models.sensor_reading import SensorReading


@pytest.fixture
async def sample_cycle_with_data(db_session, paired_device):
    device_id = uuid.UUID(paired_device["device_id"])
    cycle_id = uuid.uuid4()
    started_at = datetime.now(timezone.utc) - timedelta(days=10)
    
    cycle = CompostCycle(
        id=cycle_id,
        device_id=device_id,
        status="active",
        started_at=started_at,
        label="Insights Test Batch"
    )
    db_session.add(cycle)

    # Add daily readings (avg around 50C for 10 days) -> (50-20)*10 = 300 degree days
    for i in range(10):
        reading_time = started_at + timedelta(days=i, hours=12)
        reading = SensorReading(
            time=reading_time,
            device_id=device_id,
            temperature_c=50.0,
            humidity_pct=50.0
        )
        db_session.add(reading)

    await db_session.commit()
    return cycle_id


@pytest.mark.asyncio
async def test_get_cycle_insights(async_client: AsyncClient, auth_headers: dict, sample_cycle_with_data: uuid.UUID):
    res = await async_client.get(f"/api/v1/cycles/{sample_cycle_with_data}/insights", headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    
    # 10 days * (50C - 20C) = 300 degree days
    assert data["degree_days_accumulated"] == 300.0
    
    # 300 / 500 = 60%
    assert data["percent_complete"] == 60
    assert data["current_phase"] == "Thermophilic (Active Composting)"
    assert "Optimal composting temperature achieved. Maintain aeration." in data["recommendations"]
    
    # Estimated completion date should be approx 200 degree days remaining / 30C rate = 6.6 days from now
    assert data["estimated_completion_date"] is not None
