import sqlite3

def update_product_colors():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, design_code FROM products")
    products = cursor.fetchall()
    
    updated_count = 0
    for pid, design_code in products:
        cursor.execute("SELECT id FROM catalog_folders WHERE folder_name = ?", (design_code,))
        folder_row = cursor.fetchone()
        if not folder_row:
            continue
        folder_id = folder_row[0]
        
        cursor.execute("SELECT image_name FROM catalog_images WHERE folder_id = ?", (folder_id,))
        images = cursor.fetchall()
        
        colors = set()
        for (img_name,) in images:
            if '/' in img_name:
                parts = img_name.split('/')
                folder = parts[0].strip().lower()
                file = "/".join(parts[1:]).strip()
                if folder == 'ai':
                    # Sometimes ai/color_name.jpg
                    c = file.split('.')[0]
                    colors.add(c.capitalize())
                elif folder != 'lc':
                    # The folder name is the color!
                    colors.add(folder.capitalize())
                    
        if colors:
            color_str = ", ".join(sorted(colors))
            cursor.execute("UPDATE products SET color = ? WHERE id = ?", (color_str, pid))
            updated_count += 1
            
    conn.commit()
    conn.close()
    print(f"Updated colors for {updated_count} products.")

if __name__ == "__main__":
    update_product_colors()
