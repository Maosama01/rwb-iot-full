import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class PlantBase(BaseModel):
    name: str
    plant_type: str = "other"

class PlantCreate(PlantBase):
    pass

class PlantUpdate(BaseModel):
    name: str | None = None
    plant_type: str | None = None

class PlantResponse(PlantBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

class CompostApplicationBase(BaseModel):
    compost_cycle_id: uuid.UUID | None = None
    amount_kg: float | None = None
    notes: str | None = None

class CompostApplicationCreate(CompostApplicationBase):
    pass

class CompostApplicationResponse(CompostApplicationBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    plant_id: uuid.UUID
    applied_at: datetime
