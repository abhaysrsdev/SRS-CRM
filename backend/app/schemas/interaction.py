from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InteractionBase(BaseModel):
    id: str
    party_id: str
    contact_date: datetime
    narration: Optional[str] = None
    discussion_notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    status: str = "Pending"

class InteractionCreate(InteractionBase):
    pass

class InteractionUpdate(BaseModel):
    contact_date: Optional[datetime] = None
    narration: Optional[str] = None
    discussion_notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    status: Optional[str] = None

class Interaction(InteractionBase):
    created_at: datetime

    class Config:
        from_attributes = True
