from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionBase(BaseModel):
    id: str
    party_id: str
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None
    quantity: int = 1
    amount: float = 0.0
    date: datetime

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    amount: Optional[float] = None
    date: Optional[datetime] = None

class Transaction(TransactionBase):
    created_at: datetime

    class Config:
        from_attributes = True
