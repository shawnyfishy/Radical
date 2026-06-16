require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');

function seedDatabase(db) {
  console.log('Seeding database...');

// Clear existing products and variants for a clean seed
try {
  db.prepare('DELETE FROM order_items').run();
  db.prepare('DELETE FROM orders').run();
  db.prepare('DELETE FROM cart_items').run();
} catch (e) {
  console.log('Note: Tables order_items/orders/cart_items could not be cleared:', e.message);
}
db.prepare('DELETE FROM variants').run();
db.prepare('DELETE FROM products').run();
try {
  db.prepare("DELETE FROM sqlite_sequence WHERE name='products'").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name='variants'").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name='orders'").run();
} catch (e) {}
console.log('Cleared old products, variants, orders, cart, and reset autoincrement.');

// Admin user
const adminEmail = process.env.ADMIN_EMAIL || 'admin@radical.com';
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!adminExists) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin', adminEmail, bcrypt.hashSync('radical_admin_123', 10), 'admin'
  );
  console.log(`Admin created: ${adminEmail} / radical_admin_123`);
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
    images: ['assets/products/chainlink-ring/black/front.webp']
  },
  {
    name: 'Chainlink Ring - Silver',
    slug: 'chainlink-ring-silver',
    category: 'rings',
    price: 841,
    compare_price: 1999,
    description: 'Brushed surgical steel band, structured like a heavy industrial chain link. Architectural strength.',
    material: 'Material : Brass, Silver plated\nColor : Oxydised Silver',
    images: ['assets/products/chainlink-ring/silver/front.webp']
  },
  {
    name: 'Compass Chain - Black',
    slug: 'compass-chain-black',
    category: 'pendants',
    price: 4624,
    compare_price: 11499,
    description: 'Matte black steel chain featuring an engraved compass motif. Worn to navigate your own path.',
    material: 'White rodium plated setting with round  black ceramic stones necklace\nColor : Silver, Black',
    images: ['assets/products/compass-cuff/black/front.webp']
  },
  {
    name: 'Compass Chain - Silver',
    slug: 'compass-chain-silver',
    category: 'pendants',
    price: 4624,
    compare_price: 11499,
    description: 'Brushed steel chain featuring an engraved compass motif. Architectural design for daily wear.',
    material: 'Solitare necklace set in white rodium.\nMaterial : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/products/compass-cuff/silver/front.webp']
  },
  {
    name: 'Crown Tennis Bracelet - Black on Black',
    slug: 'crown-tennis-bracelet-black-on-black',
    category: 'bracelets',
    price: 4624,
    compare_price: 11499,
    description: 'Black-coated surgical steel band set with midnight onyx stones in a crown bezel.',
    material: 'Black rodium plated setting with round  black ceramic stones.\nColor : Black Gold / Gun metal',
    images: ['assets/products/crown-tennis-bracelet/black-on-black/front.webp']
  },
  {
    name: 'Crown Tennis Bracelet - Black on Silver',
    slug: 'crown-tennis-bracelet-black-on-silver',
    category: 'bracelets',
    price: 4624,
    compare_price: 11499,
    description: 'Brushed steel band set with polished black onyx stones in a crown bezel setting.',
    material: 'White rodium plated setting with round  black ceramic stones\nColor : Silver, Black',
    images: ['assets/products/crown-tennis-bracelet/black-on-silver/front.webp']
  },
  {
    name: 'Crown Tennis Bracelet - Diamond on Silver',
    slug: 'crown-tennis-bracelet-diamond-on-silver',
    category: 'bracelets',
    price: 4624,
    compare_price: 11499,
    description: 'Brushed steel band set with brilliant white stones in a crown bezel setting.',
    material: 'Solitare bracelet set in white rodium.\nMaterial : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/products/crown-tennis-bracelet/diamond-on-silver/front.webp']
  },
  {
    name: 'Diamond Vault Ring - Black on Silver',
    slug: 'diamond-vault-ring-black-on-silver',
    category: 'rings',
    price: 1429,
    compare_price: 3499,
    description: 'Architectural steel vault ring featuring inset black onyx stones.',
    material: 'Pave Set CZ Wide Band Ring\nWhite rodium plated ring with round black ceramic stones',
    images: ['assets/products/diamond-vault-ring/black-on-silver/front.webp']
  },
  {
    name: 'Diamond Vault Ring - Diamond on Black',
    slug: 'diamond-vault-ring-diamond-on-black',
    category: 'rings',
    price: 1429,
    compare_price: 3499,
    description: 'Matte black steel vault ring set with brilliant white diamond-cut stones.',
    material: 'Pave Set CZ Wide Band Ring\nMaterial : Brass, Black Gold, Cubic Zirconia\nColor : Black Gold / Gun metal',
    images: ['assets/products/diamond-vault-ring/diamond-on-black/front.webp']
  },
  {
    name: 'Diamond Vault Ring - Diamond on Silver',
    slug: 'diamond-vault-ring-diamond-on-silver',
    category: 'rings',
    price: 1429,
    compare_price: 3499,
    description: 'Brushed steel vault ring set with brilliant white diamond-cut stones.',
    material: 'Pave Set CZ Wide Band Ring\nWhite rodium plated ring with high grade cubic zirco',
    images: ['assets/products/diamond-vault-ring/diamond-on-silver/front.webp']
  },
  {
    name: 'Eclipse Ring - Black',
    slug: 'eclipse-ring-black',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Matte black band with a central offset groove representing a partial eclipse.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/products/eclipse-ring/black/front.webp']
  },
  {
    name: 'Eclipse Ring - Silver',
    slug: 'eclipse-ring-silver',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Polished surgical steel band with a central offset groove representing a partial eclipse.',
    material: 'Material : Brass, Silver plated\nColor : Oxydised Silver',
    images: ['assets/products/eclipse-ring/silver/front.webp']
  },
  {
    name: 'Eclipse Signet Ring - Gold',
    slug: 'eclipse-signet-ring-gold',
    category: 'rings',
    price: 1009,
    compare_price: 2499,
    description: 'Gold-plated steel signet ring with an eclipse carving on the face.',
    material: 'Material : Brass, Gold plated\nColor : Gold',
    images: ['assets/products/eclipse-signet-ring/gold/front.webp']
  },
  {
    name: 'Eclipse Signet Ring - Silver',
    slug: 'eclipse-signet-ring-silver',
    category: 'rings',
    price: 1009,
    compare_price: 2499,
    description: 'Brushed surgical steel signet ring with an eclipse carving on the face.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: ['assets/products/eclipse-signet-ring/silver/front.webp']
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
      'assets/products/eternal-knot-ring/black/front.webp',
      'assets/products/eternal-knot-ring/black/closeup.webp'
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
    images: ['assets/products/eternal-knot-ring/silver/front.webp']
  },
  {
    name: 'Guardian Pendant - Black on Black',
    slug: 'guardian-pendant-black-on-black',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Black-coated shield pendant set with a central black onyx cabochon. Hand-finished.',
    material: 'Material : Brass, Black Gold, Black Enamel\nColor : Black Gold / Gun metal',
    images: ['assets/products/guardian-pendant/black-on-black/front.webp']
  },
  {
    name: 'Guardian Pendant - Black on Silver',
    slug: 'guardian-pendant-black-on-silver',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Steel shield pendant set with a central black onyx cabochon.',
    material: 'Material : Brass, Silver plated, Black Enamel\nColor : Silver',
    images: ['assets/products/guardian-pendant/black-on-silver/front.webp']
  },
  {
    name: 'Guardian Pendant - Diamond on Silver',
    slug: 'guardian-pendant-diamond-on-silver',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Steel shield pendant set with a central brilliant white stone.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/products/guardian-pendant/diamond-on-silver/front.webp']
  },
  {
    name: 'Imperial Eye Ring - Black Gem',
    slug: 'imperial-eye-ring-black-gem',
    category: 'rings',
    price: 946,
    compare_price: 2499,
    description: 'Deeply engraved eye motif signet ring, set with a central black onyx stone.',
    material: 'Material : Brass, Silver plated, Black Onyx\nColor : Silver',
    images: ['assets/products/imperial-eye-ring/black-gem/front.webp']
  },
  {
    name: 'Imperial Eye Ring - Diamond Gem',
    slug: 'imperial-eye-ring-diamond-gem',
    category: 'rings',
    price: 946,
    compare_price: 2499,
    description: 'Deeply engraved eye motif signet ring, set with a central brilliant white gem.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/products/imperial-eye-ring/diamond-gem/front.webp']
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
      'assets/products/infinite-loop-pendant/black/front.webp',
      'assets/products/infinite-loop-pendant/black/closeup.webp'
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
    images: ['assets/products/infinite-loop-pendant/silver/front.webp']
  },
  {
    name: 'Legacy Tag Pendant - Black with Diamond',
    slug: 'legacy-tag-pendant-black-with-diamond',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Matte black military-style dog tag set with a brilliant white stone.',
    material: 'Material : Brass, Black Gold, AAA grade CZ\nColor : Black Gold / Gun metal',
    images: ['assets/products/legacy-tag-pendant/black-with-diamond/front.webp']
  },
  {
    name: 'Legacy Tag Pendant - Silver with Black Gems',
    slug: 'legacy-tag-pendant-silver-with-black-gems',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Brushed steel dog tag pendant set with double black onyx gems.',
    material: 'Material : Brass, Silver plated, Black ceramic stones\nColor : Silver',
    images: ['assets/products/legacy-tag-pendant/silver-with-black-gems/front.webp']
  },
  {
    name: 'Legacy Tag Pendant - Silver with Diamond',
    slug: 'legacy-tag-pendant-silver-with-diamond',
    category: 'pendants',
    price: 1051,
    compare_price: 2499,
    description: 'Brushed steel dog tag pendant set with a central brilliant white gem.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/products/legacy-tag-pendant/silver-with-diamond/front.webp']
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
      'assets/products/monument-pendant/front.webp',
      'assets/products/monument-pendant/closeup.webp'
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
    images: ['assets/products/northstar-pendant/black/front.webp']
  },
  {
    name: 'Northstar Pendant - Silver',
    slug: 'northstar-pendant-silver',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Compass star design in brushed surgical steel, a classic emblem of direction.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/products/northstar-pendant/silver/front.webp']
  },
  {
    name: 'Obsidian Grid Pendant - Gold',
    slug: 'obsidian-grid-pendant-gold',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: '18K Gold plated steel framing a textured black obsidian tile.',
    material: 'Material : Brass, Gold plated, Black Enamel.\nColor : Gold',
    images: ['assets/products/obsidian-grid-pendant/gold/front.webp']
  },
  {
    name: 'Obsidian Grid Pendant - Silver',
    slug: 'obsidian-grid-pendant-silver',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: 'Surgical steel frame holding a textured black obsidian stone tile.',
    material: 'Material : Brass, Silver plated, Black Enamel.\nColor : Silver',
    images: ['assets/products/obsidian-grid-pendant/silver/front.webp']
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
      'assets/products/obsidian-monarch-ring/front.webp',
      'assets/products/obsidian-monarch-ring/closeup.webp'
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
    images: ['assets/products/onyx-core-pendant/black/front.webp']
  },
  {
    name: 'Onyx Core Pendant - Silver',
    slug: 'onyx-core-pendant-silver',
    category: 'pendants',
    price: 1114,
    compare_price: 2499,
    description: 'Brushed surgical steel frame holding a solid black onyx cylinder core.',
    material: 'Material : Brass, Silver plated, Black Enamel.\nColor : Oxydised Silver',
    images: ['assets/products/onyx-core-pendant/silver/front.webp']
  },
  {
    name: 'Path Finder Pendant - Black',
    slug: 'path-finder-pendant-black',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Minimal geometric arrow pendant in a matte black finish.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/products/path-finder-pendant/black/front.webp']
  },
  {
    name: 'Path Finder Pendant - Gold',
    slug: 'path-finder-pendant-gold',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Minimal geometric arrow pendant plated in 18K yellow gold.',
    material: 'Material : Brass, Gold plated\nColor : Gold',
    images: ['assets/products/path-finder-pendant/gold/front.webp']
  },
  {
    name: 'Path Finder Pendant - Silver',
    slug: 'path-finder-pendant-silver',
    category: 'pendants',
    price: 1009,
    compare_price: 2499,
    description: 'Minimal geometric arrow pendant in brushed surgical-grade steel.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: ['assets/products/path-finder-pendant/silver/front.webp']
  },
  {
    name: 'Rune Shield Ring - Black',
    slug: 'rune-shield-ring-black',
    category: 'rings',
    price: 841,
    compare_price: 1999,
    description: 'Matte black steel band carved with ancient protective runes.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/products/rune-shield-ring/black/front.webp']
  },
  {
    name: 'Rune Shield Ring - Silver',
    slug: 'rune-shield-ring-silver',
    category: 'rings',
    price: 841,
    compare_price: 1999,
    description: 'Surgical-grade steel band carved with ancient protective runes.',
    material: 'Material : Brass, Silver plated\nColor : Silver',
    images: ['assets/products/rune-shield-ring/silver/front.webp']
  },
  {
    name: 'Serpent Ascend Ring - Black',
    slug: 'serpent-ascend-ring-black',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Coiled serpent design representing wisdom and renewal in a matte black finish.',
    material: 'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
    images: ['assets/products/serpent-ascend-ring/black/front.webp']
  },
  {
    name: 'Serpent Ascend Ring - Silver',
    slug: 'serpent-ascend-ring-silver',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Coiled serpent design representing wisdom and renewal in brushed steel.',
    material: 'Material : Brass, Silver plated\nColor : Oxydised Silver',
    images: ['assets/products/serpent-ascend-ring/silver/front.webp']
  },
  {
    name: 'Spear Pendant - Black',
    slug: 'spear-pendant-black',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: 'Brutalist spear tip pendant in a matte black surgical steel finish.',
    material: 'Material : Brass, Black Gold, Black Onyx.\nColor : Black Gold / Gun metal',
    images: ['assets/products/spear-pendant/black/front.webp']
  },
  {
    name: 'Spear Pendant - Silver',
    slug: 'spear-pendant-silver',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: 'Brutalist spear tip pendant in hand-finished brushed surgical steel.',
    material: 'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
    images: ['assets/products/spear-pendant/silver/front.webp']
  },
  {
    name: 'Spear Pendant - Silver with Black Stone',
    slug: 'spear-pendant-silver-with-black-stone',
    category: 'pendants',
    price: 1156,
    compare_price: 2999,
    description: 'Brutalist spear tip pendant in silver steel, set with a raw black onyx stone.',
    material: 'Material : Brass, Silver plated, Black Onyx.\nColor : Silver',
    images: ['assets/products/spear-pendant/silver-with-black-stone/front.webp']
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
      'assets/products/tennis-black-stone-chain/front.webp',
      'assets/products/tennis-black-stone-chain/closeup.webp'
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
    images: ['assets/products/world-tree-ring/black/front.webp']
  },
  {
    name: 'World Tree Ring - Silver',
    slug: 'world-tree-ring-silver',
    category: 'rings',
    price: 946,
    compare_price: 1999,
    description: 'Engraved Yggdrasil World Tree band in textured brushed surgical steel.',
    material: 'Material : Brass, Silver plated\nColor : Oxydised Silver',
    images: ['assets/products/world-tree-ring/silver/front.webp']
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
}

if (require.main === module) {
  const dbInstance = require('./database');
  seedDatabase(dbInstance);
  process.exit(0);
}

module.exports = { seedDatabase };
