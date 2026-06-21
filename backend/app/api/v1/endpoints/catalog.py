from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from collections import OrderedDict
import asyncio

from app.db.session import get_db
from app.repositories.catalog import folder_repo, image_repo
from app.schemas import catalog as schemas
from app.core.sync_engine import global_sync_state, start_background_sync

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
) -> Response:
    """Async proxy for Google Drive images with in-memory LRU cache."""
    cache_key = f"{id}:{sz}"

    # 1. Return from cache if available (instant)
    cached = await _get_cached(cache_key)
    if cached:
        data, content_type = cached
        return Response(
            content=data,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=86400", "X-Cache": "HIT"},
        )

    # 2. Fetch from Google Drive asynchronously
    url = f"https://drive.google.com/thumbnail?id={id}&sz=w{sz}"
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
            resp = await client.get(url, headers=PROXY_HEADERS)
            resp.raise_for_status()
            content_type = resp.headers.get("Content-Type", "image/jpeg")
            data = resp.content

        await _put_cached(cache_key, data, content_type)

        return Response(
            content=data,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=86400", "X-Cache": "MISS"},
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Drive image not accessible")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch image: {e}")





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
