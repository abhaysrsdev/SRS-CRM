from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.sales_order_repo import sales_order_repo
from app.schemas.sales_order import SalesOrder, SalesOrderCreate, SalesOrderUpdate
from app.schemas.response import ResponseModel

router = APIRouter()

@router.get("/", response_model=List[SalesOrder])
async def read_sales_orders(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 1000,
    search: Optional[str] = None,
    customer_name: Optional[str] = None,
) -> Any:
    orders = await sales_order_repo.get_multi_with_filters(
        db, skip=skip, limit=limit, search=search, customer_name=customer_name
    )
    return orders

@router.get("/{order_id}", response_model=SalesOrder)
async def read_sales_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    order = await sales_order_repo.get(db=db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return order

@router.post("/", response_model=ResponseModel[SalesOrder])
async def create_sales_order(
    *,
    db: AsyncSession = Depends(get_db),
    order_in: SalesOrderCreate,
) -> Any:
    order = await sales_order_repo.create(db=db, obj_in=order_in)
    return ResponseModel(success=True, message="Sales order created successfully", data=order)

@router.post("/bulk", response_model=ResponseModel[List[SalesOrder]])
async def create_sales_orders_bulk(
    *,
    db: AsyncSession = Depends(get_db),
    orders_in: List[SalesOrderCreate],
) -> Any:
    # simple bulk loop
    created_orders = []
    for order_in in orders_in:
        order = await sales_order_repo.create(db=db, obj_in=order_in)
        created_orders.append(order)
    return ResponseModel(success=True, message=f"Bulk imported {len(created_orders)} sales orders successfully", data=created_orders)

@router.put("/{order_id}", response_model=ResponseModel[SalesOrder])
async def update_sales_order(
    *,
    db: AsyncSession = Depends(get_db),
    order_id: str,
    order_in: SalesOrderUpdate,
) -> Any:
    order = await sales_order_repo.get(db=db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    order = await sales_order_repo.update(db=db, db_obj=order, obj_in=order_in)
    return ResponseModel(success=True, message="Sales order updated successfully", data=order)
