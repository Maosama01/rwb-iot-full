"""
app/db/models/exchange.py
─────────────────────────
SQLAlchemy ORM model for marketplace exchanges via WhatsApp.
"""

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Exchange(Base, TimestampMixin):
    """
    Tracks marketplace exchanges booked by users with local vendors.
    """

    __tablename__ = "exchanges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vendor_phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )
    vendor_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    vendor_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="nursery",
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
    )  # pending, accepted, completed
    compost_amount: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    reward_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    action_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )  # pick_up, drop_off

    # ── Relationships ─────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Exchange id={self.id} status={self.status}>"
