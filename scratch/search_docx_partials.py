import docx

def main():
    path = r'assets/products material descirption.docx'
    doc = docx.Document(path)
    
    table = doc.tables[0]
    for r_idx, row in enumerate(table.rows):
        row_text = " | ".join([cell.text.strip() for cell in row.cells])
        for kw in ["monu", "mona", "obsi", "duality", "ecpilse", "signet"]:
            if kw in row_text.lower():
                print(f"Row {r_idx}: {row_text}")

if __name__ == '__main__':
    main()
