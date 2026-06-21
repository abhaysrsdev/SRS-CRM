import os
import aiofiles
import httpx
from io import BytesIO
from PIL import Image

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cache", "thumbnails")

def get_thumbnail_path(drive_file_id: str, size: int) -> str:
    """Returns local path if exists, else None."""
    filename = f"{drive_file_id}_{size}.webp"
    file_path = os.path.join(CACHE_DIR, filename)
    if os.path.exists(file_path):
        return file_path
    return None

async def create_thumbnail_background(drive_file_id: str, size: int):
    """Background task to fetch and convert to WebP."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    filename = f"{drive_file_id}_{size}.webp"
    file_path = os.path.join(CACHE_DIR, filename)
    
    if os.path.exists(file_path):
        return

    url = f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w{size}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://drive.google.com/',
    }
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            image_data = resp.content

        img = Image.open(BytesIO(image_data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        
        buffer = BytesIO()
        img.save(buffer, format="WEBP", quality=85)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(buffer.getvalue())
            
        # Optional: We could update the database here, but the file existence is enough.
    except Exception as e:
        print(f"Failed to background cache image {drive_file_id}_{size}: {e}")
