import sqlite3
import random

def update_products():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    # Get all catalog folder names
    cursor.execute("SELECT folder_name FROM catalog_folders WHERE image_count > 0")
    folders = [row[0] for row in cursor.fetchall()]
    
    if not folders:
        print("No folders found!")
        return
        
    # Get all product IDs
    cursor.execute("SELECT id FROM products")
    product_ids = [row[0] for row in cursor.fetchall()]
    
    # Update each product with a random catalog folder name
    for pid in product_ids:
        folder = random.choice(folders)
        cursor.execute("UPDATE products SET design_code = ? WHERE id = ?", (folder, pid))
        
    conn.commit()
    conn.close()
    print(f"Updated {len(product_ids)} products with catalog codes.")

if __name__ == "__main__":
    update_products()
