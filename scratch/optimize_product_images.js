const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'assets', 'RADICAL FINAL WEBSITE PCITURES');
const MAX_DIM = 1600;
const QUALITY = 78;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) out.push(full);
  }
}

async function main() {
  const files = [];
  walk(ROOT, files);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const before = fs.statSync(file).size;
    totalBefore += before;

    const buf = fs.readFileSync(file);
    const img = sharp(buf);
    const meta = await img.metadata();

    const resized = (meta.width > MAX_DIM || meta.height > MAX_DIM)
      ? img.resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
      : img;

    const outBuf = await resized.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
    fs.writeFileSync(file, outBuf);

    const after = outBuf.length;
    totalAfter += after;
    console.log(
      path.relative(ROOT, file).padEnd(70),
      (before / 1024 / 1024).toFixed(2) + 'MB ->',
      (after / 1024 / 1024).toFixed(2) + 'MB'
    );
  }

  console.log('\n--- TOTAL ---');
  console.log('Before:', (totalBefore / 1024 / 1024).toFixed(1) + 'MB');
  console.log('After: ', (totalAfter / 1024 / 1024).toFixed(1) + 'MB');
  console.log('Saved: ', (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1) + '%');
}

main();
