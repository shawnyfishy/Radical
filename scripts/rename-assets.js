/**
 * RADICAL — Asset Rename & Reference Update Script
 * Phase 1.1: Renames all spaced/special-char filenames to clean slugs,
 * then updates every HTML/CSS/JS reference to point at the new paths.
 *
 * Run from repo root: node scripts/rename-assets.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────
// 1. FILE RENAME MAP  (old path relative to ROOT → new path relative to ROOT)
// ─────────────────────────────────────────────────────────────────
const RENAMES = [
  // Videos
  ['assets/Radical Website Video Reboot(1).mp4',  'assets/video/hero-main.mp4'],
  ['assets/RADICAL WEBSITE VIDEO 222222.mp4',      'assets/video/full-bleed.mp4'],

  // Root-level images (will be converted to WebP in Phase 2, but rename now)
  ['assets/home picture.png',          'assets/images/home.png'],
  ['assets/our shop picture.jpeg',     'assets/images/nav-shop.jpeg'],
  ['assets/about us picture.jpeg',     'assets/images/nav-about.jpeg'],
  ['assets/contact us picture.jpeg',   'assets/images/nav-contact.jpeg'],
  ['assets/preloader picture.jpeg',    'assets/images/preloader.jpeg'],
  ['assets/community section.jpeg',    'assets/images/community.jpeg'],
  ['assets/design section.jpeg',       'assets/images/design.jpeg'],
  ['assets/menu_banner.jpeg',          'assets/images/menu-banner.jpeg'],
  ['assets/purpose section.jpeg',      'assets/images/purpose.jpeg'],
  ['assets/steel section.jpeg',        'assets/images/steel.jpeg'],

  // Product images — RADICAL FINAL WEBSITE PCITURES → assets/products/
  // Chainlink ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/chainlink ring/black/chainlink ring - black.jpeg',
   'assets/products/chainlink-ring/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/chainlink ring/silver/chainlink ring - silver.jpeg',
   'assets/products/chainlink-ring/silver/front.jpeg'],

  // Black stone ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/black stone ring/black stone ring.jpeg',
   'assets/products/black-stone-ring/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/black stone ring/black stone ring close up.jpeg',
   'assets/products/black-stone-ring/closeup.jpeg'],

  // Compass cuff
  ['assets/RADICAL FINAL WEBSITE PCITURES/compass cuff/black/compass cuff - black.jpeg',
   'assets/products/compass-cuff/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/compass cuff/silver/compass cuff - silver.jpeg',
   'assets/products/compass-cuff/silver/front.jpeg'],

  // Crown tennis bracelet
  ['assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/black on black/crown tennis bracelet - black on black.jpeg',
   'assets/products/crown-tennis-bracelet/black-on-black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/black on silver/crown tennis bracelet - black on silver.jpeg',
   'assets/products/crown-tennis-bracelet/black-on-silver/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/diamond on silver/crown tennis bracelet - diamond on silver.jpeg',
   'assets/products/crown-tennis-bracelet/diamond-on-silver/front.jpeg'],

  // Diamond vault ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/black on silver/diamond vault ring - black on silver.jpeg',
   'assets/products/diamond-vault-ring/black-on-silver/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/diamond on black/diamond vault ring - diamond on black.jpeg',
   'assets/products/diamond-vault-ring/diamond-on-black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/diamond on silver/diamond vault ring - diamond on silver.jpeg',
   'assets/products/diamond-vault-ring/diamond-on-silver/front.jpeg'],

  // Eclipse ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/eclipse ring/black/eclipse ring - black.jpeg',
   'assets/products/eclipse-ring/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/eclipse ring/silver/eclipse ring - silver.jpeg',
   'assets/products/eclipse-ring/silver/front.jpeg'],

  // Eclipse signet ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/eclipse signet ring/gold/eclipse signet ring - gold.jpeg',
   'assets/products/eclipse-signet-ring/gold/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/eclipse signet ring/silver/eclipse signet ring - silver.jpeg',
   'assets/products/eclipse-signet-ring/silver/front.jpeg'],

  // Eternal knot ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/black/eternal knot ring - black.jpeg',
   'assets/products/eternal-knot-ring/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/black/eternal knot ring black - close up.jpeg',
   'assets/products/eternal-knot-ring/black/closeup.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/silver/eternal knot ring - silver.jpeg',
   'assets/products/eternal-knot-ring/silver/front.jpeg'],

  // Guardian pendant (was "gaurdian" — typo fix)
  ['assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/black on black/gaurdian pendant - black on black.jpeg',
   'assets/products/guardian-pendant/black-on-black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/black on silver/gaurdian pendant - black on silver.jpeg',
   'assets/products/guardian-pendant/black-on-silver/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/diamond on silver/gaurdian pendant - diamond on silver.jpeg',
   'assets/products/guardian-pendant/diamond-on-silver/front.jpeg'],

  // Imperial eye ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/imperial eye ring/black gem/imperial eye ring - black gem.jpeg',
   'assets/products/imperial-eye-ring/black-gem/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/imperial eye ring/diamond gem/imperial eye ring - diamond gem.jpeg',
   'assets/products/imperial-eye-ring/diamond-gem/front.jpeg'],

  // Infinite loop pendant
  ['assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/black/infinite loop pendant - black.jpeg',
   'assets/products/infinite-loop-pendant/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/black/infinite loop pendant black- close up.jpeg',
   'assets/products/infinite-loop-pendant/black/closeup.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/silver/infinite loop pendant - silver.jpeg',
   'assets/products/infinite-loop-pendant/silver/front.jpeg'],

  // Legacy tag pendant
  ['assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/black with diamond/legacy tag pendant - black with diamond.jpeg',
   'assets/products/legacy-tag-pendant/black-with-diamond/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/silver with black gems/legacy tag pendant - silver with black gems.jpeg',
   'assets/products/legacy-tag-pendant/silver-with-black-gems/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/silver with diamond/legacy tag pendant - silver with diamond.jpeg',
   'assets/products/legacy-tag-pendant/silver-with-diamond/front.jpeg'],

  // Monument pendant
  ['assets/RADICAL FINAL WEBSITE PCITURES/monument pendant/monument pendant.jpeg',
   'assets/products/monument-pendant/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/monument pendant/monument pendant - close up.jpeg',
   'assets/products/monument-pendant/closeup.jpeg'],

  // Northstar pendant
  ['assets/RADICAL FINAL WEBSITE PCITURES/northstar pendant/black/northstar pendant - black.jpeg',
   'assets/products/northstar-pendant/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/northstar pendant/silver/northstar pendant - silver.jpeg',
   'assets/products/northstar-pendant/silver/front.jpeg'],

  // Obsidian grid pendant
  ['assets/RADICAL FINAL WEBSITE PCITURES/obsidian grid pendant/gold/obsidian grid pendant - gold.jpeg',
   'assets/products/obsidian-grid-pendant/gold/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/obsidian grid pendant/silver/obsidian grid pendant - silver.jpeg',
   'assets/products/obsidian-grid-pendant/silver/front.jpeg'],

  // Obsidian monarch ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/obsidian monarch ring/obsidian monarch ring.jpeg',
   'assets/products/obsidian-monarch-ring/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/obsidian monarch ring/obsidian monarch ring - close up.jpeg',
   'assets/products/obsidian-monarch-ring/closeup.jpeg'],

  // Onyx core pendant (was "onyc" — typo fix)
  ['assets/RADICAL FINAL WEBSITE PCITURES/onyx core pendant/black/onyc core pendant - black.jpeg',
   'assets/products/onyx-core-pendant/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/onyx core pendant/silver/onyx core pendant - silver.jpeg',
   'assets/products/onyx-core-pendant/silver/front.jpeg'],

  // Path finder pendant
  ['assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/black/path finder pendant - black.jpeg',
   'assets/products/path-finder-pendant/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/gold/path finder pendant - gold.jpeg',
   'assets/products/path-finder-pendant/gold/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/silver/path finder pendant - silver.jpeg',
   'assets/products/path-finder-pendant/silver/front.jpeg'],

  // Rune shield ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/rune shield ring/black/rune shield ring - black.jpeg',
   'assets/products/rune-shield-ring/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/rune shield ring/silver/rune shield ring - silver.jpeg',
   'assets/products/rune-shield-ring/silver/front.jpeg'],

  // Serpent ascend ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/serpent ascend ring/black/serpent ascend ring - black.jpeg',
   'assets/products/serpent-ascend-ring/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/serpent ascend ring/silver/serpent ascend ring - silver.jpeg',
   'assets/products/serpent-ascend-ring/silver/front.jpeg'],

  // Spear pendant
  ['assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/black/spear pendant - black.jpeg',
   'assets/products/spear-pendant/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/silver with black stone/spear pendant - silver with black stone.jpeg',
   'assets/products/spear-pendant/silver-with-black-stone/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/silver/spear pendant - silver.jpeg',
   'assets/products/spear-pendant/silver/front.jpeg'],

  // Tennis black stone chain
  ['assets/RADICAL FINAL WEBSITE PCITURES/tennis black stone chain/tennis black stone chain.jpeg',
   'assets/products/tennis-black-stone-chain/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/tennis black stone chain/tennis black stone chain close up.jpeg',
   'assets/products/tennis-black-stone-chain/closeup.jpeg'],

  // World tree ring
  ['assets/RADICAL FINAL WEBSITE PCITURES/world tree ring/black/world tree ring - black.jpeg',
   'assets/products/world-tree-ring/black/front.jpeg'],
  ['assets/RADICAL FINAL WEBSITE PCITURES/world tree ring/silver/world tree ring silver.jpeg',
   'assets/products/world-tree-ring/silver/front.jpeg'],
];

// ─────────────────────────────────────────────────────────────────
// 2. REFERENCE REPLACEMENT MAP (old URL string → new URL string)
//    Covers: both the original path AND any percent-encoded variant
// ─────────────────────────────────────────────────────────────────
const REF_MAP = [
  // Videos
  ['assets/Radical%20Website%20Video%20Reboot(1).mp4', 'assets/video/hero-desktop.mp4'],
  ['assets/Radical%20Website%20Video%20Reboot%281%29.mp4', 'assets/video/hero-desktop.mp4'],
  ['assets/Radical Website Video Reboot(1).mp4', 'assets/video/hero-desktop.mp4'],
  ['assets/RADICAL%20WEBSITE%20VIDEO%20222222.mp4', 'assets/video/full-bleed-desktop.mp4'],
  ['assets/RADICAL WEBSITE VIDEO 222222.mp4', 'assets/video/full-bleed-desktop.mp4'],
  // Stale backend references
  ['RADICAL%20WEBSITE%20VIDEO%20REBOOT.mp4', 'assets/video/hero-desktop.mp4'],
  ['RADICAL%20WEBSITE%20VIDEO%20222222.mp4', 'assets/video/full-bleed-desktop.mp4'],
  ['hero_desktop', 'assets/video/hero-desktop.mp4'],
  ['hero_mobile',  'assets/video/hero-mobile.mp4'],
  ['full_bleed_optimized', 'assets/video/full-bleed-desktop.mp4'],

  // Root images
  ['assets/home%20picture.png',        'assets/images/home.webp'],
  ['assets/home picture.png',          'assets/images/home.webp'],
  ['assets/our%20shop%20picture.jpeg', 'assets/images/nav-shop.webp'],
  ['assets/our shop picture.jpeg',     'assets/images/nav-shop.webp'],
  ['assets/about%20us%20picture.jpeg', 'assets/images/nav-about.webp'],
  ['assets/about us picture.jpeg',     'assets/images/nav-about.webp'],
  ['assets/contact%20us%20picture.jpeg', 'assets/images/nav-contact.webp'],
  ['assets/contact us picture.jpeg',   'assets/images/nav-contact.webp'],
  ['assets/preloader%20picture.jpeg',  'assets/images/preloader.webp'],
  ['assets/preloader picture.jpeg',    'assets/images/preloader.webp'],
  ['assets/community%20section.jpeg',  'assets/images/community.webp'],
  ['assets/community section.jpeg',    'assets/images/community.webp'],
  ['assets/design%20section.jpeg',     'assets/images/design.webp'],
  ['assets/design section.jpeg',       'assets/images/design.webp'],
  ['assets/menu_banner.jpeg',          'assets/images/menu-banner.webp'],
  ['assets/purpose%20section.jpeg',    'assets/images/purpose.webp'],
  ['assets/purpose section.jpeg',      'assets/images/purpose.webp'],
  ['assets/steel%20section.jpeg',      'assets/images/steel.webp'],
  ['assets/steel section.jpeg',        'assets/images/steel.webp'],

  // Product images — old path → new path
  // (products.js uses long paths with spaces; map each one)
  ["assets/RADICAL FINAL WEBSITE PCITURES/chainlink ring/black/chainlink ring - black.jpeg",
   "assets/products/chainlink-ring/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/chainlink ring/silver/chainlink ring - silver.jpeg",
   "assets/products/chainlink-ring/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/black stone ring/black stone ring.jpeg",
   "assets/products/black-stone-ring/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/black stone ring/black stone ring close up.jpeg",
   "assets/products/black-stone-ring/closeup.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/compass cuff/black/compass cuff - black.jpeg",
   "assets/products/compass-cuff/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/compass cuff/silver/compass cuff - silver.jpeg",
   "assets/products/compass-cuff/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/black on black/crown tennis bracelet - black on black.jpeg",
   "assets/products/crown-tennis-bracelet/black-on-black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/black on silver/crown tennis bracelet - black on silver.jpeg",
   "assets/products/crown-tennis-bracelet/black-on-silver/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/diamond on silver/crown tennis bracelet - diamond on silver.jpeg",
   "assets/products/crown-tennis-bracelet/diamond-on-silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/black on silver/diamond vault ring - black on silver.jpeg",
   "assets/products/diamond-vault-ring/black-on-silver/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/diamond on black/diamond vault ring - diamond on black.jpeg",
   "assets/products/diamond-vault-ring/diamond-on-black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/diamond on silver/diamond vault ring - diamond on silver.jpeg",
   "assets/products/diamond-vault-ring/diamond-on-silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/eclipse ring/black/eclipse ring - black.jpeg",
   "assets/products/eclipse-ring/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/eclipse ring/silver/eclipse ring - silver.jpeg",
   "assets/products/eclipse-ring/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/eclipse signet ring/gold/eclipse signet ring - gold.jpeg",
   "assets/products/eclipse-signet-ring/gold/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/eclipse signet ring/silver/eclipse signet ring - silver.jpeg",
   "assets/products/eclipse-signet-ring/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/black/eternal knot ring - black.jpeg",
   "assets/products/eternal-knot-ring/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/black/eternal knot ring black - close up.jpeg",
   "assets/products/eternal-knot-ring/black/closeup.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/silver/eternal knot ring - silver.jpeg",
   "assets/products/eternal-knot-ring/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/black on black/gaurdian pendant - black on black.jpeg",
   "assets/products/guardian-pendant/black-on-black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/black on silver/gaurdian pendant - black on silver.jpeg",
   "assets/products/guardian-pendant/black-on-silver/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/diamond on silver/gaurdian pendant - diamond on silver.jpeg",
   "assets/products/guardian-pendant/diamond-on-silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/imperial eye ring/black gem/imperial eye ring - black gem.jpeg",
   "assets/products/imperial-eye-ring/black-gem/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/imperial eye ring/diamond gem/imperial eye ring - diamond gem.jpeg",
   "assets/products/imperial-eye-ring/diamond-gem/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/black/infinite loop pendant - black.jpeg",
   "assets/products/infinite-loop-pendant/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/black/infinite loop pendant black- close up.jpeg",
   "assets/products/infinite-loop-pendant/black/closeup.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/silver/infinite loop pendant - silver.jpeg",
   "assets/products/infinite-loop-pendant/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/black with diamond/legacy tag pendant - black with diamond.jpeg",
   "assets/products/legacy-tag-pendant/black-with-diamond/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/silver with black gems/legacy tag pendant - silver with black gems.jpeg",
   "assets/products/legacy-tag-pendant/silver-with-black-gems/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/silver with diamond/legacy tag pendant - silver with diamond.jpeg",
   "assets/products/legacy-tag-pendant/silver-with-diamond/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/monument pendant/monument pendant.jpeg",
   "assets/products/monument-pendant/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/monument pendant/monument pendant - close up.jpeg",
   "assets/products/monument-pendant/closeup.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/northstar pendant/black/northstar pendant - black.jpeg",
   "assets/products/northstar-pendant/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/northstar pendant/silver/northstar pendant - silver.jpeg",
   "assets/products/northstar-pendant/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/obsidian grid pendant/gold/obsidian grid pendant - gold.jpeg",
   "assets/products/obsidian-grid-pendant/gold/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/obsidian grid pendant/silver/obsidian grid pendant - silver.jpeg",
   "assets/products/obsidian-grid-pendant/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/obsidian monarch ring/obsidian monarch ring.jpeg",
   "assets/products/obsidian-monarch-ring/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/obsidian monarch ring/obsidian monarch ring - close up.jpeg",
   "assets/products/obsidian-monarch-ring/closeup.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/onyx core pendant/black/onyc core pendant - black.jpeg",
   "assets/products/onyx-core-pendant/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/onyx core pendant/silver/onyx core pendant - silver.jpeg",
   "assets/products/onyx-core-pendant/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/black/path finder pendant - black.jpeg",
   "assets/products/path-finder-pendant/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/gold/path finder pendant - gold.jpeg",
   "assets/products/path-finder-pendant/gold/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/silver/path finder pendant - silver.jpeg",
   "assets/products/path-finder-pendant/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/rune shield ring/black/rune shield ring - black.jpeg",
   "assets/products/rune-shield-ring/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/rune shield ring/silver/rune shield ring - silver.jpeg",
   "assets/products/rune-shield-ring/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/serpent ascend ring/black/serpent ascend ring - black.jpeg",
   "assets/products/serpent-ascend-ring/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/serpent ascend ring/silver/serpent ascend ring - silver.jpeg",
   "assets/products/serpent-ascend-ring/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/black/spear pendant - black.jpeg",
   "assets/products/spear-pendant/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/silver with black stone/spear pendant - silver with black stone.jpeg",
   "assets/products/spear-pendant/silver-with-black-stone/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/silver/spear pendant - silver.jpeg",
   "assets/products/spear-pendant/silver/front.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/tennis black stone chain/tennis black stone chain.jpeg",
   "assets/products/tennis-black-stone-chain/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/tennis black stone chain/tennis black stone chain close up.jpeg",
   "assets/products/tennis-black-stone-chain/closeup.webp"],

  ["assets/RADICAL FINAL WEBSITE PCITURES/world tree ring/black/world tree ring - black.jpeg",
   "assets/products/world-tree-ring/black/front.webp"],
  ["assets/RADICAL FINAL WEBSITE PCITURES/world tree ring/silver/world tree ring silver.jpeg",
   "assets/products/world-tree-ring/silver/front.webp"],
];

// ─────────────────────────────────────────────────────────────────
// 3. FILES TO UPDATE REFERENCES IN
// ─────────────────────────────────────────────────────────────────
const SOURCE_FILES = [
  'index.html', 'about.html', 'shop.html', 'checkout.html', 'account.html',
  'product.html', 'product-bracelet.html', 'product-pendant.html', 'product-limited.html',
  'products.js', 'script.js', 'store.js', 'api.js', 'motion.config.js',
  'backend/server.js', 'styles.css',
];

// ─────────────────────────────────────────────────────────────────
// 4. EXECUTE RENAMES
// ─────────────────────────────────────────────────────────────────
console.log('\n── Phase 1: Renaming files ─────────────────────────────');
let renameCount = 0, renameSkip = 0, renameFail = 0;

for (const [oldRel, newRel] of RENAMES) {
  const oldAbs = path.join(ROOT, oldRel);
  const newAbs = path.join(ROOT, newRel);

  if (!fs.existsSync(oldAbs)) {
    console.warn(`  SKIP (not found): ${oldRel}`);
    renameSkip++;
    continue;
  }

  fs.mkdirSync(path.dirname(newAbs), { recursive: true });
  fs.renameSync(oldAbs, newAbs);
  console.log(`  ✓ ${oldRel}\n    → ${newRel}`);
  renameCount++;
}

console.log(`\n  Renamed: ${renameCount}  Skipped: ${renameSkip}  Failed: ${renameFail}\n`);

// ─────────────────────────────────────────────────────────────────
// 5. UPDATE REFERENCES IN SOURCE FILES
// ─────────────────────────────────────────────────────────────────
console.log('── Phase 2: Updating references ────────────────────────');
let refFilesUpdated = 0, refReplacements = 0;

for (const relFile of SOURCE_FILES) {
  const absFile = path.join(ROOT, relFile);
  if (!fs.existsSync(absFile)) {
    console.warn(`  SKIP (not found): ${relFile}`);
    continue;
  }

  let content = fs.readFileSync(absFile, 'utf8');
  let changed = false;
  let fileReplacements = 0;

  for (const [oldRef, newRef] of REF_MAP) {
    if (content.includes(oldRef)) {
      const count = (content.split(oldRef).length - 1);
      content = content.split(oldRef).join(newRef);
      fileReplacements += count;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(absFile, content, 'utf8');
    console.log(`  ✓ ${relFile} (${fileReplacements} replacements)`);
    refFilesUpdated++;
    refReplacements += fileReplacements;
  } else {
    console.log(`  — ${relFile} (no changes)`);
  }
}

console.log(`\n  Files updated: ${refFilesUpdated}  Total replacements: ${refReplacements}\n`);
console.log('Done. Run scripts/verify-assets.js next to confirm zero broken references.\n');
