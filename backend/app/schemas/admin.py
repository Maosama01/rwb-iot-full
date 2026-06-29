"""
app/schemas/admin.py
─────────────────────
Pydantic v2 response schemas for the operator/admin dashboard
(/api/v1/admin/*).

These are READ-ONLY views aggregating data across all tenants. The regular
per-user API never exposes cross-tenant data; the admin surface does, which is
why every route using these schemas is gated by the require_admin dependency.

Schemas that map directly onto one ORM row set `from_attributes=True` so they
can be built with `Model.model_validate(orm_row)`. Rows that include computed
aggregates (counts, "last seen") are constructed explicitly in the router.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ── Identity ─────────────────────────────────────────────────────────────────

class AdminMe(BaseModel):
    """
    Returned by GET /admin/me. The admin app calls this right after login to
    confirm the account is an operator before showing the dashboard. Because
    the route is gated by require_admin, a 200 here already proves is_admin.
    """

    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    display_name: str
    is_admin: bool


# ── Overview ─────────────────────────────────────────────────────────────────

class OverviewStats(BaseModel):
    """Top-of-dashboard summary tiles — one fan-out of COUNT queries."""

    total_users: int
    active_users: int
    admin_users: int

    total_devices: int
    paired_devices: int

    total_readings: int
    readings_last_24h: int
    latest_reading_at: Optional[datetime] = None

    active_cycles: int
    total_alerts: int
    unacknowledged_alerts: int


# ── Users ────────────────────────────────────────────────────────────────────

class AdminUserRow(BaseModel):
    """One row in the admin Users table. device_count is computed."""

    id: uuid.UUID
    email: str
    phone: Optional[str] = None
    display_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    device_count: int


# ── Devices ──────────────────────────────────────────────────────────────────

class AdminDeviceRow(BaseModel):
    """One row in the admin Devices table. member_count / last_reading_at computed."""

    id: uuid.UUID
    hardware_uid: str
    display_name: str
    is_paired: bool
    firmware_version: Optional[str] = None
    created_at: datetime
    member_count: int
    last_reading_at: Optional[datetime] = None


# ── Telemetry / readings ─────────────────────────────────────────────────────

class AdminReadingRow(BaseModel):
    """A single sensor reading, with the device's display name joined in."""

    model_config = {"from_attributes": True}

    device_id: uuid.UUID
    device_name: Optional[str] = None
    time: datetime
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    co2_ppm: Optional[float] = None
    ph_level: Optional[float] = None
    fill_level_pct: Optional[float] = None
    weight_kg: Optional[float] = None
    firmware_version: Optional[str] = None


# ── Alerts ───────────────────────────────────────────────────────────────────

class AdminAlertRow(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    device_id: uuid.UUID
    metric: str
    severity: str
    value: float
    threshold: float
    message: str
    reading_time: datetime
    notified: bool
    acknowledged: bool
    created_at: datetime


# ── Compost cycles ───────────────────────────────────────────────────────────

class AdminCycleRow(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    device_id: uuid.UUID
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    label: Optional[str] = None
    created_at: datetime


# ── Waste logs ───────────────────────────────────────────────────────────────

class AdminWasteRow(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    device_id: uuid.UUID
    compost_cycle_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    waste_type: str
    weight_kg: Optional[float] = None
    logged_at: datetime
