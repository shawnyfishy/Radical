const router = require('express').Router();
const db     = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

// GET /api/products — list all active products (public)
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM products WHERE is_active = 1';
  const params = [];

  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (search)   { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' ORDER BY created_at DESC';
  const products = db.prepare(sql).all(...params);

  // Attach variants to each product
  const withVariants = products.map(p => ({
    ...p,
    images:   JSON.parse(p.images),
    variants: db.prepare('SELECT * FROM variants WHERE product_id = ?').all(p.id),
  }));

  res.json({ products: withVariants });
});

// GET /api/products/:slug — single product (public)
router.get('/:slug', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  product.images   = JSON.parse(product.images);
  product.variants = db.prepare('SELECT * FROM variants WHERE product_id = ?').all(product.id);

  res.json({ product });
});

// POST /api/products — create (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { name, slug, description, category, price, compare_price, images, material, weight_grams } = req.body;
  if (!name || !slug || !category || !price) {
    return res.status(400).json({ error: 'name, slug, category and price are required' });
  }

  const result = db.prepare(`
    INSERT INTO products (name, slug, description, category, price, compare_price, images, material, weight_grams)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, description, category, price, compare_price ?? null, JSON.stringify(images ?? []), material ?? null, weight_grams ?? null);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  product.images = JSON.parse(product.images);
  res.status(201).json({ product });
});

// PUT /api/products/:id — update (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const fields = ['name','slug','description','category','price','compare_price','images','material','weight_grams','is_active'];
  const updates = [];
  const params  = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(f === 'images' ? JSON.stringify(req.body[f]) : req.body[f]);
    }
  });

  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  updated.images   = JSON.parse(updated.images);
  updated.variants = db.prepare('SELECT * FROM variants WHERE product_id = ?').all(updated.id);
  res.json({ product: updated });
});

// DELETE /api/products/:id — soft delete (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deactivated' });
});

// POST /api/products/:id/variants — add variant (admin only)
router.post('/:id/variants', requireAdmin, (req, res) => {
  const { label, sku, stock, price_delta } = req.body;
  if (!label || !sku) return res.status(400).json({ error: 'label and sku are required' });

  const result = db.prepare(
    'INSERT INTO variants (product_id, label, sku, stock, price_delta) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, label, sku, stock ?? 0, price_delta ?? 0);

  const variant = db.prepare('SELECT * FROM variants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ variant });
});

// PUT /api/products/variants/:variantId — update variant stock/price (admin only)
router.put('/variants/:variantId', requireAdmin, (req, res) => {
  const { stock, price_delta, label } = req.body;
  const v = db.prepare('SELECT * FROM variants WHERE id = ?').get(req.params.variantId);
  if (!v) return res.status(404).json({ error: 'Variant not found' });

  db.prepare('UPDATE variants SET stock = COALESCE(?, stock), price_delta = COALESCE(?, price_delta), label = COALESCE(?, label) WHERE id = ?')
    .run(stock ?? null, price_delta ?? null, label ?? null, req.params.variantId);

  const updated = db.prepare('SELECT * FROM variants WHERE id = ?').get(req.params.variantId);
  res.json({ variant: updated });
});

module.exports = router;
