from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CatalogImageBase(BaseModel):
    image_name: str
    image_url: str
    is_cover: bool = False
    sort_order: int = 0

class CatalogImageCreate(CatalogImageBase):
    folder_id: int

class CatalogImage(CatalogImageBase):
    id: int
    folder_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CatalogFolderBase(BaseModel):
    folder_name: str
    drive_folder_id: str
    image_count: int = 0
    thumbnail_url: Optional[str] = None
    last_sync: Optional[datetime] = None

class CatalogFolderCreate(CatalogFolderBase):
    pass

class CatalogFolder(CatalogFolderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SyncStatusResponse(BaseModel):
    is_syncing: bool
    progress: str
    logs: List[str]
    total_folders: int
    total_images: int
    last_sync: Optional[datetime] = None

class SyncRequest(BaseModel):
    re_sync: bool = False

class ErrorReportResponse(BaseModel):
    empty_folders: List[str]
    broken_images: List[str]
    missing_images: List[str]
    duplicate_folders: List[str]
