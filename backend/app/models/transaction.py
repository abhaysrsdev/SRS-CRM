from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, index=True) # E.g., 'PUR0001'
    party_id = Column(String, ForeignKey("parties.id"), index=True, nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=True) # optional, frontend purchase history might just have productName
    
    product_name = Column(String)
    category = Column(String)
    quantity = Column(Integer, default=1)
    amount = Column(Float, default=0.0)
    date = Column(DateTime(timezone=True), index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    party = relationship("Party", back_populates="transactions")
    product = relationship("Product", back_populates="transactions")
