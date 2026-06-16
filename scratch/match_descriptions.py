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

def parse_products_js():
    path = r'products.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    product_blocks = re.findall(r'\{\s+id:\s+\'([^\']+)\',[^}]+name:\s+\'([^\']+)\',[^}]+category:\s+\'([^\']+)\'[^}]*\}', content)
    return product_blocks

def main():
    docx_descs = parse_docx_table()
    js_products = parse_products_js()
    
    print("MATCHING LOG:")
    matched_count = 0
    unmatched = []
    
    for pid, pname, pcat in js_products:
        base_name = pname.split(' - ')[0].strip()
        color = pname.split(' - ')[1].strip() if ' - ' in pname else ''
        
        # Let's find a match in docx_descs
        found = False
        
        # Try direct or close matching
        # Normalized key check
        for docx_name, docx_desc in docx_descs.items():
            # Clean names
            c_pname = clean_name(pname)
            c_docx = clean_name(docx_name)
            
            # Try matching Compass Chain to Crown Tennis Chain
            if base_name == 'COMPASS CHAIN':
                c_pname = clean_name("Crown Tennis Chain - " + color)
            # Try matching Eclipse Signet Ring to Ecpilse signet ring (typo)
            if base_name == 'ECLIPSE SIGNET RING':
                c_pname = clean_name("Ecpilse signet ring - " + color)
            # Try matching Eclipse Ring to Duality Ring
            if base_name == 'ECLIPSE RING':
                c_pname = clean_name("Duality Ring (Sun and Moon) - " + color)
            # Try matching Tennis Black Stone Chain to Tennis Chain
            if base_name == 'TENNIS BLACK STONE CHAIN':
                c_pname = clean_name("Tennis Chain")
            # Try matching Path Finder to Pathfinder
            if base_name == 'PATH FINDER PENDANT':
                c_pname = clean_name("Pathfinder Pendant - " + color)
                
            if c_pname == c_docx:
                print(f"  [EXACT] {pname} -> {docx_name}")
                found = True
                matched_count += 1
                break
                
        if not found:
            # Let's try base-only matching or color matching
            # E.g. Guardian Pendant - Black on Black might use a general Guardian Pendant description,
            # or we might find description by matching the base name.
            # Let's try base match
            for docx_name, docx_desc in docx_descs.items():
                c_base = clean_name(base_name)
                c_docx = clean_name(docx_name)
                
                # Check mapping
                mapped_docx_base = mapping.get(base_name)
                if mapped_docx_base:
                    # check if docx_name starts with it
                    if docx_name.lower().startswith(mapped_docx_base.lower()):
                        # check if color matches
                        # e.g., if color is "black on black", and docx is "black on silver", let's check.
                        # For Guardian Pendant, row is "Guardian Pendant - black on silver".
                        # For other colors, we will fallback to it!
                        print(f"  [FALLBACK] {pname} -> {docx_name} (Base match '{mapped_docx_base}')")
                        found = True
                        matched_count += 1
                        break
            
        if not found:
            print(f"  [UNMATCHED] {pname}")
            unmatched.append(pname)
            
    print(f"\nSummary: Matched {matched_count}/{len(js_products)} products.")

if __name__ == '__main__':
    main()
