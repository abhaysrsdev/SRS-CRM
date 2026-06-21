from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PartyTagBase(BaseModel):
    id: str
    name: str
    category: Optional[str] = None

class PartyTagCreate(PartyTagBase):
    pass

class PartyTag(PartyTagBase):
    class Config:
        from_attributes = True

class PartyBase(BaseModel):
    id: str
    name: str
    mobile_number: str
    address: str
    state: str
    business_type: str
    gst_number: str
    party_score: float = 0.0
    last_contacted_date: Optional[datetime] = None
    segment: str
    purchase_frequency: int = 0
    revenue_generated: float = 0.0
    average_order_value: float = 0.0

class PartyCreate(PartyBase):
    tags: List[str] = [] # list of tag ids

class PartyUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    business_type: Optional[str] = None
    gst_number: Optional[str] = None
    party_score: Optional[float] = None
    last_contacted_date: Optional[datetime] = None
    segment: Optional[str] = None
    tags: Optional[List[str]] = None

class Party(PartyBase):
    created_at: datetime
    tags: List[PartyTag] = []

    class Config:
        from_attributes = True
