require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db     = require('./database');

console.log('Seeding database...');

// Clear existing products and variants for a clean seed
db.prepare('DELETE FROM variants').run();
db.prepare('DELETE FROM products').run();
try {
  db.prepare("DELETE FROM sqlite_sequence WHERE name='products'").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name='variants'").run();
} catch (e) {}
console.log('Cleared old products and variants, and reset autoincrement.');

// Admin user
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(process.env.ADMIN_EMAIL);
if (!adminExists) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin', process.env.ADMIN_EMAIL, bcrypt.hashSync('radical_admin_123', 10), 'admin'
  );
  console.log(`Admin created: ${process.env.ADMIN_EMAIL} / radical_admin_123`);
}

// Sample products
const products = [
  {
    name: 'Chainlink Ring - Black',
    slug: 'chainlink-ring-black',
    category: 'rings',
    price: 841,
    compare_price: 1999,
    description: 'Matte black finish over surgical steel, structured like a heavy industrial chain link. Solid weight.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/chainlink ring/black/chainlink ring - black.jpeg']
  },
  {
    name: 'Chainlink Ring - Silver',
    slug: 'chainlink-ring-silver',
    category: 'rings',
    price: 841,
    compare_price: 1999,
    description: 'Brushed surgical steel band, structured like a heavy industrial chain link. Architectural strength.',
    material: 'Material : Brass, Silver plated\nColor : Oxydised Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/chainlink ring/silver/chainlink ring - silver.jpeg']
  },
  {
    name: 'Compass Chain - Black',
    slug: 'compass-chain-black',
    category: 'pendants',
    price: 4624,
    compare_price: 11499,
    description: 'Matte black steel chain featuring an engraved compass motif. Worn to navigate your own path.',
    material: 'White rodium plated setting with round  black ceramic stones necklace\nColor : Silver, Black',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/compass cuff/black/compass cuff - black.jpeg']
  },
  {
    name: 'Compass Chain - Silver',
    slug: 'compass-chain-silver',
    category: 'pendants',
    price: 4624,
    compare_price: 11499,
    description: 'Brushed steel chain featuring an engraved compass motif. Architectural design for daily wear.',
    material: 'Solitare necklace set in white rodium.\nMaterial : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/compass cuff/silver/compass cuff - silver.jpeg']
  },
  {
    name: 'Crown Tennis Bracelet - Black on Black',
    slug: 'crown-tennis-bracelet-black-on-black',
    category: 'bracelets',
    price: 4624,
    compare_price: 11499,
    description: 'Black-coated surgical steel band set with midnight onyx stones in a crown bezel.',
    material: 'Black rodium plated setting with round  black ceramic stones.\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/black on black/crown tennis bracelet - black on black.jpeg']
  },
  {
    name: 'Crown Tennis Bracelet - Black on Silver',
    slug: 'crown-tennis-bracelet-black-on-silver',
    category: 'bracelets',
    price: 4624,
    compare_price: 11499,
    description: 'Brushed steel band set with polished black onyx stones in a crown bezel setting.',
    material: 'White rodium plated setting with round  black ceramic stones\nColor : Silver, Black',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/black on silver/crown tennis bracelet - black on silver.jpeg']
  },
  {
    name: 'Crown Tennis Bracelet - Diamond on Silver',
    slug: 'crown-tennis-bracelet-diamond-on-silver',
    category: 'bracelets',
    price: 4624,
    compare_price: 11499,
    description: 'Brushed steel band set with brilliant white stones in a crown bezel setting.',
    material: 'Solitare bracelet set in white rodium.\nMaterial : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/crown tennis bracelet/diamond on silver/crown tennis bracelet - diamond on silver.jpeg']
  },
  {
    name: 'Diamond Vault Ring - Black on Silver',
    slug: 'diamond-vault-ring-black-on-silver',
    category: 'rings',
    price: 1429,
    compare_price: 3499,
    description: 'Architectural steel vault ring featuring inset black onyx stones.',
    material: 'Pave Set CZ Wide Band Ring\nWhite rodium plated ring with round black ceramic stones',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/black on silver/diamond vault ring - black on silver.jpeg']
  },
  {
    name: 'Diamond Vault Ring - Diamond on Black',
    slug: 'diamond-vault-ring-diamond-on-black',
    category: 'rings',
    price: 1429,
    compare_price: 3499,
    description: 'Matte black steel vault ring set with brilliant white diamond-cut stones.',
    material: 'Pave Set CZ Wide Band Ring\nMaterial : Brass, Black Gold, Cubic Zirconia\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/diamond on black/diamond vault ring - diamond on black.jpeg']
  },
  {
    name: 'Diamond Vault Ring - Diamond on Silver',
    slug: 'diamond-vault-ring-diamond-on-silver',
    category: 'rings',
    price: 1429,
    compare_price: 3499,
    description: 'Brushed steel vault ring set with brilliant white diamond-cut stones.',
    material: 'Pave Set CZ Wide Band Ring\nWhite rodium plated ring with high grade cubic zirco',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/diamond vault ring/diamond on silver/diamond vault ring - diamond on silver.jpeg']
  },
  {
    name: 'Eclipse Ring - Black',
    slug: 'eclipse-ring-black',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Matte black band with a central offset groove representing a partial eclipse.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/eclipse ring/black/eclipse ring - black.jpeg']
  },
  {
    name: 'Eclipse Ring - Silver',
    slug: 'eclipse-ring-silver',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Polished surgical steel band with a central offset groove representing a partial eclipse.',
    material: 'Material : Brass, Silver plated\nColor : Oxydised Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/eclipse ring/silver/eclipse ring - silver.jpeg']
  },
  {
    name: 'Eclipse Signet Ring - Gold',
    slug: 'eclipse-signet-ring-gold',
    category: 'rings',
    price: 1009,
    compare_price: 2499,
    description: 'Gold-plated steel signet ring with an eclipse carving on the face.',
    material: 'Material : Brass, Gold plated\nColor : Gold',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/eclipse signet ring/gold/eclipse signet ring - gold.jpeg']
  },
  {
    name: 'Eclipse Signet Ring - Silver',
    slug: 'eclipse-signet-ring-silver',
    category: 'rings',
    price: 1009,
    compare_price: 2499,
    description: 'Brushed surgical steel signet ring with an eclipse carving on the face.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/eclipse signet ring/silver/eclipse signet ring - silver.jpeg']
  },
  {
    name: 'Eternal Knot Ring - Black',
    slug: 'eternal-knot-ring-black',
    category: 'rings',
    price: 925,
    compare_price: 1999,
    description: 'Intricately woven Celtic eternal knot design in a matte black finish.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: [
      'assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/black/eternal knot ring - black.jpeg',
      'assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/black/eternal knot ring black - close up.jpeg'
    ]
  },
  {
    name: 'Eternal Knot Ring - Silver',
    slug: 'eternal-knot-ring-silver',
    category: 'rings',
    price: 925,
    compare_price: 1999,
    description: 'Intricately woven Celtic eternal knot design in brushed surgical steel.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/eternal knot ring/silver/eternal knot ring - silver.jpeg']
  },
  {
    name: 'Guardian Pendant - Black on Black',
    slug: 'guardian-pendant-black-on-black',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Black-coated shield pendant set with a central black onyx cabochon. Hand-finished.',
    material: 'Material : Brass, Black Gold, Black Enamel\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/black on black/gaurdian pendant - black on black.jpeg']
  },
  {
    name: 'Guardian Pendant - Black on Silver',
    slug: 'guardian-pendant-black-on-silver',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Steel shield pendant set with a central black onyx cabochon.',
    material: 'Material : Brass, Silver plated, Black Enamel\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/black on silver/gaurdian pendant - black on silver.jpeg']
  },
  {
    name: 'Guardian Pendant - Diamond on Silver',
    slug: 'guardian-pendant-diamond-on-silver',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Steel shield pendant set with a central brilliant white stone.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/gaurdian pendant/diamond on silver/gaurdian pendant - diamond on silver.jpeg']
  },
  {
    name: 'Imperial Eye Ring - Black Gem',
    slug: 'imperial-eye-ring-black-gem',
    category: 'rings',
    price: 946,
    compare_price: 2499,
    description: 'Deeply engraved eye motif signet ring, set with a central black onyx stone.',
    material: 'Material : Brass, Silver plated, Black Onyx\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/imperial eye ring/black gem/imperial eye ring - black gem.jpeg']
  },
  {
    name: 'Imperial Eye Ring - Diamond Gem',
    slug: 'imperial-eye-ring-diamond-gem',
    category: 'rings',
    price: 946,
    compare_price: 2499,
    description: 'Deeply engraved eye motif signet ring, set with a central brilliant white gem.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/imperial eye ring/diamond gem/imperial eye ring - diamond gem.jpeg']
  },
  {
    name: 'Infinite Loop Pendant - Black',
    slug: 'infinite-loop-pendant-black',
    category: 'pendants',
    price: 1240,
    compare_price: 2999,
    description: 'Continuous twist Möbius pendant in a matte black surgical steel finish.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: [
      'assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/black/infinite loop pendant - black.jpeg',
      'assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/black/infinite loop pendant black- close up.jpeg'
    ]
  },
  {
    name: 'Infinite Loop Pendant - Silver',
    slug: 'infinite-loop-pendant-silver',
    category: 'pendants',
    price: 1240,
    compare_price: 2999,
    description: 'Continuous twist Möbius pendant in brushed 316L surgical steel.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/infinite loop pendant/silver/infinite loop pendant - silver.jpeg']
  },
  {
    name: 'Legacy Tag Pendant - Black with Diamond',
    slug: 'legacy-tag-pendant-black-with-diamond',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Matte black military-style dog tag set with a brilliant white stone.',
    material: 'Material : Brass, Black Gold, AAA grade CZ\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/black with diamond/legacy tag pendant - black with diamond.jpeg']
  },
  {
    name: 'Legacy Tag Pendant - Silver with Black Gems',
    slug: 'legacy-tag-pendant-silver-with-black-gems',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Brushed steel dog tag pendant set with double black onyx gems.',
    material: 'Material : Brass, Silver plated, Black ceramic stones\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/silver with black gems/legacy tag pendant - silver with black gems.jpeg']
  },
  {
    name: 'Legacy Tag Pendant - Silver with Diamond',
    slug: 'legacy-tag-pendant-silver-with-diamond',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Brushed steel dog tag pendant set with a central brilliant white gem.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/legacy tag pendant/silver with diamond/legacy tag pendant - silver with diamond.jpeg']
  },
  {
    name: 'Monument Pendant',
    slug: 'monument-pendant',
    category: 'pendants',
    price: 1429,
    compare_price: 3499,
    description: 'Solid steel pillar pendant inspired by brutalist architecture. Heavy, balanced weight.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: [
      'assets/RADICAL FINAL WEBSITE PCITURES/monument pendant/monument pendant.jpeg',
      'assets/RADICAL FINAL WEBSITE PCITURES/monument pendant/monument pendant - close up.jpeg'
    ]
  },
  {
    name: 'Northstar Pendant - Black',
    slug: 'northstar-pendant-black',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Compass star design in a matte black finish, worn as a point of reference.',
    material: 'Material : Brass, Black Gold, AAA grade CZ\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/northstar pendant/black/northstar pendant - black.jpeg']
  },
  {
    name: 'Northstar Pendant - Silver',
    slug: 'northstar-pendant-silver',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Compass star design in brushed surgical steel, a classic emblem of direction.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/northstar pendant/silver/northstar pendant - silver.jpeg']
  },
  {
    name: 'Obsidian Grid Pendant - Gold',
    slug: 'obsidian-grid-pendant-gold',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: '18K Gold plated steel framing a textured black obsidian tile.',
    material: 'Material : Brass, Gold plated, Black Enamel.\nColor : Gold',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/obsidian grid pendant/gold/obsidian grid pendant - gold.jpeg']
  },
  {
    name: 'Obsidian Grid Pendant - Silver',
    slug: 'obsidian-grid-pendant-silver',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: 'Surgical steel frame holding a textured black obsidian stone tile.',
    material: 'Material : Brass, Silver plated, Black Enamel.\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/obsidian grid pendant/silver/obsidian grid pendant - silver.jpeg']
  },
  {
    name: 'Obsidian Monarch Ring',
    slug: 'obsidian-monarch-ring',
    category: 'rings',
    price: 1366,
    compare_price: 2999,
    description: 'Heavy signet ring featuring a polished flat black obsidian slab.',
    material: 'Material : Brass, Silver plated, Black Obsidian\nColor : Silver',
    images: [
      'assets/RADICAL FINAL WEBSITE PCITURES/obsidian monarch ring/obsidian monarch ring.jpeg',
      'assets/RADICAL FINAL WEBSITE PCITURES/obsidian monarch ring/obsidian monarch ring - close up.jpeg'
    ]
  },
  {
    name: 'Onyx Core Pendant - Black',
    slug: 'onyx-core-pendant-black',
    category: 'pendants',
    price: 1114,
    compare_price: 2499,
    description: 'Matte black steel frame holding a solid black onyx cylinder core.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/onyx core pendant/black/onyc core pendant - black.jpeg']
  },
  {
    name: 'Onyx Core Pendant - Silver',
    slug: 'onyx-core-pendant-silver',
    category: 'pendants',
    price: 1114,
    compare_price: 2499,
    description: 'Brushed surgical steel frame holding a solid black onyx cylinder core.',
    material: 'Material : Brass, Silver plated, Black Enamel.\nColor : Oxydised Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/onyx core pendant/silver/onyx core pendant - silver.jpeg']
  },
  {
    name: 'Path Finder Pendant - Black',
    slug: 'path-finder-pendant-black',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Minimal geometric arrow pendant in a matte black finish.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/black/path finder pendant - black.jpeg']
  },
  {
    name: 'Path Finder Pendant - Gold',
    slug: 'path-finder-pendant-gold',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Minimal geometric arrow pendant plated in 18K yellow gold.',
    material: 'Material : Brass, Gold plated\nColor : Gold',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/gold/path finder pendant - gold.jpeg']
  },
  {
    name: 'Path Finder Pendant - Silver',
    slug: 'path-finder-pendant-silver',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Minimal geometric arrow pendant in brushed surgical-grade steel.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/path finder pendant/silver/path finder pendant - silver.jpeg']
  },
  {
    name: 'Rune Shield Ring - Black',
    slug: 'rune-shield-ring-black',
    category: 'rings',
    price: 841,
    compare_price: 1999,
    description: 'Matte black steel band carved with ancient protective runes.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/rune shield ring/black/rune shield ring - black.jpeg']
  },
  {
    name: 'Rune Shield Ring - Silver',
    slug: 'rune-shield-ring-silver',
    category: 'rings',
    price: 841,
    compare_price: 1999,
    description: 'Surgical-grade steel band carved with ancient protective runes.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/rune shield ring/silver/rune shield ring - silver.jpeg']
  },
  {
    name: 'Serpent Ascend Ring - Black',
    slug: 'serpent-ascend-ring-black',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Coiled serpent design representing wisdom and renewal in a matte black finish.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/serpent ascend ring/black/serpent ascend ring - black.jpeg']
  },
  {
    name: 'Serpent Ascend Ring - Silver',
    slug: 'serpent-ascend-ring-silver',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Coiled serpent design representing wisdom and renewal in brushed steel.',
    material: 'Material : Brass, Silver plated\nColor : Oxydised Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/serpent ascend ring/silver/serpent ascend ring - silver.jpeg']
  },
  {
    name: 'Spear Pendant - Black',
    slug: 'spear-pendant-black',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: 'Brutalist spear tip pendant in a matte black surgical steel finish.',
    material: 'Material : Brass, Black Gold, Black Onyx.\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/black/spear pendant - black.jpeg']
  },
  {
    name: 'Spear Pendant - Silver',
    slug: 'spear-pendant-silver',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: 'Brutalist spear tip pendant in hand-finished brushed surgical steel.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/silver/spear pendant - silver.jpeg']
  },
  {
    name: 'Spear Pendant - Silver with Black Stone',
    slug: 'spear-pendant-silver-with-black-stone',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: 'Brutalist spear tip pendant in silver steel, set with a raw black onyx stone.',
    material: 'Material : Brass, Silver plated, Black Onyx.\nColor : Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/spear pendant/silver with black stone/spear pendant - silver with black stone.jpeg']
  },
  {
    name: 'Tennis Black Stone Chain',
    slug: 'tennis-black-stone-chain',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Continuous collar chain set with round brilliant-cut midnight onyx gems.',
    material: 'Material : Brass, Silver plated, Black Onyx.\nColor : Oxydised Silver',
    images: [
      'assets/RADICAL FINAL WEBSITE PCITURES/tennis black stone chain/tennis black stone chain.jpeg',
      'assets/RADICAL FINAL WEBSITE PCITURES/tennis black stone chain/tennis black stone chain close up.jpeg'
    ]
  },
  {
    name: 'World Tree Ring - Black',
    slug: 'world-tree-ring-black',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Engraved Yggdrasil World Tree band in a textured matte black finish.',
    material: 'Material : Brass, Black Gold, Black Onyx.\nColor : Black Gold / Gun metal',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/world tree ring/black/world tree ring - black.jpeg']
  },
  {
    name: 'World Tree Ring - Silver',
    slug: 'world-tree-ring-silver',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Engraved Yggdrasil World Tree band in textured brushed surgical steel.',
    material: 'Material : Brass, Silver plated\nColor : Oxydised Silver',
    images: ['assets/RADICAL FINAL WEBSITE PCITURES/world tree ring/silver/world tree ring silver.jpeg']
  }
];


for (const p of products) {
  const exists = db.prepare('SELECT id FROM products WHERE slug = ?').get(p.slug);
  if (!exists) {
    const result = db.prepare(`
      INSERT INTO products (name, slug, description, category, price, compare_price, images, material)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.name, p.slug, p.description, p.category, p.price, p.compare_price || null, JSON.stringify(p.images), p.material || null);

    // Add size variants
    if (p.category === 'rings') {
      ['Size 8','Size 9','Size 10','Size 11','Size 12'].forEach((label, i) => {
        db.prepare('INSERT INTO variants (product_id, label, sku, stock) VALUES (?, ?, ?, ?)').run(
          result.lastInsertRowid, label, `${p.slug}-${8+i}`, 10
        );
      });
    } else if (p.category === 'bracelets') {
      ['Size S','Size M','Size L','Size XL'].forEach((label) => {
        db.prepare('INSERT INTO variants (product_id, label, sku, stock) VALUES (?, ?, ?, ?)').run(
          result.lastInsertRowid, label, `${p.slug}-${label.toLowerCase().replace(' ', '')}`, 15
        );
      });
    } else if (p.category === 'pendants') {
      ['18"','20"','22"'].forEach((label) => {
        db.prepare('INSERT INTO variants (product_id, label, sku, stock) VALUES (?, ?, ?, ?)').run(
          result.lastInsertRowid, label, `${p.slug}-${label.replace('"', 'in')}`, 15
        );
      });
    } else {
      db.prepare('INSERT INTO variants (product_id, label, sku, stock) VALUES (?, ?, ?, ?)').run(
        result.lastInsertRowid, 'Standard', `${p.slug}-std`, 20
      );
    }
    console.log(`Created product: ${p.name}`);
  }
}

console.log('Seeding complete.');
process.exit(0);
