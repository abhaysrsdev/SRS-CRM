from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import Response, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from collections import OrderedDict
import asyncio

from app.db.session import get_db
from app.repositories.catalog import folder_repo, image_repo
from app.schemas import catalog as schemas
from app.core.sync_engine import global_sync_state, start_background_sync
from sqlalchemy import update
from app.models.catalog import CatalogImage

router = APIRouter()

# ── In-memory LRU image cache ──────────────────────────────────────────────
_IMAGE_CACHE_MAX = 500          # max images kept in RAM
_image_cache: OrderedDict[str, tuple[bytes, str]] = OrderedDict()  # key → (data, content_type)
_cache_lock = asyncio.Lock()

async def _get_cached(cache_key: str):
    async with _cache_lock:
        if cache_key in _image_cache:
            _image_cache.move_to_end(cache_key)   # mark as recently used
            return _image_cache[cache_key]
    return None

async def _put_cached(cache_key: str, data: bytes, content_type: str):
    async with _cache_lock:
        if len(_image_cache) >= _IMAGE_CACHE_MAX:
            _image_cache.popitem(last=False)       # evict least-recently used
        _image_cache[cache_key] = (data, content_type)

PROXY_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Referer': 'https://drive.google.com/',
}

@router.get("/image-proxy")
async def proxy_drive_image(
    id: str = Query(..., description="Google Drive file ID"),
    sz: int = Query(600, description="Image width in pixels"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
) -> Response:
    """
    Returns the locally cached WebP image if it exists.
    If it does not exist, triggers a background cache job and INSTANTLY redirects
    the user to the Google Drive direct URL so the UI doesn't block.
    """
    if not id:
        raise HTTPException(status_code=400, detail="Missing id parameter")
        
    if sz <= 150:
        target_sz = 150
    elif sz <= 300:
        target_sz = 300
    else:
        target_sz = 600

    from app.core.image_cache import get_thumbnail_path, create_thumbnail_background
    file_path = get_thumbnail_path(id, target_sz)

    if file_path:
        import aiofiles
        async with aiofiles.open(file_path, "rb") as f:
            data = await f.read()

        # Update DB asynchronously to reflect cache status (best effort)
        # We don't block the response for this
        try:
            update_data = {"cache_status": True}
            if target_sz == 150: update_data["thumbnail_150"] = file_path
            elif target_sz == 300: update_data["thumbnail_300"] = file_path
            else: update_data["thumbnail_600"] = file_path

            stmt = update(CatalogImage).where(CatalogImage.drive_file_id == id).values(**update_data)
            await db.execute(stmt)
            await db.commit()
        except Exception:
            pass # Ignore DB update errors on read path

        return Response(
            content=data, 
            media_type="image/webp", 
            headers={
                "Cache-Control": "public, max-age=31536000",
                "X-Cache": "HIT"
            }
        )
    else:
        # Trigger background caching
        background_tasks.add_task(create_thumbnail_background, id, target_sz)
        
        # Redirect to Google Drive URL instantly so UI loads immediately
        drive_url = f"https://drive.google.com/thumbnail?id={id}&sz=w{target_sz}"
        return RedirectResponse(url=drive_url, status_code=302)

@router.get("/folders/", response_model=List[schemas.CatalogFolder])
async def read_folders(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    sort_by: Optional[str] = None
) -> Any:
    folders = await folder_repo.get_folders(db, skip=skip, limit=limit, search=search, sort_by=sort_by)
    return folders

@router.get("/folders/{folder_id}/images", response_model=List[schemas.CatalogImage])
async def read_folder_images(
    folder_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    images = await image_repo.get_by_folder(db, folder_id=folder_id)
    return images

@router.post("/sync/", response_model=schemas.SyncStatusResponse)
async def trigger_sync(
    payload: schemas.SyncRequest,
) -> Any:
    if global_sync_state.is_syncing:
        raise HTTPException(status_code=400, detail="Sync already in progress")
    
    # Start background sync task
    start_background_sync(re_sync=payload.re_sync)
    
    return schemas.SyncStatusResponse(
        is_syncing=True,
        progress="Starting sync task...",
        logs=global_sync_state.logs,
        total_folders=global_sync_state.total_folders,
        total_images=global_sync_state.total_images,
        last_sync=global_sync_state.last_sync
    )

@router.get("/sync/status", response_model=schemas.SyncStatusResponse)
async def get_sync_status() -> Any:
    return schemas.SyncStatusResponse(
        is_syncing=global_sync_state.is_syncing,
        progress=global_sync_state.progress,
        logs=global_sync_state.logs,
        total_folders=global_sync_state.total_folders,
        total_images=global_sync_state.total_images,
        last_sync=global_sync_state.last_sync
    )

@router.get("/reports/", response_model=schemas.ErrorReportResponse)
async def get_error_reports() -> Any:
    return schemas.ErrorReportResponse(
        empty_folders=global_sync_state.errors["empty_folders"],
        broken_images=global_sync_state.errors["broken_images"],
        missing_images=global_sync_state.errors["missing_images"],
        duplicate_folders=global_sync_state.errors["duplicate_folders"]
    )
