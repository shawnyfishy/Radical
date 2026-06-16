import sqlite3
import re

def main():
    # 1. Connect to SQLite and get slug-to-ID mapping
    db_path = r'backend/db/radical.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, slug FROM products")
    db_mapping = {slug: pid for pid, slug in cursor.fetchall()}
    conn.close()
    
    print("Database mapping loaded:")
    for slug, pid in sorted(db_mapping.items()):
        print(f"  {slug} -> {pid}")
        
    # 2. Read products.js
    js_path = r'products.js'
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # 3. Replace dbId in each product block
    def replacer(match):
        block = match.group(0)
        sku_m = re.search(r"sku:\s+'([^']+)'", block)
        if not sku_m:
            return block
            
        sku = sku_m.group(1)
        if sku not in db_mapping:
            print(f"Warning: SKU '{sku}' not found in database!")
            return block
            
        db_id = db_mapping[sku]
        
        # Replace dbId: X with dbId: db_id
        db_id_pattern = r"dbId:\s+\d+,"
        replacement = f"dbId:        {db_id},"
        block_new = re.sub(db_id_pattern, replacement, block)
        return block_new

    # Match blocks that start with `{` followed by `id:` and end with `}`
    pattern = r"\{\s+id:\s+'RAD-\d+',[^}]+category:\s+'[a-z]+',[^}]+\}"
    new_content = re.sub(pattern, replacer, content)
    
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("products.js updated with correct dbId values!")

if __name__ == '__main__':
    main()
