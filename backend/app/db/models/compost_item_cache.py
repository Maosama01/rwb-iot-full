from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, JSON, DateTime, func
from datetime import datetime
import uuid

from app.db.base import Base

class CompostItemCache(Base):
    """
    Cache for AI responses to the 'Can It Compost?' queries.
    Stores the lowercase item name and its structured AI response to avoid repeated API calls.
    """
    __tablename__ = "compost_item_cache"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    item_name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    
    compostable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    tips: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
