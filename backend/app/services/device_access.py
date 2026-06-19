"""
app/services/device_access.py
──────────────────────────────
Device membership helpers for the equal-access sharing model.

A user may act on a device iff a `user_devices` row links them.  These helpers
centralise that check so every route (telemetry history, status, alerts,
config, cycles, waste logs) enforces access identically.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.device import Device
from app.db.models.user_device import UserDevice


async def is_member(db: AsyncSession, device_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Return True if *user_id* is linked to *device_id*."""
    result = await db.execute(
        select(UserDevice.user_id).where(
            UserDevice.device_id == device_id,
            UserDevice.user_id == user_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def assert_device_member(
    db: AsyncSession, device_id: uuid.UUID, user_id: uuid.UUID
) -> Device:
    """
    Load *device_id* and confirm *user_id* is a member.

    Returns the Device on success.  Raises 404 if the device does not exist or
    the user is not a member (a uniform 404 avoids leaking device existence to
    non-members).
    """
    result = await db.execute(select(Device).where(Device.id == device_id))
    device: Device | None = result.scalar_one_or_none()

    if device is None or not await is_member(db, device_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found."
        )
    return device


async def add_member(
    db: AsyncSession, device_id: uuid.UUID, user_id: uuid.UUID, is_owner: bool = False
) -> bool:
    """
    Link *user_id* to *device_id*. Idempotent.

    Returns True if a new link was created, False if it already existed.
    """
    if await is_member(db, device_id, user_id):
        return False
    db.add(UserDevice(device_id=device_id, user_id=user_id, is_owner=is_owner))
    await db.flush()
    return True

async def assert_device_owner(
    db: AsyncSession, device_id: uuid.UUID, user_id: uuid.UUID
) -> Device:
    """
    Load *device_id* and confirm *user_id* is the owner.

    Returns the Device on success. Raises 404 if the device does not exist,
    and 403 if the user is a member but not the owner.
    """
    device = await assert_device_member(db, device_id, user_id)
    
    result = await db.execute(
        select(UserDevice.is_owner).where(
            UserDevice.device_id == device_id,
            UserDevice.user_id == user_id,
        )
    )
    is_owner = result.scalar_one_or_none()
    
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the device owner can perform this action."
        )
    return device


async def remove_member(
    db: AsyncSession, device_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    """Unlink *user_id* from *device_id* (no error if the link is absent)."""
    result = await db.execute(
        select(UserDevice).where(
            UserDevice.device_id == device_id,
            UserDevice.user_id == user_id,
        )
    )
    link = result.scalar_one_or_none()
    if link is not None:
        await db.delete(link)


async def member_count(db: AsyncSession, device_id: uuid.UUID) -> int:
    """Return how many users are linked to *device_id*."""
    from sqlalchemy import func

    result = await db.execute(
        select(func.count())
        .select_from(UserDevice)
        .where(UserDevice.device_id == device_id)
    )
    return int(result.scalar_one())
