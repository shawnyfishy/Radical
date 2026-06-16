import re

def parse_seed_js():
    path = r'backend/db/seed.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to find name, category, price, description, images
    blocks = re.findall(r'\{\s+name:\s+\'([^\']+)\',[^}]+category:\s+\'([^\']+)\',[^}]+price:\s+(\d+),[^}]+description:\s+\'([^\']+)\'[^}]*\}', content)
    return blocks

def main():
    seed_products = parse_seed_js()
    print("Seed Products in database:")
    for name, cat, price, desc in seed_products:
        print(f"Name: {name} ({cat}) -> Price: {price}")
        print(f"  Desc: {desc}")

if __name__ == '__main__':
    main()
