require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db     = require('./database');

console.log('Seeding database...');

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
  { name: 'The Steel Ring I',       slug: 'steel-ring-1',       category: 'rings',    price: 1299, description: 'Brushed surgical steel band. Architectural geometry.', images: ['assets/rings_collection.png'] },
  { name: 'The Pendant Bar',        slug: 'pendant-bar',        category: 'pendants', price: 1499, description: 'Hammered rectangular steel pendant on a 60cm chain.',   images: ['assets/pendants_collection.png'] },
  { name: 'The Cuff I',             slug: 'cuff-1',             category: 'bracelets',price: 1699, description: 'Open-end cuff in matte surgical steel.',                images: ['assets/bracelets_collection.png'] },
  { name: 'Founding Edition Ring',  slug: 'founding-ring',      category: 'limited',  price: 2999, description: 'Limited run of 50. Numbered and signed.',               images: ['assets/limited_1_front.png'] },
];

for (const p of products) {
  const exists = db.prepare('SELECT id FROM products WHERE slug = ?').get(p.slug);
  if (!exists) {
    const result = db.prepare(`
      INSERT INTO products (name, slug, description, category, price, images)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(p.name, p.slug, p.description, p.category, p.price, JSON.stringify(p.images));

    // Add size variants for rings
    if (p.category === 'rings') {
      ['Size 8','Size 9','Size 10','Size 11','Size 12'].forEach((label, i) => {
        db.prepare('INSERT INTO variants (product_id, label, sku, stock) VALUES (?, ?, ?, ?)').run(
          result.lastInsertRowid, label, `${p.slug}-${8+i}`, 10
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
