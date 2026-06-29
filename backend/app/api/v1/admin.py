"""
app/api/v1/admin.py
────────────────────
Operator/admin dashboard API — read-only, cross-tenant views.

  GET /api/v1/admin/overview   – summary counts for the dashboard tiles
  GET /api/v1/admin/users      – all users (+ device count)
  GET /api/v1/admin/devices    – all devices (+ member count, last reading)
  GET /api/v1/admin/readings   – recent sensor readings across all devices
  GET /api/v1/admin/alerts     – recent alert events across all devices
  GET /api/v1/admin/cycles     – compost cycles across all devices
  GET /api/v1/admin/waste      – recent waste logs across all devices

Every route depends on `AdminUser` (app.api.deps.require_admin): the caller
must be authenticated AND have is_admin=True, otherwise 403.

Unlike the per-user API — where every query is filtered to the caller's own
devices (the multi-tenant security boundary) — these queries intentionally
drop that filter so an operator sees ALL tenants' data. The safety therefore
does NOT live in the queries; it lives in the single require_admin gate on
every route.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.api.deps import AdminUser, DbSession
from app.db.models.alert_event import AlertEvent
from app.db.models.compost_cycle import CompostCycle
from app.db.models.device import Device
from app.db.models.sensor_reading import SensorReading
from app.db.models.user import User
from app.db.models.user_device import UserDevice
from app.db.models.waste_log import WasteLog
from app.schemas.admin import (
    AdminAlertRow,
    AdminCycleRow,
    AdminDeviceRow,
    AdminMe,
    AdminReadingRow,
    AdminUserRow,
    AdminWasteRow,
    OverviewStats,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Identity ─────────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=AdminMe,
    summary="Confirm the caller is an operator (used by the admin app on login)",
)
async def get_me(admin: AdminUser) -> AdminMe:
    # If we reach here, require_admin already proved is_admin=True.
    return AdminMe.model_validate(admin)


# ── Overview ─────────────────────────────────────────────────────────────────

@router.get(
    "/overview",
    response_model=OverviewStats,
    summary="Dashboard summary counts",
)
async def get_overview(admin: AdminUser, db: DbSession) -> OverviewStats:
    """Fan out a handful of COUNT/MAX queries into the summary tiles."""
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)

    async def _scalar(stmt) -> int:
        return (await db.execute(stmt)).scalar_one()

    return OverviewStats(
        total_users=await _scalar(select(func.count()).select_from(User)),
        active_users=await _scalar(
            select(func.count()).select_from(User).where(User.is_active.is_(True))
        ),
        admin_users=await _scalar(
            select(func.count()).select_from(User).where(User.is_admin.is_(True))
        ),
        total_devices=await _scalar(select(func.count()).select_from(Device)),
        paired_devices=await _scalar(
            select(func.count()).select_from(Device).where(Device.is_paired.is_(True))
        ),
        total_readings=await _scalar(select(func.count()).select_from(SensorReading)),
        readings_last_24h=await _scalar(
            select(func.count())
            .select_from(SensorReading)
            .where(SensorReading.time >= since_24h)
        ),
        latest_reading_at=(
            await db.execute(select(func.max(SensorReading.time)))
        ).scalar_one_or_none(),
        active_cycles=await _scalar(
            select(func.count())
            .select_from(CompostCycle)
            .where(CompostCycle.status == "active")
        ),
        total_alerts=await _scalar(select(func.count()).select_from(AlertEvent)),
        unacknowledged_alerts=await _scalar(
            select(func.count())
            .select_from(AlertEvent)
            .where(AlertEvent.acknowledged.is_(False))
        ),
    )


# ── Users ────────────────────────────────────────────────────────────────────

@router.get(
    "/users",
    response_model=list[AdminUserRow],
    summary="List all users with their device count",
)
async def list_users(admin: AdminUser, db: DbSession) -> list[AdminUserRow]:
    # Correlated subquery: how many devices is each user linked to?
    device_count = (
        select(func.count(UserDevice.device_id))
        .where(UserDevice.user_id == User.id)
        .scalar_subquery()
    )
    stmt = (
        select(User, device_count.label("device_count"))
        .order_by(User.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        AdminUserRow(
            id=u.id,
            email=u.email,
            phone=u.phone,
            display_name=u.display_name,
            is_active=u.is_active,
            is_admin=u.is_admin,
            created_at=u.created_at,
            device_count=count,
        )
        for u, count in rows
    ]


# ── Devices ──────────────────────────────────────────────────────────────────

@router.get(
    "/devices",
    response_model=list[AdminDeviceRow],
    summary="List all devices with member count and last-seen time",
)
async def list_devices(admin: AdminUser, db: DbSession) -> list[AdminDeviceRow]:
    member_count = (
        select(func.count(UserDevice.user_id))
        .where(UserDevice.device_id == Device.id)
        .scalar_subquery()
    )
    last_reading = (
        select(func.max(SensorReading.time))
        .where(SensorReading.device_id == Device.id)
        .scalar_subquery()
    )
    stmt = (
        select(
            Device,
            member_count.label("member_count"),
            last_reading.label("last_reading_at"),
        )
        .order_by(Device.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        AdminDeviceRow(
            id=d.id,
            hardware_uid=d.hardware_uid,
            display_name=d.display_name,
            is_paired=d.is_paired,
            firmware_version=d.firmware_version,
            created_at=d.created_at,
            member_count=members,
            last_reading_at=last_at,
        )
        for d, members, last_at in rows
    ]


# ── Telemetry / readings ─────────────────────────────────────────────────────

@router.get(
    "/readings",
    response_model=list[AdminReadingRow],
    summary="Recent sensor readings across all devices",
)
async def list_readings(
    admin: AdminUser,
    db: DbSession,
    device_id: uuid.UUID | None = Query(
        None, description="Optional: restrict to a single device."
    ),
    limit: int = Query(100, ge=1, le=1000),
) -> list[AdminReadingRow]:
    stmt = (
        select(SensorReading, Device.display_name)
        .join(Device, SensorReading.device_id == Device.id)
        .order_by(SensorReading.time.desc())
        .limit(limit)
    )
    if device_id is not None:
        stmt = stmt.where(SensorReading.device_id == device_id)

    rows = (await db.execute(stmt)).all()
    return [
        AdminReadingRow(
            device_id=r.device_id,
            device_name=name,
            time=r.time,
            temperature_c=r.temperature_c,
            humidity_pct=r.humidity_pct,
            co2_ppm=r.co2_ppm,
            ph_level=r.ph_level,
            fill_level_pct=r.fill_level_pct,
            weight_kg=r.weight_kg,
            firmware_version=r.firmware_version,
        )
        for r, name in rows
    ]


# ── Alerts ───────────────────────────────────────────────────────────────────

@router.get(
    "/alerts",
    response_model=list[AdminAlertRow],
    summary="Recent alert events across all devices",
)
async def list_alerts(
    admin: AdminUser,
    db: DbSession,
    limit: int = Query(100, ge=1, le=1000),
) -> list[AdminAlertRow]:
    stmt = select(AlertEvent).order_by(AlertEvent.created_at.desc()).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [AdminAlertRow.model_validate(a) for a in rows]


# ── Compost cycles ───────────────────────────────────────────────────────────

@router.get(
    "/cycles",
    response_model=list[AdminCycleRow],
    summary="Compost cycles across all devices",
)
async def list_cycles(
    admin: AdminUser,
    db: DbSession,
    limit: int = Query(200, ge=1, le=1000),
) -> list[AdminCycleRow]:
    stmt = select(CompostCycle).order_by(CompostCycle.started_at.desc()).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [AdminCycleRow.model_validate(c) for c in rows]


# ── Waste logs ───────────────────────────────────────────────────────────────

@router.get(
    "/waste",
    response_model=list[AdminWasteRow],
    summary="Recent waste logs across all devices",
)
async def list_waste(
    admin: AdminUser,
    db: DbSession,
    limit: int = Query(200, ge=1, le=1000),
) -> list[AdminWasteRow]:
    stmt = select(WasteLog).order_by(WasteLog.logged_at.desc()).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [AdminWasteRow.model_validate(w) for w in rows]
