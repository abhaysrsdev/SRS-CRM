from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SalesOrderBase(BaseModel):
    id: str
    date: datetime
    customer_name: str
    gst_number: Optional[str] = None
    broker: Optional[str] = None
    order_no: Optional[int] = None
    city_name: Optional[str] = None
    catalog: Optional[str] = None
    vol: Optional[str] = None
    product_code: Optional[str] = None
    packing: Optional[str] = None
    color: Optional[str] = None
    order_pcs: int = 0
    disp_pcs: int = 0
    bal_pcs: int = 0
    rate: float = 0.0
    amount: float = 0.0
    over_due_days: int = 0
    due_days: int = 0
    sales_man: Optional[str] = None

class SalesOrderCreate(SalesOrderBase):
    pass

class SalesOrderUpdate(BaseModel):
    date: Optional[datetime] = None
    customer_name: Optional[str] = None
    gst_number: Optional[str] = None
    broker: Optional[str] = None
    order_no: Optional[int] = None
    city_name: Optional[str] = None
    catalog: Optional[str] = None
    vol: Optional[str] = None
    product_code: Optional[str] = None
    packing: Optional[str] = None
    color: Optional[str] = None
    order_pcs: Optional[int] = None
    disp_pcs: Optional[int] = None
    bal_pcs: Optional[int] = None
    rate: Optional[float] = None
    amount: Optional[float] = None
    over_due_days: Optional[int] = None
    due_days: Optional[int] = None
    sales_man: Optional[str] = None

class SalesOrder(SalesOrderBase):
    created_at: datetime

    class Config:
        from_attributes = True
