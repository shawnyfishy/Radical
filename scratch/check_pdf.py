import os
try:
    import pypdf
except ImportError:
    import subprocess
    subprocess.run(["pip", "install", "pypdf"])
    import pypdf

reader = pypdf.PdfReader("RADICAL-Men's Jewellery.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

with open("scratch/pdf_text.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Extracted", len(text), "characters from PDF.")
