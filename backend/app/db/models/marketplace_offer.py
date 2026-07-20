"""
app/db/models/marketplace_offer.py
─────────────────────────
SQLAlchemy ORM model for marketplace offers created by vendors via WhatsApp.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MarketplaceOffer(Base):
    """
    Marketplace offers created by vendors via WhatsApp.
    """

    __tablename__ = "marketplace_offers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    vendor_phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )
    vendor_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="WhatsApp Vendor",
    )
    vendor_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="nursery",
    )
    action_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )  # pick_up, drop_off
    reward_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )  # plant, seeds, discount
    compost_required: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    plant_offered: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<MarketplaceOffer id={self.id} active={self.is_active}>"
