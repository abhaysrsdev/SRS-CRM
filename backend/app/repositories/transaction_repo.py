from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.repositories.base import CRUDBase
from app.models.transaction import Transaction

class CRUDTransaction(CRUDBase[Transaction]):
    async def get_by_party_id(self, db: AsyncSession, party_id: str) -> List[Transaction]:
        result = await db.execute(
            select(Transaction).filter(Transaction.party_id == party_id).order_by(Transaction.date.desc())
        )
        return list(result.scalars().all())

transaction_repo = CRUDTransaction(Transaction)
