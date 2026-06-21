from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class SalesOrder(Base):
    __tablename__ = "sales_orders"
    id = Column(String, primary_key=True, index=True) # generated unique id
    date = Column(DateTime(timezone=True), index=True)
    customer_name = Column(String, index=True, nullable=False)
    gst_number = Column(String)
    broker = Column(String)
    order_no = Column(Integer, index=True)
    city_name = Column(String)
    catalog = Column(String)
    vol = Column(String)
    product_code = Column(String, index=True)
    packing = Column(String)
    color = Column(String)
    order_pcs = Column(Integer, default=0)
    disp_pcs = Column(Integer, default=0)
    bal_pcs = Column(Integer, default=0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    over_due_days = Column(Integer, default=0)
    due_days = Column(Integer, default=0)
    sales_man = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
