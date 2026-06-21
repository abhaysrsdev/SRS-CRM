from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

party_tag_link = Table(
    "party_tag_link",
    Base.metadata,
    Column("party_id", String, ForeignKey("parties.id"), primary_key=True),
    Column("tag_id", String, ForeignKey("party_tags.id"), primary_key=True)
)

class PartyTag(Base):
    __tablename__ = "party_tags"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String)  # 'Price Range', 'Colors', etc.
    
    parties = relationship("Party", secondary=party_tag_link, back_populates="tags")

class Party(Base):
    __tablename__ = "parties"
    id = Column(String, primary_key=True, index=True) # E.g., 'CUS0001'
    name = Column(String, index=True, nullable=False)
    mobile_number = Column(String, index=True)
    address = Column(String)
    state = Column(String, index=True)
    business_type = Column(String)
    gst_number = Column(String, index=True)
    party_score = Column(Float, default=0.0)
    last_contacted_date = Column(DateTime(timezone=True))
    segment = Column(String, index=True)
    purchase_frequency = Column(Integer, default=0)
    revenue_generated = Column(Float, default=0.0)
    average_order_value = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tags = relationship("PartyTag", secondary=party_tag_link, back_populates="parties")
    transactions = relationship("Transaction", back_populates="party", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="party", cascade="all, delete-orphan")
