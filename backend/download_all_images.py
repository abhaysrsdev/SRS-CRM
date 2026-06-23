import asyncio
import sqlite3
import os
import aiohttp
from io import BytesIO
from PIL import Image

DB_PATH = 'crm.db'
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'public', 'catalog_thumbnails')
CONCURRENCY = 20

async def download_image(session, sem, drive_id):
    out_path = os.path.join(OUT_DIR, f"{drive_id}.webp")
    if os.path.exists(out_path):
        return True # already downloaded

    url = f"https://drive.google.com/thumbnail?id={drive_id}&sz=w400"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://drive.google.com/'
    }

    async with sem:
        try:
            async with session.get(url, headers=headers, allow_redirects=True, timeout=30) as resp:
                if resp.status != 200:
                    print(f"Failed {drive_id}: {resp.status}")
                    return False
                data = await resp.read()
            
            # Process image in a thread to not block asyncio loop
            def process():
                img = Image.open(BytesIO(data))
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                img.save(out_path, format="WEBP", quality=80)
            
            await asyncio.to_thread(process)
            return True
        except Exception as e:
            print(f"Error {drive_id}: {e}")
            return False

async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, image_url FROM catalog_images WHERE image_url LIKE '%drive.google.com%'")
    rows = cur.fetchall()
    
    drive_ids = []
    for row in rows:
        url = row[1]
        if 'id=' in url:
            drive_id = url.split('id=')[1].split('&')[0]
            drive_ids.append(drive_id)
            
    conn.close()

    print(f"Total images to download: {len(drive_ids)}")
    
    sem = asyncio.Semaphore(CONCURRENCY)
    
    async with aiohttp.ClientSession() as session:
        tasks = [download_image(session, sem, d_id) for d_id in drive_ids]
        
        # Run with progress
        completed = 0
        for f in asyncio.as_completed(tasks):
            res = await f
            completed += 1
            if completed % 100 == 0:
                print(f"Progress: {completed} / {len(drive_ids)}")

if __name__ == '__main__':
    asyncio.run(main())
