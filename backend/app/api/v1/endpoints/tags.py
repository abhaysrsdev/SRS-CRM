from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.party_repo import party_repo
from app.schemas.party import PartyTag

router = APIRouter()

@router.get("/", response_model=List[PartyTag])
async def read_tags(
    db: AsyncSession = Depends(get_db),
) -> Any:
    tags = await party_repo.get_all_tags(db)
    return tags
