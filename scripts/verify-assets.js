/**
 * RADICAL — Asset Reference Verification Script
 * Scans all HTML/CSS/JS files for local asset references and confirms
 * every one resolves to an existing file. Reports any broken references.
 *
 * Run: node scripts/verify-assets.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SOURCE_FILES = [
  'index.html', 'about.html', 'shop.html', 'checkout.html', 'account.html',
  'product.html', 'product-bracelet.html', 'product-pendant.html', 'product-limited.html',
  'products.js', 'script.js', 'store.js', 'api.js', 'motion.config.js',
  'backend/server.js', 'styles.css',
];

// Patterns to extract local asset references
const PATTERNS = [
  /src=["']([^"']+)["']/g,
  /href=["']([^"'#?][^"']*)["']/g,
  /poster=["']([^"']+)["']/g,
  /url\(["']?([^"')]+)["']?\)/g,
  /['"`]([^'"`\s]+\.(?:mp4|webm|webp|jpeg|jpg|png|svg|gif|pdf|js|css))['"`]/g,
  /HERO_VIDEO_SRC\s*=\s*['"]([^'"]+)['"]/g,
];

// Extensions that indicate a local asset (not an external URL or data URI)
const ASSET_EXTS = new Set([
  '.mp4', '.webm', '.webp', '.jpeg', '.jpg', '.png', '.svg',
  '.gif', '.pdf', '.js', '.css', '.otf', '.ttf', '.woff', '.woff2'
]);

function isLocalRef(ref) {
  if (!ref) return false;
  if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('data:') || ref.startsWith('#') || ref.startsWith('//')) return false;
  if (ref.startsWith('/api/') || ref.startsWith('mailto:') || ref.startsWith('tel:')) return false;
  const ext = path.extname(ref.split('?')[0]).toLowerCase();
  // Must have a known asset extension, or look like a path with slashes
  return ASSET_EXTS.has(ext) || (ref.includes('/') && !ref.startsWith('/') && ext === '');
}

let broken = [];
let verified = 0;

for (const relFile of SOURCE_FILES) {
  const absFile = path.join(ROOT, relFile);
  if (!fs.existsSync(absFile)) continue;

  const content = fs.readFileSync(absFile, 'utf8');

  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let ref = match[1].trim();

      // Decode percent-encoding
      try { ref = decodeURIComponent(ref); } catch (e) {}

      // Skip non-local refs
      if (!isLocalRef(ref)) continue;

      // Strip leading slash if present
      const cleanRef = ref.startsWith('/') ? ref.slice(1) : ref;
      const absRef = path.join(ROOT, cleanRef);

      if (fs.existsSync(absRef)) {
        verified++;
      } else {
        broken.push({ file: relFile, ref: ref });
      }
    }
  }
}

// Deduplicate broken refs
const seen = new Set();
const uniqueBroken = broken.filter(b => {
  const key = `${b.file}::${b.ref}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log('\n── Asset Reference Verification ────────────────────────');
console.log(`  Verified OK: ${verified}`);
console.log(`  Broken refs: ${uniqueBroken.length}`);

if (uniqueBroken.length > 0) {
  console.log('\n  BROKEN REFERENCES:');
  for (const b of uniqueBroken) {
    console.log(`  ✗ [${b.file}]  →  ${b.ref}`);
  }
  console.log('');
  process.exit(1);
} else {
  console.log('\n  ✓ All references resolve correctly. No spaces or broken paths found.\n');
  process.exit(0);
}
