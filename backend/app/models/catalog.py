from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class CatalogFolder(Base):
    __tablename__ = "catalog_folders"
    id = Column(Integer, primary_key=True, index=True)
    folder_name = Column(String, index=True, nullable=False)
    drive_folder_id = Column(String, unique=True, index=True, nullable=False)
    image_count = Column(Integer, default=0)
    thumbnail_url = Column(String, nullable=True)
    last_sync = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    images = relationship("CatalogImage", back_populates="folder", cascade="all, delete-orphan")

class CatalogImage(Base):
    __tablename__ = "catalog_images"
    id = Column(Integer, primary_key=True, index=True)
    folder_id = Column(Integer, ForeignKey("catalog_folders.id", ondelete="CASCADE"), nullable=False)
    image_name = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    is_cover = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    folder = relationship("CatalogFolder", back_populates="images")
