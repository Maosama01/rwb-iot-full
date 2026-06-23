import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.db.models.plant import Plant
from app.db.models.compost_application import CompostApplication
from app.schemas.plant import (
    PlantCreate,
    PlantResponse,
    PlantUpdate,
    CompostApplicationCreate,
    CompostApplicationResponse,
)

router = APIRouter(prefix="/plants", tags=["Plants"])

@router.get("", response_model=list[PlantResponse], summary="List my plants")
async def list_plants(current_user: CurrentUser, db: DbSession) -> Any:
    result = await db.execute(
        select(Plant)
        .where(Plant.user_id == current_user.id)
        .order_by(Plant.created_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=PlantResponse, summary="Add a new plant")
async def create_plant(
    in_data: PlantCreate, current_user: CurrentUser, db: DbSession
) -> Any:
    plant = Plant(
        user_id=current_user.id,
        name=in_data.name,
        plant_type=in_data.plant_type,
    )
    db.add(plant)
    await db.commit()
    await db.refresh(plant)
    return plant

@router.get("/{plant_id}", response_model=PlantResponse, summary="Get a plant")
async def get_plant(
    plant_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> Any:
    plant = await db.get(Plant, plant_id)
    if not plant or plant.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant

@router.post(
    "/{plant_id}/applications",
    response_model=CompostApplicationResponse,
    summary="Apply compost to a plant",
)
async def apply_compost(
    plant_id: uuid.UUID,
    in_data: CompostApplicationCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> Any:
    # Verify plant ownership
    plant = await db.get(Plant, plant_id)
    if not plant or plant.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Plant not found")

    application = CompostApplication(
        plant_id=plant_id,
        compost_cycle_id=in_data.compost_cycle_id,
        amount_kg=in_data.amount_kg,
        notes=in_data.notes,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application

@router.get(
    "/{plant_id}/applications",
    response_model=list[CompostApplicationResponse],
    summary="List compost applications for a plant",
)
async def list_applications(
    plant_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> Any:
    plant = await db.get(Plant, plant_id)
    if not plant or plant.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Plant not found")

    result = await db.execute(
        select(CompostApplication)
        .where(CompostApplication.plant_id == plant_id)
        .order_by(CompostApplication.applied_at.desc())
    )
    return result.scalars().all()
