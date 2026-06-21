from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.interaction_repo import interaction_repo
from app.schemas.interaction import Interaction, InteractionCreate

router = APIRouter()

@router.get("/", response_model=List[Interaction])
async def read_interactions(
    db: AsyncSession = Depends(get_db),
    party_id: str = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    if party_id:
        interactions = await interaction_repo.get_by_party_id(db, party_id=party_id)
    else:
        interactions = await interaction_repo.get_multi(db, skip=skip, limit=limit)
    return interactions

@router.post("/", response_model=Interaction)
async def create_interaction(
    *,
    db: AsyncSession = Depends(get_db),
    interaction_in: InteractionCreate,
) -> Any:
    interaction = await interaction_repo.create(db=db, obj_in=interaction_in.model_dump())
    return interaction
