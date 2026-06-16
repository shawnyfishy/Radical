import os
import hashlib
from PIL import Image

def get_hash(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()

files = [
    "assets/RADICAL FINAL WEBSITE PCITURES/compass cuff/black/compass cuff - black.jpeg",
    "assets/RADICAL FINAL WEBSITE PCITURES/compass cuff/silver/compass cuff - silver.jpeg",
    "assets/RADICAL FINAL WEBSITE PCITURES/tennis black stone chain/tennis black stone chain.jpeg",
    "assets/RADICAL FINAL WEBSITE PCITURES/tennis black stone chain/tennis black stone chain close up.jpeg"
]

for f in files:
    if os.path.exists(f):
        im = Image.open(f)
        print(f"{f}: size={os.path.getsize(f)} dims={im.size} md5={get_hash(f)}")
    else:
        print(f"{f} does not exist.")
