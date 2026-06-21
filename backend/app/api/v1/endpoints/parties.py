from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.party_repo import party_repo
from app.schemas.party import Party, PartyCreate, PartyUpdate
from app.schemas.response import ResponseModel

router = APIRouter()

@router.get("/", response_model=List[Party])
async def read_parties(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    segment: str = None,
) -> Any:
    parties = await party_repo.get_multi_with_filters(db, skip=skip, limit=limit, search=search, segment=segment)
    return parties

@router.get("/{party_id}", response_model=Party)
async def read_party(
    party_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    party = await party_repo.get_by_id_with_tags(db, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party

@router.post("/", response_model=ResponseModel[Party])
async def create_party(
    *,
    db: AsyncSession = Depends(get_db),
    party_in: PartyCreate,
) -> Any:
    party = await party_repo.create(db=db, obj_in=party_in.model_dump(exclude={'tags'}))
    return ResponseModel(success=True, message="Party created successfully", data=party)

@router.put("/{party_id}", response_model=ResponseModel[Party])
async def update_party(
    *,
    db: AsyncSession = Depends(get_db),
    party_id: str,
    party_in: PartyUpdate,
) -> Any:
    party = await party_repo.get(db=db, id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    party = await party_repo.update(db=db, db_obj=party, obj_in=party_in.model_dump(exclude_unset=True))
    return ResponseModel(success=True, message="Party updated successfully", data=party)
