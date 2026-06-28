/**
 * RADICAL — Image Optimization Script (Phase 2.1)
 * Converts all source images to WebP (+ JPEG fallback) at correct display widths.
 * Run: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const ROOT = path.join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────
// IMAGE JOBS: source (relative to ROOT) → outputs with target widths
// ─────────────────────────────────────────────────────────────────
const JOBS = [
  // Root-level images (source → dest, maxWidth)
  { src: 'assets/images/home.png',         dest: 'assets/images/home.webp',         w: 1600, quality: 80 },
  { src: 'assets/images/nav-shop.jpeg',    dest: 'assets/images/nav-shop.webp',     w: 800,  quality: 78 },
  { src: 'assets/images/nav-about.jpeg',   dest: 'assets/images/nav-about.webp',    w: 800,  quality: 78 },
  { src: 'assets/images/nav-contact.jpeg', dest: 'assets/images/nav-contact.webp',  w: 800,  quality: 78 },
  { src: 'assets/images/preloader.jpeg',   dest: 'assets/images/preloader.webp',    w: 800,  quality: 80 },
  { src: 'assets/images/community.jpeg',   dest: 'assets/images/community.webp',    w: 1920, quality: 80 },
  { src: 'assets/images/design.jpeg',      dest: 'assets/images/design.webp',       w: 1920, quality: 80 },
  { src: 'assets/images/menu-banner.jpeg', dest: 'assets/images/menu-banner.webp',  w: 1200, quality: 80 },
  { src: 'assets/images/purpose.jpeg',     dest: 'assets/images/purpose.webp',      w: 1920, quality: 80 },
  { src: 'assets/images/wearables.jpeg',   dest: 'assets/images/wearables.webp',    w: 1920, quality: 80 },

  // Product images — already at ~2.7MB total (previously optimized), just convert to WebP
  { src: 'assets/products/chainlink-ring/black/front.jpeg',                    dest: 'assets/products/chainlink-ring/black/front.webp',                    w: 1200, quality: 82 },
  { src: 'assets/products/chainlink-ring/silver/front.jpeg',                   dest: 'assets/products/chainlink-ring/silver/front.webp',                   w: 1200, quality: 82 },
  { src: 'assets/products/black-stone-ring/front.jpeg',                        dest: 'assets/products/black-stone-ring/front.webp',                        w: 1200, quality: 82 },
  { src: 'assets/products/black-stone-ring/closeup.jpeg',                      dest: 'assets/products/black-stone-ring/closeup.webp',                      w: 1200, quality: 82 },
  { src: 'assets/products/compass-cuff/black/front.jpeg',                      dest: 'assets/products/compass-cuff/black/front.webp',                      w: 1200, quality: 82 },
  { src: 'assets/products/compass-cuff/silver/front.jpeg',                     dest: 'assets/products/compass-cuff/silver/front.webp',                     w: 1200, quality: 82 },
  { src: 'assets/products/crown-tennis-bracelet/black-on-black/front.jpeg',    dest: 'assets/products/crown-tennis-bracelet/black-on-black/front.webp',    w: 1200, quality: 82 },
  { src: 'assets/products/crown-tennis-bracelet/black-on-silver/front.jpeg',   dest: 'assets/products/crown-tennis-bracelet/black-on-silver/front.webp',   w: 1200, quality: 82 },
  { src: 'assets/products/crown-tennis-bracelet/diamond-on-silver/front.jpeg', dest: 'assets/products/crown-tennis-bracelet/diamond-on-silver/front.webp', w: 1200, quality: 82 },
  { src: 'assets/products/diamond-vault-ring/black-on-silver/front.jpeg',      dest: 'assets/products/diamond-vault-ring/black-on-silver/front.webp',      w: 1200, quality: 82 },
  { src: 'assets/products/diamond-vault-ring/diamond-on-black/front.jpeg',     dest: 'assets/products/diamond-vault-ring/diamond-on-black/front.webp',     w: 1200, quality: 82 },
  { src: 'assets/products/diamond-vault-ring/diamond-on-silver/front.jpeg',    dest: 'assets/products/diamond-vault-ring/diamond-on-silver/front.webp',    w: 1200, quality: 82 },
  { src: 'assets/products/eclipse-ring/black/front.jpeg',                      dest: 'assets/products/eclipse-ring/black/front.webp',                      w: 1200, quality: 82 },
  { src: 'assets/products/eclipse-ring/silver/front.jpeg',                     dest: 'assets/products/eclipse-ring/silver/front.webp',                     w: 1200, quality: 82 },
  { src: 'assets/products/eclipse-signet-ring/gold/front.jpeg',                dest: 'assets/products/eclipse-signet-ring/gold/front.webp',                w: 1200, quality: 82 },
  { src: 'assets/products/eclipse-signet-ring/silver/front.jpeg',              dest: 'assets/products/eclipse-signet-ring/silver/front.webp',              w: 1200, quality: 82 },
  { src: 'assets/products/eternal-knot-ring/black/front.jpeg',                 dest: 'assets/products/eternal-knot-ring/black/front.webp',                 w: 1200, quality: 82 },
  { src: 'assets/products/eternal-knot-ring/black/closeup.jpeg',               dest: 'assets/products/eternal-knot-ring/black/closeup.webp',               w: 1200, quality: 82 },
  { src: 'assets/products/eternal-knot-ring/silver/front.jpeg',                dest: 'assets/products/eternal-knot-ring/silver/front.webp',                w: 1200, quality: 82 },
  { src: 'assets/products/guardian-pendant/black-on-black/front.jpeg',         dest: 'assets/products/guardian-pendant/black-on-black/front.webp',         w: 1200, quality: 82 },
  { src: 'assets/products/guardian-pendant/black-on-silver/front.jpeg',        dest: 'assets/products/guardian-pendant/black-on-silver/front.webp',        w: 1200, quality: 82 },
  { src: 'assets/products/guardian-pendant/diamond-on-silver/front.jpeg',      dest: 'assets/products/guardian-pendant/diamond-on-silver/front.webp',      w: 1200, quality: 82 },
  { src: 'assets/products/imperial-eye-ring/black-gem/front.jpeg',             dest: 'assets/products/imperial-eye-ring/black-gem/front.webp',             w: 1200, quality: 82 },
  { src: 'assets/products/imperial-eye-ring/diamond-gem/front.jpeg',           dest: 'assets/products/imperial-eye-ring/diamond-gem/front.webp',           w: 1200, quality: 82 },
  { src: 'assets/products/infinite-loop-pendant/black/front.jpeg',             dest: 'assets/products/infinite-loop-pendant/black/front.webp',             w: 1200, quality: 82 },
  { src: 'assets/products/infinite-loop-pendant/black/closeup.jpeg',           dest: 'assets/products/infinite-loop-pendant/black/closeup.webp',           w: 1200, quality: 82 },
  { src: 'assets/products/infinite-loop-pendant/silver/front.jpeg',            dest: 'assets/products/infinite-loop-pendant/silver/front.webp',            w: 1200, quality: 82 },
  { src: 'assets/products/legacy-tag-pendant/black-with-diamond/front.jpeg',   dest: 'assets/products/legacy-tag-pendant/black-with-diamond/front.webp',   w: 1200, quality: 82 },
  { src: 'assets/products/legacy-tag-pendant/silver-with-black-gems/front.jpeg',dest:'assets/products/legacy-tag-pendant/silver-with-black-gems/front.webp',w:1200, quality: 82 },
  { src: 'assets/products/legacy-tag-pendant/silver-with-diamond/front.jpeg',  dest: 'assets/products/legacy-tag-pendant/silver-with-diamond/front.webp',  w: 1200, quality: 82 },
  { src: 'assets/products/monument-pendant/front.jpeg',                        dest: 'assets/products/monument-pendant/front.webp',                        w: 1200, quality: 82 },
  { src: 'assets/products/monument-pendant/closeup.jpeg',                      dest: 'assets/products/monument-pendant/closeup.webp',                      w: 1200, quality: 82 },
  { src: 'assets/products/northstar-pendant/black/front.jpeg',                 dest: 'assets/products/northstar-pendant/black/front.webp',                 w: 1200, quality: 82 },
  { src: 'assets/products/northstar-pendant/silver/front.jpeg',                dest: 'assets/products/northstar-pendant/silver/front.webp',                w: 1200, quality: 82 },
  { src: 'assets/products/obsidian-grid-pendant/gold/front.jpeg',              dest: 'assets/products/obsidian-grid-pendant/gold/front.webp',              w: 1200, quality: 82 },
  { src: 'assets/products/obsidian-grid-pendant/silver/front.jpeg',            dest: 'assets/products/obsidian-grid-pendant/silver/front.webp',            w: 1200, quality: 82 },
  { src: 'assets/products/obsidian-monarch-ring/front.jpeg',                   dest: 'assets/products/obsidian-monarch-ring/front.webp',                   w: 1200, quality: 82 },
  { src: 'assets/products/obsidian-monarch-ring/closeup.jpeg',                 dest: 'assets/products/obsidian-monarch-ring/closeup.webp',                 w: 1200, quality: 82 },
  { src: 'assets/products/onyx-core-pendant/black/front.jpeg',                 dest: 'assets/products/onyx-core-pendant/black/front.webp',                 w: 1200, quality: 82 },
  { src: 'assets/products/onyx-core-pendant/silver/front.jpeg',                dest: 'assets/products/onyx-core-pendant/silver/front.webp',                w: 1200, quality: 82 },
  { src: 'assets/products/path-finder-pendant/black/front.jpeg',               dest: 'assets/products/path-finder-pendant/black/front.webp',               w: 1200, quality: 82 },
  { src: 'assets/products/path-finder-pendant/gold/front.jpeg',                dest: 'assets/products/path-finder-pendant/gold/front.webp',                w: 1200, quality: 82 },
  { src: 'assets/products/path-finder-pendant/silver/front.jpeg',              dest: 'assets/products/path-finder-pendant/silver/front.webp',              w: 1200, quality: 82 },
  { src: 'assets/products/rune-shield-ring/black/front.jpeg',                  dest: 'assets/products/rune-shield-ring/black/front.webp',                  w: 1200, quality: 82 },
  { src: 'assets/products/rune-shield-ring/silver/front.jpeg',                 dest: 'assets/products/rune-shield-ring/silver/front.webp',                 w: 1200, quality: 82 },
  { src: 'assets/products/serpent-ascend-ring/black/front.jpeg',               dest: 'assets/products/serpent-ascend-ring/black/front.webp',               w: 1200, quality: 82 },
  { src: 'assets/products/serpent-ascend-ring/silver/front.jpeg',              dest: 'assets/products/serpent-ascend-ring/silver/front.webp',              w: 1200, quality: 82 },
  { src: 'assets/products/spear-pendant/black/front.jpeg',                     dest: 'assets/products/spear-pendant/black/front.webp',                     w: 1200, quality: 82 },
  { src: 'assets/products/spear-pendant/silver-with-black-stone/front.jpeg',   dest: 'assets/products/spear-pendant/silver-with-black-stone/front.webp',   w: 1200, quality: 82 },
  { src: 'assets/products/spear-pendant/silver/front.jpeg',                    dest: 'assets/products/spear-pendant/silver/front.webp',                    w: 1200, quality: 82 },
  { src: 'assets/products/tennis-black-stone-chain/front.jpeg',                dest: 'assets/products/tennis-black-stone-chain/front.webp',                w: 1200, quality: 82 },
  { src: 'assets/products/tennis-black-stone-chain/closeup.jpeg',              dest: 'assets/products/tennis-black-stone-chain/closeup.webp',              w: 1200, quality: 82 },
  { src: 'assets/products/world-tree-ring/black/front.jpeg',                   dest: 'assets/products/world-tree-ring/black/front.webp',                   w: 1200, quality: 82 },
  { src: 'assets/products/world-tree-ring/silver/front.jpeg',                  dest: 'assets/products/world-tree-ring/silver/front.webp',                  w: 1200, quality: 82 },

  // Keep existing PNG/WebP static assets as-is (already small or SVG)
  // bracelets_collection.png, rings_collection.png etc — convert
  { src: 'assets/bracelets_collection.png', dest: 'assets/bracelets_collection.webp', w: 900, quality: 80 },
  { src: 'assets/bracelet_1_detail.png',    dest: 'assets/bracelet_1_detail.webp',    w: 900, quality: 82 },
  { src: 'assets/bracelet_1_front.png',     dest: 'assets/bracelet_1_front.webp',     w: 900, quality: 82 },
  { src: 'assets/bracelet_1_lifestyle.png', dest: 'assets/bracelet_1_lifestyle.webp', w: 900, quality: 82 },
  { src: 'assets/rings_collection.png',     dest: 'assets/rings_collection.webp',     w: 900, quality: 80 },
  { src: 'assets/ring_1_detail.png',        dest: 'assets/ring_1_detail.webp',        w: 900, quality: 82 },
  { src: 'assets/ring_1_front.png',         dest: 'assets/ring_1_front.webp',         w: 900, quality: 82 },
  { src: 'assets/ring_1_lifestyle.png',     dest: 'assets/ring_1_lifestyle.webp',     w: 900, quality: 82 },
  { src: 'assets/pendants_collection.png',  dest: 'assets/pendants_collection.webp',  w: 900, quality: 80 },
  { src: 'assets/pendant_1_detail.png',     dest: 'assets/pendant_1_detail.webp',     w: 900, quality: 82 },
  { src: 'assets/pendant_1_front.png',      dest: 'assets/pendant_1_front.webp',      w: 900, quality: 82 },
  { src: 'assets/pendant_1_lifestyle.png',  dest: 'assets/pendant_1_lifestyle.webp',  w: 900, quality: 82 },
  { src: 'assets/limited_1_detail.png',     dest: 'assets/limited_1_detail.webp',     w: 900, quality: 82 },
  { src: 'assets/limited_1_front.png',      dest: 'assets/limited_1_front.webp',      w: 900, quality: 82 },
  { src: 'assets/limited_1_lifestyle.png',  dest: 'assets/limited_1_lifestyle.webp',  w: 900, quality: 82 },
  { src: 'assets/hero.png',                 dest: 'assets/hero.webp',                 w: 1600, quality: 80 },
  { src: 'assets/lifestyle_banner.png',     dest: 'assets/lifestyle_banner.webp',     w: 1920, quality: 80 },
];

// ─────────────────────────────────────────────────────────────────
// REFERENCE UPDATE MAP for PNG→WebP static assets
// ─────────────────────────────────────────────────────────────────
const PNG_WEBP_MAP = [
  ['assets/bracelets_collection.png', 'assets/bracelets_collection.webp'],
  ['assets/bracelet_1_detail.png',    'assets/bracelet_1_detail.webp'],
  ['assets/bracelet_1_front.png',     'assets/bracelet_1_front.webp'],
  ['assets/bracelet_1_lifestyle.png', 'assets/bracelet_1_lifestyle.webp'],
  ['assets/rings_collection.png',     'assets/rings_collection.webp'],
  ['assets/ring_1_detail.png',        'assets/ring_1_detail.webp'],
  ['assets/ring_1_front.png',         'assets/ring_1_front.webp'],
  ['assets/ring_1_lifestyle.png',     'assets/ring_1_lifestyle.webp'],
  ['assets/pendants_collection.png',  'assets/pendants_collection.webp'],
  ['assets/pendant_1_detail.png',     'assets/pendant_1_detail.webp'],
  ['assets/pendant_1_front.png',      'assets/pendant_1_front.webp'],
  ['assets/pendant_1_lifestyle.png',  'assets/pendant_1_lifestyle.webp'],
  ['assets/limited_1_detail.png',     'assets/limited_1_detail.webp'],
  ['assets/limited_1_front.png',      'assets/limited_1_front.webp'],
  ['assets/limited_1_lifestyle.png',  'assets/limited_1_lifestyle.webp'],
  ['assets/hero.png',                 'assets/hero.webp'],
  ['assets/lifestyle_banner.png',     'assets/lifestyle_banner.webp'],
];

const SOURCE_FILES = [
  'index.html', 'about.html', 'shop.html', 'checkout.html', 'account.html',
  'product.html', 'product-bracelet.html', 'product-pendant.html', 'product-limited.html',
  'products.js', 'script.js', 'store.js', 'styles.css',
];

async function run() {
  console.log('\n── Phase 2.1: Image Optimization ───────────────────────');
  let ok = 0, skip = 0, fail = 0;
  let totalBefore = 0, totalAfter = 0;

  for (const job of JOBS) {
    const srcAbs  = path.join(ROOT, job.src);
    const destAbs = path.join(ROOT, job.dest);

    if (!fs.existsSync(srcAbs)) {
      console.warn(`  SKIP (not found): ${job.src}`);
      skip++;
      continue;
    }

    const beforeSize = fs.statSync(srcAbs).size;
    totalBefore += beforeSize;

    try {
      fs.mkdirSync(path.dirname(destAbs), { recursive: true });
      await sharp(srcAbs)
        .resize({ width: job.w, withoutEnlargement: true })
        .webp({ quality: job.quality })
        .toFile(destAbs);

      const afterSize = fs.statSync(destAbs).size;
      totalAfter += afterSize;
      const pct = Math.round((1 - afterSize / beforeSize) * 100);
      console.log(`  ✓ ${path.basename(job.dest).padEnd(40)} ${Math.round(beforeSize/1024)}KB → ${Math.round(afterSize/1024)}KB (${pct}% smaller)`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${job.src}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n  Optimized: ${ok}  Skipped: ${skip}  Failed: ${fail}`);
  console.log(`  Total: ${Math.round(totalBefore/1024/1024*10)/10}MB → ${Math.round(totalAfter/1024/1024*10)/10}MB\n`);

  // Update PNG references in source files
  console.log('── Updating PNG→WebP references ─────────────────────');
  for (const relFile of SOURCE_FILES) {
    const absFile = path.join(ROOT, relFile);
    if (!fs.existsSync(absFile)) continue;
    let content = fs.readFileSync(absFile, 'utf8');
    let changed = false;
    for (const [oldRef, newRef] of PNG_WEBP_MAP) {
      if (content.includes(oldRef)) {
        content = content.split(oldRef).join(newRef);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(absFile, content, 'utf8');
      console.log(`  ✓ Updated: ${relFile}`);
    }
  }
  console.log('\nDone.\n');
}

run().catch(console.error);
