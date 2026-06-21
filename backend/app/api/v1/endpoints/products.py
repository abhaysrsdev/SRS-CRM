from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.product_repo import product_repo
from app.schemas.product import Product
from app.schemas.response import ResponseModel

router = APIRouter()

@router.get("/", response_model=List[Product])
async def read_products(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    products = await product_repo.get_multi(db, skip=skip, limit=limit)
    return products

@router.get("/{product_id}", response_model=Product)
async def read_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    product = await product_repo.get(db=db, id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
