import re
import time
import urllib.request
import random
import threading
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import AsyncSessionLocal
from app.models.catalog import CatalogFolder, CatalogImage
from sqlalchemy import select, delete

MASTER_FOLDER_ID = "1qD743hkc_GWWw8bxdqhgzgeW6shquYHo"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# Thread-safe global sync state
class SyncState:
    def __init__(self):
        self.is_syncing = False
        self.progress = "Not started"
        self.logs = []
        self.total_folders = 0
        self.total_images = 0
        self.last_sync = None
        self.errors = {
            "empty_folders": [],
            "broken_images": [],
            "missing_images": [],
            "duplicate_folders": []
        }

global_sync_state = SyncState()

def log_message(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    global_sync_state.logs.append(formatted)
    print(formatted)
    # Cap logs size
    if len(global_sync_state.logs) > 500:
        global_sync_state.logs.pop(0)

def fetch_html_with_retry(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as response:
                return response.read().decode('utf-8')
        except Exception as e:
            if i == retries - 1:
                raise e
            sleep_time = (i + 1) * 2 + random.uniform(0.5, 1.5)
            time.sleep(sleep_time)

def parse_entries(html):
    pattern = r'id="entry-([a-zA-Z0-9_-]+)".*?<div class="flip-entry-list-icon">(.*?)</div>.*?class="flip-entry-title">([^<]+)</div>'
    entries = re.findall(pattern, html, re.DOTALL)
    folders = []
    files = []
    for fid, icon_html, title in entries:
        if 'Folder' in icon_html or 'folder' in icon_html:
            folders.append((title, fid))
        else:
            files.append((title, fid))
    return folders, files

async def run_sync_task(re_sync: bool = False):
    if global_sync_state.is_syncing:
        return
    
    global_sync_state.is_syncing = True
    global_sync_state.progress = "Fetching master folder from Google Drive..."
    global_sync_state.errors = {
        "empty_folders": [],
        "broken_images": [],
        "missing_images": [],
        "duplicate_folders": []
    }
    
    log_message("Starting catalog synchronization engine...")
    
    try:
        # Fetch master folder
        master_url = f"https://drive.google.com/embeddedfolderview?id={MASTER_FOLDER_ID}"
        master_html = fetch_html_with_retry(master_url)
        folders, _ = parse_entries(master_html)
        
        log_message(f"Master folder loaded. Found {len(folders)} subfolders in Google Drive.")
        global_sync_state.total_folders = len(folders)
        
        async with AsyncSessionLocal() as db:
            # Check for duplicate folder names in Google Drive
            seen_names = set()
            for name, fid in folders:
                if name in seen_names:
                    global_sync_state.errors["duplicate_folders"].append(name)
                seen_names.add(name)

            if re_sync:
                log_message("Re-Sync requested: clearing existing catalog database...")
                await db.execute(delete(CatalogImage))
                await db.execute(delete(CatalogFolder))
                await db.commit()

            count = 0
            image_count_total = 0
            
            for name, fid in folders:
                count += 1
                global_sync_state.progress = f"Scanning folder {count}/{len(folders)}: {name}..."
                
                # Sleep a little to respect Google Drive rate limits
                time.sleep(0.5)
                
                try:
                    images = []
                    queue = [(fid, "")]
                    
                    while queue:
                        current_fid, current_path = queue.pop(0)
                        sub_url = f"https://drive.google.com/embeddedfolderview?id={current_fid}"
                        sub_html = fetch_html_with_retry(sub_url, retries=2)
                        
                        sub_folders, sub_files = parse_entries(sub_html)
                        
                        # We map files to (id, name)
                        for file_title, file_id in sub_files:
                            full_name = f"{current_path}/{file_title}" if current_path else file_title
                            images.append((file_id, full_name))
                            
                        for folder_title, folder_id in sub_folders:
                            new_path = f"{current_path}/{folder_title}" if current_path else folder_title
                            queue.append((folder_id, new_path))
                            
                        if queue:
                            time.sleep(0.5)
                    
                    if not images:
                        global_sync_state.errors["empty_folders"].append(name)
                    
                    # Fetch or create CatalogFolder
                    folder_stmt = select(CatalogFolder).where(CatalogFolder.drive_folder_id == fid)
                    folder_res = await db.execute(folder_stmt)
                    db_folder = folder_res.scalars().first()
                    
                    if not db_folder:
                        db_folder = CatalogFolder(
                            folder_name=name,
                            drive_folder_id=fid,
                            image_count=len(images),
                            last_sync=datetime.now()
                        )
                        db.add(db_folder)
                        await db.flush() # Populate db_folder.id
                    else:
                        db_folder.folder_name = name
                        db_folder.image_count = len(images)
                        db_folder.last_sync = datetime.now()
                    
                    # Sync Images in folder
                    delete_stmt = delete(CatalogImage).where(CatalogImage.folder_id == db_folder.id)
                    await db.execute(delete_stmt)
                    
                    # Insert images
                    cover_url = None
                    ai_cover_url = None
                    for idx, (img_id, img_name) in enumerate(images):
                        is_cover = (idx == 0)
                        img_url = f"https://drive.google.com/uc?export=view&id={img_id}"
                        thumbnail_url = f"https://drive.google.com/thumbnail?id={img_id}&sz=w600"
                        if is_cover:
                            cover_url = thumbnail_url
                        # Prefer ai/ subfolder images as cover thumbnail
                        if ai_cover_url is None and img_name.lower().startswith('ai/'):
                            ai_cover_url = thumbnail_url
                            
                        db_img = CatalogImage(
                            folder_id=db_folder.id,
                            image_name=img_name,
                            image_url=img_url,
                            is_cover=is_cover,
                            sort_order=idx
                        )
                        db.add(db_img)
                        image_count_total += 1
                    
                    # Use ai preview as thumbnail if available, else use first image
                    db_folder.thumbnail_url = ai_cover_url or cover_url
                    
                    await db.commit()
                    log_message(f"Folder {name} synced successfully. {len(images)} images found.")
                    
                except Exception as e:
                    log_message(f"Warning: Failed to sync folder {name} ({fid}): {e}")
                    global_sync_state.errors["broken_images"].append(f"{name} ({fid})")
                
                global_sync_state.total_images = image_count_total

            global_sync_state.last_sync = datetime.now()
            global_sync_state.progress = "Synchronization complete"
            log_message(f"Synchronization complete! Total Folders: {count}, Total Images: {image_count_total}")
            
    except Exception as e:
        global_sync_state.progress = "Failed"
        log_message(f"Critical error during sync: {e}")
    finally:
        global_sync_state.is_syncing = False

def start_background_sync(re_sync: bool = False):
    loop_thread = threading.Thread(
        target=lambda: time.sleep(0.1) or time.sleep(0.1), # Placeholder
        daemon=True
    )
    import asyncio
    
    def run():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(run_sync_task(re_sync))
        loop.close()
        
    sync_thread = threading.Thread(target=run, daemon=True)
    sync_thread.start()
