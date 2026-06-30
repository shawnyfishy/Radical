const router = require('express').Router();
const db     = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

// GET /api/products
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM products WHERE is_active = 1';
  const params = [];

  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (search)   { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';

  const products = await db.all(sql, params);

  const withVariants = await Promise.all(products.map(async p => ({
    ...p,
    images:   JSON.parse(p.images),
    variants: await db.all('SELECT * FROM variants WHERE product_id = ?', [p.id]),
  })));

  res.json({ products: withVariants });
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const product = await db.get('SELECT * FROM products WHERE slug = ? AND is_active = 1', [req.params.slug]);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  product.images   = JSON.parse(product.images);
  product.variants = await db.all('SELECT * FROM variants WHERE product_id = ?', [product.id]);
  res.json({ product });
});

// POST /api/products — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { name, slug, description, category, price, compare_price, images, material, weight_grams } = req.body;
  if (!name || !slug || !category || !price) {
    return res.status(400).json({ error: 'name, slug, category and price are required' });
  }

  const result = await db.run(`
    INSERT INTO products (name, slug, description, category, price, compare_price, images, material, weight_grams)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [name, slug, description, category, price, compare_price ?? null, JSON.stringify(images ?? []), material ?? null, weight_grams ?? null]);

  const product = await db.get('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
  product.images = JSON.parse(product.images);
  res.status(201).json({ product });
});

// PUT /api/products/:id — admin only
router.put('/:id', requireAdmin, async (req, res) => {
  const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
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
  await db.run(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);

  const updated = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  updated.images   = JSON.parse(updated.images);
  updated.variants = await db.all('SELECT * FROM variants WHERE product_id = ?', [updated.id]);
  res.json({ product: updated });
});

// DELETE /api/products/:id — soft delete, admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  const product = await db.get('SELECT id FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await db.run('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Product deactivated' });
});

// POST /api/products/:id/variants — admin only
router.post('/:id/variants', requireAdmin, async (req, res) => {
  const { label, sku, stock, price_delta } = req.body;
  if (!label || !sku) return res.status(400).json({ error: 'label and sku are required' });

  // Pre-check for duplicate label for this product
  const existing = await db.get(
    'SELECT id FROM variants WHERE product_id = ? AND label = ?',
    [req.params.id, label]
  );
  if (existing) {
    return res.status(409).json({ error: 'A variant with this label already exists for this product' });
  }

  const result = await db.run(
    'INSERT INTO variants (product_id, label, sku, stock, price_delta) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, label, sku, stock ?? 0, price_delta ?? 0]
  );

  const variant = await db.get('SELECT * FROM variants WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ variant });
});

// PUT /api/products/variants/:variantId — admin only
router.put('/variants/:variantId', requireAdmin, async (req, res) => {
  const { stock, price_delta, label } = req.body;
  const v = await db.get('SELECT * FROM variants WHERE id = ?', [req.params.variantId]);
  if (!v) return res.status(404).json({ error: 'Variant not found' });

  await db.run(
    'UPDATE variants SET stock = COALESCE(?, stock), price_delta = COALESCE(?, price_delta), label = COALESCE(?, label) WHERE id = ?',
    [stock ?? null, price_delta ?? null, label ?? null, req.params.variantId]
  );

  const updated = await db.get('SELECT * FROM variants WHERE id = ?', [req.params.variantId]);
  res.json({ variant: updated });
});

module.exports = router;
