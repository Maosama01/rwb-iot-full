import uuid
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

class Plant(Base, TimestampMixin):
    __tablename__ = "plants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    plant_type: Mapped[str] = mapped_column(String(50), nullable=False, default="other")

    user: Mapped["User"] = relationship("User", lazy="select")  # noqa: F821
    applications: Mapped[list["CompostApplication"]] = relationship( # noqa: F821
        "CompostApplication", back_populates="plant", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Plant id={self.id} name={self.name} user={self.user_id}>"
