from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from app.repositories.base import CRUDBase
from app.models.party import Party, PartyTag
from sqlalchemy.orm import selectinload

class CRUDParty(CRUDBase[Party]):
    async def get_by_id_with_tags(self, db: AsyncSession, party_id: str) -> Optional[Party]:
        result = await db.execute(
            select(Party).options(selectinload(Party.tags)).filter(Party.id == party_id)
        )
        return result.scalars().first()

    async def get_multi_with_filters(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100, search: Optional[str] = None, segment: Optional[str] = None
    ) -> List[Party]:
        query = select(Party).options(selectinload(Party.tags))
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Party.name.ilike(search_filter),
                    Party.mobile_number.ilike(search_filter),
                    Party.gst_number.ilike(search_filter),
                    Party.state.ilike(search_filter)
                )
            )
            
        if segment:
            query = query.filter(Party.segment == segment)
            
        result = await db.execute(query.offset(skip).limit(limit))
        return list(result.scalars().all())

    async def get_all_tags(self, db: AsyncSession) -> List[PartyTag]:
        result = await db.execute(select(PartyTag))
        return list(result.scalars().all())

party_repo = CRUDParty(Party)
