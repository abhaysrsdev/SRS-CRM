from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(String, primary_key=True, index=True)
    party_id = Column(String, ForeignKey("parties.id"), index=True, nullable=False)
    contact_date = Column(DateTime(timezone=True), index=True)
    narration = Column(String)
    discussion_notes = Column(String)
    follow_up_date = Column(DateTime(timezone=True))
    status = Column(String) # 'Completed' | 'Pending'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    party = relationship("Party", back_populates="interactions")

class VoiceNote(Base):
    __tablename__ = "voice_notes"
    id = Column(String, primary_key=True, index=True)
    party_id = Column(String, ForeignKey("parties.id"), index=True, nullable=False)
    file_path = Column(String, nullable=False)
    duration = Column(Integer) # in seconds
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    party = relationship("Party")
