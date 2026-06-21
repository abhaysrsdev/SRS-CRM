from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.repositories.base import CRUDBase
from app.models.sales_order import SalesOrder

class CRUDSalesOrder(CRUDBase[SalesOrder]):
    async def get_multi_with_filters(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 1000,
        search: Optional[str] = None,
        customer_name: Optional[str] = None,
    ) -> List[SalesOrder]:
        query = select(SalesOrder)
        if customer_name:
            query = query.filter(SalesOrder.customer_name == customer_name)
        if search:
            query = query.filter(
                (SalesOrder.customer_name.icontains(search)) |
                (SalesOrder.product_code.icontains(search)) |
                (SalesOrder.broker.icontains(search)) |
                (SalesOrder.city_name.icontains(search))
            )
        query = query.order_by(SalesOrder.date.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

sales_order_repo = CRUDSalesOrder(SalesOrder)
