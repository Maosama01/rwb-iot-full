import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Query
from sqlalchemy import select, text, func

from app.api.deps import CurrentUser, DbSession
from app.db.models.device import Device
from app.db.models.user_device import UserDevice
from app.schemas.analytics import AnalyticsCompareResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get(
    "/compare",
    response_model=AnalyticsCompareResponse,
    summary="Compare daily average temperatures across all accessible devices",
)
async def get_analytics_compare(
    current_user: CurrentUser,
    db: DbSession,
    from_: datetime | None = Query(default=None, alias="from"),
    to: datetime | None = Query(default=None),
) -> AnalyticsCompareResponse:
    now = datetime.now(timezone.utc)
    window_start = from_ or (now - timedelta(days=90))
    window_end = to or now

    # 1. Get user's devices
    devices_result = await db.execute(
        select(Device.id, Device.display_name)
        .join(UserDevice, UserDevice.device_id == Device.id)
        .where(UserDevice.user_id == current_user.id)
    )
    devices = devices_result.all()

    if not devices:
        return AnalyticsCompareResponse(series=[], devices={})

    device_map = {str(d.id): (d.display_name or "Unnamed Device") for d in devices}
    device_ids = list(device_map.keys())

    # 2. Get daily averages for all these devices
    query = text("""
        SELECT time_bucket('1 day', bucket) AS day_bucket,
               device_id,
               AVG(avg_temperature_c) AS avg_temp
        FROM sensor_readings_hourly
        WHERE device_id = ANY(:device_ids)
          AND bucket >= :from_ts AND bucket <= :to_ts
        GROUP BY 1, 2
        ORDER BY 1 ASC
    """)
    readings_result = await db.execute(
        query,
        {
            "device_ids": device_ids,
            "from_ts": window_start,
            "to_ts": window_end,
        }
    )

    # 3. Pivot data into series array
    bucket_map = {}
    for row in readings_result:
        b_str = row.day_bucket.isoformat()
        if b_str not in bucket_map:
            bucket_map[b_str] = {"bucket": b_str}
        
        dev_id = str(row.device_id)
        bucket_map[b_str][dev_id] = float(row.avg_temp) if row.avg_temp is not None else None

    series = list(bucket_map.values())
    
    # Sort series by bucket chronologically
    series.sort(key=lambda x: x["bucket"])

    return AnalyticsCompareResponse(
        series=series,
        devices=device_map,
    )

from app.schemas.analytics import PredictiveInsightsResponse
from app.db.models.compost_cycle import CompostCycle
from fastapi import HTTPException

@router.get(
    "/predictive/{device_id}",
    response_model=PredictiveInsightsResponse,
    summary="Get predictive insights and health score for a specific device",
)
async def get_predictive_insights(
    device_id: str,
    current_user: CurrentUser,
    db: DbSession,
) -> PredictiveInsightsResponse:
    # 1. Verify access
    device_check = await db.execute(
        select(Device.id)
        .join(UserDevice, UserDevice.device_id == Device.id)
        .where(UserDevice.user_id == current_user.id)
        .where(Device.id == device_id)
    )
    if not device_check.first():
        raise HTTPException(status_code=404, detail="Device not found")

    # 2. Get active cycle
    cycle_result = await db.execute(
        select(CompostCycle)
        .where(CompostCycle.device_id == device_id)
        .where(CompostCycle.status == "ACTIVE")
    )
    active_cycle = cycle_result.scalar_one_or_none()

    # 3. Get recent telemetry averages (last 24 hours)
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(days=1)
    
    query = text("""
        SELECT AVG(avg_temperature_c) AS avg_temp,
               AVG(avg_humidity_pct) AS avg_hum
        FROM sensor_readings_hourly
        WHERE device_id = :device_id
          AND bucket >= :day_ago
    """)
    readings_result = await db.execute(query, {"device_id": uuid.UUID(device_id), "day_ago": day_ago})
    row = readings_result.first()
    
    avg_temp = float(row.avg_temp) if row and row.avg_temp is not None else 25.0
    avg_hum = float(row.avg_hum) if row and row.avg_hum is not None else 50.0

    # 4. Predict phase
    # Standard phases: Mesophilic (20-40C), Thermophilic (40-65C), Maturation (<40C later in cycle)
    current_phase = "Mesophilic"
    elapsed_days = 0
    if active_cycle:
        elapsed_days = (now - active_cycle.started_at).days
        
    if avg_temp >= 40.0:
        current_phase = "Thermophilic"
    elif elapsed_days > 14 and avg_temp < 40.0:
        current_phase = "Maturation"

    # 5. Calculate Health Score (0-100)
    # Ideal Temp: ~60C for Thermophilic, ~30C for Mesophilic
    # Ideal Humidity: ~55%
    ideal_temp = 60.0 if current_phase == "Thermophilic" else 30.0
    ideal_humidity = 55.0
    
    temp_penalty = min(abs(avg_temp - ideal_temp) * 2, 50)
    hum_penalty = min(abs(avg_hum - ideal_humidity) * 2, 50)
    health_score = max(0, 100 - int(temp_penalty + hum_penalty))

    # 6. Predict days remaining
    # Assume ideal total cycle is 30 days
    estimated_days_remaining = max(0, 30 - elapsed_days)

    return PredictiveInsightsResponse(
        current_phase=current_phase,
        health_score=health_score,
        estimated_days_remaining=estimated_days_remaining,
        ideal_temperature=ideal_temp,
        ideal_humidity=ideal_humidity,
        phase_started_at=active_cycle.started_at if active_cycle else None
    )

from app.schemas.analytics import CommunityImpactResponse
from app.db.models.waste_log import WasteLog

@router.get(
    "/community-impact",
    response_model=CommunityImpactResponse,
    summary="Get global community impact metrics",
)
async def get_community_impact(
    db: DbSession,
) -> CommunityImpactResponse:
    # Calculate sum of all waste logged
    result = await db.execute(
        select(func.sum(WasteLog.weight_kg))
    )
    total_weight = result.scalar() or 0.0

    # Calculate number of distinct users who have logged waste
    user_result = await db.execute(
        select(func.count(func.distinct(WasteLog.user_id)))
    )
    total_users = user_result.scalar() or 0

    return CommunityImpactResponse(
        total_weight_kg=float(total_weight),
        total_users=total_users,
    )
