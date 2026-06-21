from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    id: str
    name: str
    design_code: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    price_bucket: Optional[str] = None
    demand_score: float = 0.0
    stock_quantity: int = 0
    gallery_images: Optional[str] = "[]"

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    design_code: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    price_bucket: Optional[str] = None
    demand_score: Optional[float] = None
    stock_quantity: Optional[int] = None
    gallery_images: Optional[str] = None

class Product(ProductBase):
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
