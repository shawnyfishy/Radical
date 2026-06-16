import re

def main():
    path = r'products.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Use regex to find all name: '...' fields in products.js
    names = re.findall(r"name:\s+'([^']+)'", content)
    
    # Let's get base names
    base_names = set()
    for name in names:
        base_name = name.split(' - ')[0].strip()
        base_names.add(base_name)
        
    print("Base names in products.js:")
    for bn in sorted(base_names):
        print(f"  {bn}")

if __name__ == '__main__':
    main()
