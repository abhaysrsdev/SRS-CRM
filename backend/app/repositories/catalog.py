from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc
from typing import List, Optional
from app.repositories.base import CRUDBase
from app.models.catalog import CatalogFolder, CatalogImage

class CRUDCatalogFolder(CRUDBase[CatalogFolder]):
    async def get_folders(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        sort_by: Optional[str] = None
    ) -> List[CatalogFolder]:
        stmt = select(CatalogFolder)
        
        # Search
        if search:
            stmt = stmt.where(CatalogFolder.folder_name.ilike(f"%{search}%"))
        
        # Sort
        if sort_by == "alphabetical":
            stmt = stmt.order_by(asc(CatalogFolder.folder_name))
        elif sort_by == "most_images":
            stmt = stmt.order_by(desc(CatalogFolder.image_count))
        elif sort_by == "recently_synced":
            stmt = stmt.order_by(desc(CatalogFolder.last_sync))
        elif sort_by == "recently_added":
            stmt = stmt.order_by(desc(CatalogFolder.created_at))
        else:
            # Default sorting
            stmt = stmt.order_by(desc(CatalogFolder.created_at))
            
        stmt = stmt.offset(skip).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

class CRUDCatalogImage(CRUDBase[CatalogImage]):
    async def get_by_folder(self, db: AsyncSession, folder_id: int) -> List[CatalogImage]:
        stmt = select(CatalogImage).where(CatalogImage.folder_id == folder_id).order_by(asc(CatalogImage.sort_order))
        res = await db.execute(stmt)
        return list(res.scalars().all())

folder_repo = CRUDCatalogFolder(CatalogFolder)
image_repo = CRUDCatalogImage(CatalogImage)
