from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.repositories.base import CRUDBase
from app.models.product import Product

class CRUDProduct(CRUDBase[Product]):
    async def get_all(self, db: AsyncSession) -> List[Product]:
        result = await db.execute(select(Product))
        return list(result.scalars().all())

product_repo = CRUDProduct(Product)
