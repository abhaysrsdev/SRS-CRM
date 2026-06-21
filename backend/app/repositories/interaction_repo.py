from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.repositories.base import CRUDBase
from app.models.interaction import Interaction

class CRUDInteraction(CRUDBase[Interaction]):
    async def get_by_party_id(self, db: AsyncSession, party_id: str) -> List[Interaction]:
        result = await db.execute(
            select(Interaction).filter(Interaction.party_id == party_id).order_by(Interaction.contact_date.desc())
        )
        return list(result.scalars().all())

interaction_repo = CRUDInteraction(Interaction)
