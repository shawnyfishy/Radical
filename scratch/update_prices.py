import re
import openpyxl

mapping = {
    'CHAINLINK RING': 'Chainlink Ring',
    'COMPASS CHAIN': 'Crown Tennis Chain',
    'CROWN TENNIS BRACELET': 'Crown Tennis Bracelet',
    'DIAMOND VAULT RING': 'Diamond Vault Ring',
    'ECLIPSE RING': 'Duality Ring (Sun and Moon)',
    'ECLIPSE SIGNET RING': 'Northstar Ring',
    'ETERNAL KNOT RING': 'Eternal Knot Ring',
    'GUARDIAN PENDANT': 'Guardian Pendant',
    'IMPERIAL EYE RING': 'Imperial Eye Ring',
    'INFINITE LOOP PENDANT': 'Infinite Loop Pendant',
    'LEGACY TAG PENDANT': 'Legacy Tag Pendant',
    'MONUMENT PENDANT': 'Monument Pendant',
    'NORTHSTAR PENDANT': 'Northstar Pendant',
    'OBSIDIAN GRID PENDANT': 'Obsidian Grid Pendant',
    'OBSIDIAN MONARCH RING': 'Obsidian Monarch Ring',
    'ONYX CORE PENDANT': 'Onyx Core Pendant',
    'PATH FINDER PENDANT': 'Pathfinder Pendant',
    'RUNE SHIELD RING': 'Rune Shield Ring',
    'SERPENT ASCEND RING': 'Serpent Ascend Ring',
    'SPEAR PENDANT': 'Spear Pendant',
    'TENNIS BLACK STONE CHAIN': 'Tennis Chain',
    'WORLD TREE RING': 'World Tree Ring'
}

def format_price_string(val):
    val_int = int(round(val))
    return f"{val_int:,}"

def load_excel_prices():
    path = r'assets/RADICAL_D2C_Reverse_Costing_All_Products.xlsx'
    wb = openpyxl.load_workbook(path, read_only=True)
    sheet = wb.active
    prices = {}
    for r_idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if r_idx > 0 and row[0] is not None:
            prices[row[0].strip()] = {
                'selling': row[1],
                'mrp': row[3]
            }
    return prices

def update_products_js(prices):
    path = r'products.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    array_start = content.find('const products = [')
    if array_start == -1:
        print("Could not find products array in products.js")
        return
        
    def replacer(match):
        block = match.group(0)
        id_m = re.search(r"id:\s+'(RAD-\d+)'", block)
        name_m = re.search(r"name:\s+'([^']+)'", block)
        if not id_m or not name_m:
            return block
            
        pid = id_m.group(1)
        pname = name_m.group(1)
        base_name = pname.split(' - ')[0].strip().upper()
        
        excel_name = mapping.get(base_name)
        if not excel_name or excel_name not in prices:
            print(f"Warning: No price mapping found for base product: '{base_name}' ({pname})")
            return block
            
        price_info = prices[excel_name]
        selling_str = format_price_string(price_info['selling'])
        mrp_str = format_price_string(price_info['mrp'])
        
        # Replace price: '...' with the new price and comparePrice
        price_pattern = r"price:\s+'[^']+',"
        compare_pattern = r"comparePrice:\s*'[^']+',"
        
        # If comparePrice already exists in the block, replace both or remove it first to avoid double comparePrice
        block = re.sub(compare_pattern, "", block)
        
        if not re.search(price_pattern, block):
            return block
            
        replacement = f"price:       '{selling_str}',\n      comparePrice: '{mrp_str}',"
        block_new = re.sub(price_pattern, replacement, block)
        return block_new

    pattern = r"\{\s+id:\s+'RAD-\d+',[^}]+category:\s+'[a-z]+',[^}]+\}"
    new_content = re.sub(pattern, replacer, content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated products.js successfully!")

def update_seed_js(prices):
    path = r'backend/db/seed.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    def replacer(match):
        block = match.group(0)
        name_m = re.search(r"name:\s+'([^']+)'", block)
        if not name_m:
            return block
            
        pname = name_m.group(1)
        base_name = pname.split(' - ')[0].strip().upper()
        
        excel_name = mapping.get(base_name)
        if not excel_name or excel_name not in prices:
            print(f"Warning: No price mapping found for seed base product: '{base_name}' ({pname})")
            return block
            
        price_info = prices[excel_name]
        selling_val = int(round(price_info['selling']))
        mrp_val = int(round(price_info['mrp']))
        
        # Replace price: XXX with new price and compare_price: XXX
        # Let's clean up existing compare_price first if any
        block = re.sub(r"compare_price:\s*\d+,?\n?\s*", "", block)
        
        price_pattern = r"price:\s+\d+,"
        if not re.search(price_pattern, block):
            return block
            
        replacement = f"price: {selling_val},\n    compare_price: {mrp_val},"
        block_new = re.sub(price_pattern, replacement, block)
        return block_new

    pattern = r"\{\s+name:\s+'[^']+',[^}]+category:\s+'[a-z]+',[^}]+\}"
    new_content = re.sub(pattern, replacer, content)
    
    old_insert_sql = "INSERT INTO products (name, slug, description, category, price, images)"
    new_insert_sql = "INSERT INTO products (name, slug, description, category, price, compare_price, images)"
    
    old_values_sql = "VALUES (?, ?, ?, ?, ?, ?)"
    new_values_sql = "VALUES (?, ?, ?, ?, ?, ?, ?)"
    
    old_run_sql = "run(p.name, p.slug, p.description, p.category, p.price, JSON.stringify(p.images))"
    new_run_sql = "run(p.name, p.slug, p.description, p.category, p.price, p.compare_price || null, JSON.stringify(p.images))"
    
    if old_insert_sql in new_content:
        new_content = new_content.replace(old_insert_sql, new_insert_sql)
        new_content = new_content.replace(old_values_sql, new_values_sql)
        new_content = new_content.replace(old_run_sql, new_run_sql)
        print("Updated database insert query in seed.js to support compare_price!")
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated seed.js successfully!")

def main():
    prices = load_excel_prices()
    update_products_js(prices)
    update_seed_js(prices)

if __name__ == '__main__':
    main()
