import asyncio
from app.db.session import AsyncSessionLocal
from app.db.models.user import User
from app.db.models.device import Device
from app.core.security import hash_password
from app.services import device_access
import uuid
import sys

async def seed():
    async with AsyncSessionLocal() as db:
        # Create a user
        user = User(
            email="test@rawbin.local",
            password_hash=hash_password("password123"),
            display_name="Test User",
            phone="+1234567890"
        )
        db.add(user)
        await db.flush()
        
        # Create a device
        device = Device(
            hardware_uid="SIMULATOR-001",
            display_name="Kitchen Bin",
            device_secret_enc="secret"
        )
        db.add(device)
        await db.flush()
        
        # Link user and device
        await device_access.add_member(db, device.id, user.id, is_owner=True)
        await db.commit()
        
        print(device.id)

if __name__ == "__main__":
    asyncio.run(seed())
