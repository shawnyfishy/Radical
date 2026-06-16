import sqlite3
import json

def main():
    conn = sqlite3.connect('backend/db/radical.db')
    cursor = conn.cursor()
    print('--- PRODUCTS ---')
    cursor.execute("SELECT id, name, category, price, slug FROM products WHERE name LIKE '%Compass%'")
    rows = cursor.fetchall()
    for r in rows:
        print(f"Product: ID={r[0]}, Name={r[1]}, Category={r[2]}, Price={r[3]}, Slug={r[4]}")
        cursor.execute("SELECT id, label, sku, stock FROM variants WHERE product_id = ?", (r[0],))
        v_rows = cursor.fetchall()
        for v in v_rows:
            print(f"  Variant: ID={v[0]}, Label={v[1]}, SKU={v[2]}, Stock={v[3]}")
    conn.close()

if __name__ == '__main__':
    main()
