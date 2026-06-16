import docx

def main():
    path = r'assets/products material descirption.docx'
    doc = docx.Document(path)
    table = doc.tables[0]
    for r_idx, row in enumerate(table.rows):
        cells_text = [cell.text.strip() for cell in row.cells]
        print(f"Row {r_idx}: {cells_text}")

if __name__ == '__main__':
    main()
