import re
import openpyxl

def parse_products_js():
    path = r'products.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to find product blocks. Let's use regex or split by {} blocks
    # A product block looks like:
    # {
    #   id:          'RAD-XXX',
    #   dbId:        X,
    #   url:         '...',
    #   name:        '...',
    #   ...
    #   price:       '...'
    # }
    
    product_blocks = re.findall(r'\{\s+id:\s+\'([^\']+)\',[^}]+name:\s+\'([^\']+)\',[^}]+price:\s+\'([^\']+)\',[^}]+category:\s+\'([^\']+)\'[^}]*\}', content)
    return product_blocks

def main():
    js_products = parse_products_js()
    print(f"Parsed {len(js_products)} products from products.js:")
    js_list = []
    for pid, pname, pprice, pcat in js_products:
        print(f"  {pid}: {pname} ({pcat}) -> Price: {pprice}")
        js_list.append((pid, pname, pprice, pcat))
        
    excel_path = r'assets/RADICAL_D2C_Reverse_Costing_All_Products.xlsx'
    wb = openpyxl.load_workbook(excel_path, read_only=True)
    sheet = wb.active
    excel_list = []
    for r_idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if r_idx > 0 and row[0] is not None:
            excel_list.append((row[0], row[1], row[3]))
            
    print("\nExcel Products:")
    for name, selling, mrp in excel_list:
        print(f"  {name} -> Selling: {selling}, MRP: {mrp}")

if __name__ == '__main__':
    main()
