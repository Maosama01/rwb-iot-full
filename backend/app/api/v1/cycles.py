"""
app/api/v1/cycles.py
─────────────────────
Compost cycle (batch) routes.

  POST  /api/v1/devices/{device_id}/cycles  – start a new batch
  GET   /api/v1/devices/{device_id}/cycles  – list a device's batches
  GET   /api/v1/cycles/{cycle_id}           – fetch one batch
  PATCH /api/v1/cycles/{cycle_id}           – advance / annotate a batch

Access requires device membership. At most one 'active' cycle per device is
enforced both here (friendly 409) and by a DB partial-unique index (safety net).
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.db.models.compost_cycle import CompostCycle
from app.db.models.user import User
from app.db.models.user_device import UserDevice
from app.db.models.sensor_reading import SensorReading
from app.schemas.cycle import CompostCycleCreate, CompostCycleOut, CompostCycleUpdate, CycleInsightsOut
from app.services import device_access
from app.workers.tasks.notifications import send_push_notification

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Compost Cycles"])


async def _load_cycle_with_access(
    cycle_id: uuid.UUID, db: DbSession, user_id: uuid.UUID
) -> CompostCycle:
    cycle = (
        await db.execute(select(CompostCycle).where(CompostCycle.id == cycle_id))
    ).scalar_one_or_none()
    if cycle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cycle not found.")
    # Reuse device membership check (raises 404 for non-members).
    await device_access.assert_device_member(db, cycle.device_id, user_id)
    return cycle


@router.post(
    "/devices/{device_id}/cycles",
    response_model=CompostCycleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new compost cycle for a device",
)
async def create_cycle(
    device_id: uuid.UUID,
    body: CompostCycleCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> CompostCycle:
    await device_access.assert_device_member(db, device_id, current_user.id)

    existing_active = (
        await db.execute(
            select(CompostCycle).where(
                CompostCycle.device_id == device_id,
                CompostCycle.status == "active",
            )
        )
    ).scalar_one_or_none()
    if existing_active is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This device already has an active cycle. Complete it before starting a new one.",
        )

    cycle = CompostCycle(
        device_id=device_id,
        status="active",
        started_at=body.started_at or datetime.now(timezone.utc),
        label=body.label,
        notes=body.notes,
    )
    db.add(cycle)
    await db.flush()
    await db.refresh(cycle)
    logger.info("Compost cycle started", extra={"device_id": str(device_id), "cycle_id": str(cycle.id)})
    return cycle


@router.get(
    "/devices/{device_id}/cycles",
    response_model=list[CompostCycleOut],
    summary="List a device's compost cycles (newest first)",
)
async def list_cycles(
    device_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
    status_filter: str | None = Query(
        default=None,
        alias="status",
        pattern="^(active|curing|completed)$",
        description="Optional filter by lifecycle status.",
    ),
) -> list[CompostCycle]:
    await device_access.assert_device_member(db, device_id, current_user.id)

    clauses = [CompostCycle.device_id == device_id]
    if status_filter:
        clauses.append(CompostCycle.status == status_filter)

    result = await db.execute(
        select(CompostCycle).where(*clauses).order_by(CompostCycle.started_at.desc())
    )
    return list(result.scalars().all())


@router.get(
    "/cycles/{cycle_id}",
    response_model=CompostCycleOut,
    summary="Fetch a single compost cycle",
)
async def get_cycle(
    cycle_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> CompostCycle:
    return await _load_cycle_with_access(cycle_id, db, current_user.id)


@router.patch(
    "/cycles/{cycle_id}",
    response_model=CompostCycleOut,
    summary="Advance or annotate a compost cycle",
)
async def update_cycle(
    cycle_id: uuid.UUID,
    body: CompostCycleUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> CompostCycle:
    cycle = await _load_cycle_with_access(cycle_id, db, current_user.id)

    if body.label is not None:
        cycle.label = body.label
    if body.notes is not None:
        cycle.notes = body.notes
    if body.ended_at is not None:
        cycle.ended_at = body.ended_at

    cycle_completed_now = False
    if body.status is not None and body.status != cycle.status:
        if body.status == "completed":
            cycle_completed_now = True
            # Stamp an end time when the batch is finished, unless one was supplied.
            if cycle.ended_at is None:
                cycle.ended_at = body.ended_at or datetime.now(timezone.utc)
        cycle.status = body.status

    await db.flush()
    await db.refresh(cycle)

    if cycle_completed_now:
        try:
            member_tokens = (
                await db.execute(
                    select(User.id, User.firebase_push_token)
                    .join(UserDevice, UserDevice.user_id == User.id)
                    .where(
                        UserDevice.device_id == cycle.device_id,
                        User.firebase_push_token.isnot(None),
                    )
                )
            ).all()

            for member_id, token in member_tokens:
                send_push_notification.apply_async(
                    kwargs={
                        "user_id": str(member_id),
                        "fcm_token": token,
                        "title": "🌱 Compost Batch Complete!",
                        "body": f"Your compost batch '{cycle.label or 'Unnamed'}' is fully cured and ready to use.",
                        "data": {"device_id": str(cycle.device_id), "cycle_id": str(cycle.id)},
                    },
                    queue="default",
                )
        except Exception:
            logger.warning(
                "Could not dispatch cycle completion push notifications",
                extra={"device_id": str(cycle.device_id)},
                exc_info=True,
            )

    logger.info("Compost cycle updated", extra={"cycle_id": str(cycle_id), "status": cycle.status})
    return cycle

from sqlalchemy import func, text
from datetime import timedelta

@router.get(
    "/cycles/{cycle_id}/insights",
    response_model=CycleInsightsOut,
    summary="Get predictive insights for a cycle",
)
async def get_cycle_insights(
    cycle_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> CycleInsightsOut:
    cycle = await _load_cycle_with_access(cycle_id, db, current_user.id)

    # Use TimescaleDB time_bucket to aggregate daily average temperatures
    result = await db.execute(
        select(
            func.time_bucket(text("'1 day'"), SensorReading.time).label('day'),
            func.avg(SensorReading.temperature_c).label('avg_temp')
        )
        .where(
            SensorReading.device_id == cycle.device_id,
            SensorReading.time >= cycle.started_at,
            SensorReading.time <= (cycle.ended_at or datetime.now(timezone.utc))
        )
        .group_by('day')
        .order_by('day')
    )

    daily_temps = result.all()

    degree_days = 0.0
    latest_temp = None
    for row in daily_temps:
        avg_t = row.avg_temp
        if avg_t is not None:
            latest_temp = avg_t
            if avg_t > 20:
                degree_days += (avg_t - 20)

    TARGET_DEGREE_DAYS = 500.0
    percent_complete = min(100, int((degree_days / TARGET_DEGREE_DAYS) * 100))

    if latest_temp is None:
        current_phase = "Initializing"
    elif latest_temp > 45:
        current_phase = "Thermophilic (Active Composting)"
    elif latest_temp > 30:
        current_phase = "Mesophilic (Warming/Cooling)"
    else:
        current_phase = "Maturation (Curing)"

    estimated_completion_date = None
    if percent_complete < 100 and latest_temp and latest_temp > 20:
        remaining_dd = TARGET_DEGREE_DAYS - degree_days
        current_rate = latest_temp - 20
        days_remaining = remaining_dd / current_rate
        estimated_completion_date = datetime.now(timezone.utc) + timedelta(days=days_remaining)
    elif percent_complete >= 100:
        estimated_completion_date = cycle.ended_at or datetime.now(timezone.utc)

    recommendations = []
    if current_phase == "Initializing":
        recommendations.append("Insufficient data. Ensure the composter is running.")
    elif current_phase == "Maturation (Curing)" and percent_complete < 50:
        recommendations.append("Temperature is dropping prematurely. Consider adding green, nitrogen-rich waste.")
    elif current_phase == "Thermophilic (Active Composting)":
        recommendations.append("Optimal composting temperature achieved. Maintain aeration.")
    
    if percent_complete >= 100:
        recommendations.append("Compost is fully cured and ready to use!")

    return CycleInsightsOut(
        estimated_completion_date=estimated_completion_date,
        current_phase=current_phase,
        degree_days_accumulated=round(degree_days, 1),
        percent_complete=percent_complete,
        recommendations=recommendations
    )

