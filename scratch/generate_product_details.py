import docx
import re
import json

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
    
    # We want to extract product blocks and get their name and id
    pattern = r'id:\s*\'(RAD-\d+)\',\s*dbId:\s*(\d+),\s*url:\s*\'[^\']+\',\s*name:\s*\'([^\'\n]+)\''
    matches = re.findall(pattern, content)
    return matches

def main():
    docx_descs = parse_docx_table()
    js_products = parse_products_js()
    
    results = {}
    
    for pid, dbid, name in js_products:
        base_name = name.split(' - ')[0].strip()
        color = name.split(' - ')[1].strip() if ' - ' in name else ''
        
        # Match search
        matched_desc = None
        match_type = "NONE"
        
        # Exact matching
        for docx_name, docx_desc in docx_descs.items():
            c_pname = clean_name(name)
            c_docx = clean_name(docx_name)
            
            # Map special base name rules
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
                matched_desc = docx_desc
                match_type = "EXACT"
                break
                
        if not matched_desc:
            # Try Base matching
            for docx_name, docx_desc in docx_descs.items():
                mapped_docx_base = mapping.get(base_name)
                if mapped_docx_base and clean_name(mapped_docx_base) in clean_name(docx_name):
                    # Let's map Imperial Eye Ring variants
                    if base_name == 'IMPERIAL EYE RING':
                        if color == 'BLACK GEM' and 'black' in docx_name.lower():
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
                        elif color == 'DIAMOND GEM' and 'silver' in docx_name.lower():
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
                    # Let's map Legacy Tag Pendant variants
                    elif base_name == 'LEGACY TAG PENDANT':
                        if color == 'BLACK WITH DIAMOND' and 'diamond on black' in docx_name.lower():
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
                        elif color == 'SILVER WITH BLACK GEMS' and 'black on silver' in docx_name.lower():
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
                        elif color == 'SILVER WITH DIAMOND' and 'diamond on silver' in docx_name.lower():
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
                    # Let's map Spear Pendant variants
                    elif base_name == 'SPEAR PENDANT':
                        if color == 'BLACK' and 'diamond on black' in docx_name.lower():
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
                        elif color == 'SILVER' and 'diamond on silver' in docx_name.lower():
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
                        elif color == 'SILVER WITH BLACK STONE' and 'black on silver' in docx_name.lower():
                            # wait, row 39 is Spear Pendant - black on silver
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
                    # Let's map Guardian Pendant variants
                    elif base_name == 'GUARDIAN PENDANT':
                        if color == 'BLACK ON SILVER' and 'black on silver' in docx_name.lower():
                            matched_desc = docx_desc
                            match_type = "FALLBACK"
                            break
        
        # Fallbacks for unmatched or customized variants
        if not matched_desc:
            if base_name == 'GUARDIAN PENDANT':
                if color == 'BLACK ON BLACK':
                    matched_desc = "Material : Brass, Black Gold, Black Enamel\nColor : Black Gold / Gun metal"
                    match_type = "CUSTOM_FALLBACK"
                elif color == 'DIAMOND ON SILVER':
                    matched_desc = "Material : Brass, Silver plated, AAA grade CZ\nColor : Silver"
                    match_type = "CUSTOM_FALLBACK"
            elif base_name == 'ECLIPSE RING':
                if color == 'BLACK':
                    matched_desc = "Material : Brass, Black Gold\nColor : Black Gold / Gun metal"
                    match_type = "CUSTOM_FALLBACK"
                elif color == 'SILVER':
                    matched_desc = "Material : Brass, Silver plated\nColor : Oxydised Silver"
                    match_type = "CUSTOM_FALLBACK"
            elif base_name == 'MONUMENT PENDANT':
                matched_desc = "Material : Brass, Silver plated\nColor : Silver"
                match_type = "CUSTOM_FALLBACK"
            elif base_name == 'OBSIDIAN MONARCH RING':
                matched_desc = "Material : Brass, Silver plated, Black Obsidian\nColor : Silver"
                match_type = "CUSTOM_FALLBACK"
                
        results[name] = {
            "pid": pid,
            "dbid": dbid,
            "match_type": match_type,
            "description": matched_desc
        }
        
    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
