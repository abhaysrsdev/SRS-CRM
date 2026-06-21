from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.party_repo import party_repo
from app.repositories.transaction_repo import transaction_repo
from app.analytics.metrics import calculate_dashboard_metrics

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
) -> Any:
    parties = await party_repo.get_multi(db, limit=10000)
    transactions = await transaction_repo.get_multi(db, limit=10000)
    
    metrics = calculate_dashboard_metrics(parties, transactions)
    return metrics
