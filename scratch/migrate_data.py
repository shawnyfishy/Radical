import docx
import re

mapping = {
    'CHAINLINK RING': 'Chainlink Ring',
    'COMPASS CHAIN': 'Crown Tennis Chain',
    'CROWN TENNIS BRACELET': 'Crown Tennis Bracelet',
    'DIAMOND VAULT RING': 'Diamond Vault Ring',
    'ECLIPSE RING': 'Duality Ring (Sun and Moon)',
    'ECLIPSE SIGNET RING': 'Eclipse Signet Ring',
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

def clean_name(n):
    return re.sub(r'[\s\-\–\—\–\-\–\s]+', ' ', n).strip().lower()

def parse_docx_table():
    path = r'assets/products material descirption.docx'
    doc = docx.Document(path)
    table = doc.tables[0]
    desc_map = {}
    for r_idx, row in enumerate(table.rows):
        if r_idx == 0:
            continue
        pname = row.cells[3].text.strip()
        desc = row.cells[2].text.strip()
        if pname:
            desc_map[pname] = desc
    return desc_map

def get_mapped_description(name, docx_descs):
    base_name = name.split(' - ')[0].strip()
    color = name.split(' - ')[1].strip() if ' - ' in name else ''
    
    # Exact matches
    for docx_name, docx_desc in docx_descs.items():
        c_pname = clean_name(name)
        c_docx = clean_name(docx_name)
        
        if base_name == 'COMPASS CHAIN':
            c_pname = clean_name("Crown Tennis Chain - " + color)
        elif base_name == 'ECLIPSE SIGNET RING':
            c_pname = clean_name("Ecpilse signet ring - " + color)
        elif base_name == 'ECLIPSE RING':
            c_pname = clean_name("Duality Ring (Sun and Moon) - " + color)
        elif base_name == 'TENNIS BLACK STONE CHAIN':
            c_pname = clean_name("Tennis Chain")
        elif base_name == 'PATH FINDER PENDANT':
            c_pname = clean_name("Pathfinder Pendant - " + color)
            
        if c_pname == c_docx:
            return docx_desc
            
    # Base match fallbacks
    for docx_name, docx_desc in docx_descs.items():
        mapped_docx_base = mapping.get(base_name)
        if mapped_docx_base and clean_name(mapped_docx_base) in clean_name(docx_name):
            if base_name == 'IMPERIAL EYE RING':
                if color == 'BLACK GEM' and 'black' in docx_name.lower():
                    return docx_desc
                elif color == 'DIAMOND GEM' and 'silver' in docx_name.lower():
                    return docx_desc
            elif base_name == 'LEGACY TAG PENDANT':
                if color == 'BLACK WITH DIAMOND' and 'diamond on black' in docx_name.lower():
                    return docx_desc
                elif color == 'SILVER WITH BLACK GEMS' and 'black on silver' in docx_name.lower():
                    return docx_desc
                elif color == 'SILVER WITH DIAMOND' and 'diamond on silver' in docx_name.lower():
                    return docx_desc
            elif base_name == 'SPEAR PENDANT':
                if color == 'BLACK' and 'diamond on black' in docx_name.lower():
                    return docx_desc
                elif color == 'SILVER' and 'diamond on silver' in docx_name.lower():
                    return docx_desc
                elif color == 'SPEAR PENDANT - SILVER WITH BLACK STONE' or (color == 'SILVER WITH BLACK STONE' and 'black on silver' in docx_name.lower()):
                    return docx_desc
            elif base_name == 'GUARDIAN PENDANT':
                if color == 'BLACK ON SILVER' and 'black on silver' in docx_name.lower():
                    return docx_desc

    # Hand-crafted custom fallbacks
    if base_name == 'GUARDIAN PENDANT':
        if color == 'BLACK ON BLACK':
            return "Material : Brass, Black Gold, Black Enamel\nColor : Black Gold / Gun metal"
        elif color == 'DIAMOND ON SILVER':
            return "Material : Brass, Silver plated, AAA grade CZ\nColor : Silver"
    elif base_name == 'ECLIPSE RING':
        if color == 'BLACK':
            return "Material : Brass, Black Gold\nColor : Black Gold / Gun metal"
        elif color == 'SILVER':
            return "Material : Brass, Silver plated\nColor : Oxydised Silver"
    elif base_name == 'MONUMENT PENDANT':
        return "Material : Brass, Silver plated\nColor : Silver"
    elif base_name == 'OBSIDIAN MONARCH RING':
        return "Material : Brass, Silver plated, Black Obsidian\nColor : Silver"
        
    return "Material : Brass, Silver plated\nColor : Silver"

def escape_js(s):
    # Clean non-breaking spaces
    s = s.replace('\xa0', ' ').replace('\u00a0', ' ')
    # Escape single quotes and write backslashes for newlines
    return s.replace("'", "\\'").replace("\n", "\\n")

def update_products_js(docx_descs):
    path = 'products.js'
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    current_name = None
    
    for line in lines:
        # Detect product name
        name_match = re.search(r"name:\s*'([^']+)'", line)
        if name_match:
            current_name = name_match.group(1).strip()
            
        # Detect currency block in product definition
        if "currency:" in line and current_name:
            desc = get_mapped_description(current_name, docx_descs)
            escaped = escape_js(desc)
            # Insert details field before currency line
            indent = line[:line.find("currency:")]
            new_lines.append(f"{indent}details:     '{escaped}',\n")
            
        new_lines.append(line)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Updated products.js successfully!")

def update_seed_js(docx_descs):
    path = 'backend/db/seed.js'
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    current_name = None
    
    for line in lines:
        # Detect product name
        name_match = re.search(r"name:\s*'([^']+)'", line)
        if name_match:
            current_name = name_match.group(1).strip()
            
        # Detect images block in seed.js product definition
        if "images:" in line and current_name:
            desc = get_mapped_description(current_name.upper(), docx_descs)
            escaped = escape_js(desc)
            # Insert material field before images line
            indent = line[:line.find("images:")]
            new_lines.append(f"{indent}material: '{escaped}',\n")
            
        # Detect seed SQL query insert definition
        if "INSERT INTO products (name, slug, description, category, price, compare_price, images)" in line:
            line = line.replace(
                "INSERT INTO products (name, slug, description, category, price, compare_price, images)",
                "INSERT INTO products (name, slug, description, category, price, compare_price, images, material)"
            )
        if "VALUES (?, ?, ?, ?, ?, ?, ?)" in line:
            line = line.replace(
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            )
        if ").run(p.name, p.slug, p.description, p.category, p.price, p.compare_price || null, JSON.stringify(p.images));" in line:
            line = line.replace(
                ").run(p.name, p.slug, p.description, p.category, p.price, p.compare_price || null, JSON.stringify(p.images));",
                ").run(p.name, p.slug, p.description, p.category, p.price, p.compare_price || null, JSON.stringify(p.images), p.material || null);"
            )
            
        new_lines.append(line)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Updated seed.js successfully!")

def main():
    docx_descs = parse_docx_table()
    update_products_js(docx_descs)
    update_seed_js(docx_descs)

if __name__ == '__main__':
    main()
