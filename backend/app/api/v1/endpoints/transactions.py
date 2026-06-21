from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.transaction_repo import transaction_repo
from app.schemas.transaction import Transaction

router = APIRouter()

@router.get("/", response_model=List[Transaction])
async def read_transactions(
    db: AsyncSession = Depends(get_db),
    party_id: str = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    if party_id:
        transactions = await transaction_repo.get_by_party_id(db, party_id=party_id)
    else:
        transactions = await transaction_repo.get_multi(db, skip=skip, limit=limit)
    return transactions
