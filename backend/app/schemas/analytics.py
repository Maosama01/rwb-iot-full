from datetime import datetime
from typing import Any
from pydantic import BaseModel

class AnalyticsCompareResponse(BaseModel):
    series: list[dict[str, Any]]
    devices: dict[str, str]

class PredictiveInsightsResponse(BaseModel):
    current_phase: str
    health_score: int
    estimated_days_remaining: int
    ideal_temperature: float
    ideal_humidity: float
    phase_started_at: datetime | None = None
