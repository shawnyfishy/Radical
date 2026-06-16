import sqlite3

def main():
    conn = sqlite3.connect('backend/db/radical.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, price, compare_price FROM products ORDER BY id LIMIT 10")
    rows = cursor.fetchall()
    print("Seeded Database Prices (first 10):")
    for r in rows:
        print(f"Product: ID={r[0]}, Name={r[1]}, SellingPrice={r[2]}, compare_price={r[3]}")
    conn.close()

if __name__ == '__main__':
    main()
