def main():
    path = r'styles.css'
    with open(path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            if 'price' in line.lower() or 'pdp__' in line.lower() or 'card__' in line.lower():
                # print a snippet
                if 'price' in line.lower():
                    print(f"{line_num}: {line.strip()}")

if __name__ == '__main__':
    main()
