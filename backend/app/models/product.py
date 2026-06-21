from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, index=True) # E.g., 'PRD0001'
    name = Column(String, index=True, nullable=False)
    design_code = Column(String, index=True)
    image_url = Column(String)
    category = Column(String, index=True) # E.g., 'Bestsellers'
    color = Column(String)
    price_bucket = Column(String)
    demand_score = Column(Float, default=0.0)
    stock_quantity = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    gallery_images = Column(String, default="[]")

    transactions = relationship("Transaction", back_populates="product")
