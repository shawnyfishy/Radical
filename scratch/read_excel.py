import openpyxl

def main():
    path = r'assets/RADICAL_D2C_Reverse_Costing_All_Products.xlsx'
    wb = openpyxl.load_workbook(path, read_only=True)
    sheet = wb.active
    print("All rows in Excel:")
    for r_idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if row[0] is not None:
            print(f"{r_idx}: {row[0]} -> Selling: {row[1]}, MRP: {row[3]}")

if __name__ == '__main__':
    main()
