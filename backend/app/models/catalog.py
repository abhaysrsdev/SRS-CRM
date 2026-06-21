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
    cache_status = Column(Boolean, default=False)

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
    
    drive_file_id = Column(String, index=True, nullable=True)
    thumbnail_150 = Column(String, nullable=True)
    thumbnail_300 = Column(String, nullable=True)
    thumbnail_600 = Column(String, nullable=True)
    cache_status = Column(Boolean, default=False)

    folder = relationship("CatalogFolder", back_populates="images")

class CatalogSyncLog(Base):
    __tablename__ = "catalog_sync_logs"
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="running")
    folders_synced = Column(Integer, default=0)
    images_processed = Column(Integer, default=0)
    error_details = Column(String, nullable=True)

