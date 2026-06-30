const router = require('express').Router();
const db     = require('../db/database');
const crypto = require('crypto');

async function getCartOwner(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const jwt     = require('jsonwebtoken');
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      return { user_id: payload.id, session_id: null };
    } catch {}
  }
  let sessionId = req.headers['x-session-id'];
  if (sessionId) {
    const exists = await db.get('SELECT id FROM sessions WHERE id = ?', [sessionId]);
    if (!exists) {
      try {
        await db.run('INSERT INTO sessions (id) VALUES (?)', [sessionId]);
      } catch (e) {
        sessionId = crypto.randomUUID();
        await db.run('INSERT INTO sessions (id) VALUES (?)', [sessionId]);
      }
    }
  } else {
    sessionId = crypto.randomUUID();
    await db.run('INSERT INTO sessions (id) VALUES (?)', [sessionId]);
  }
  return { user_id: null, session_id: sessionId };
}

// GET /api/cart
router.get('/', async (req, res) => {
  const owner      = await getCartOwner(req);
  const whereSql   = owner.user_id ? 'ci.user_id = ?' : 'ci.session_id = ?';
  const whereParam = owner.user_id ?? owner.session_id;

  const items = await db.all(`
    SELECT ci.id, ci.quantity, ci.added_at,
           p.id AS product_id, p.name, p.slug, p.price, p.images,
           v.id AS variant_id, v.label AS variant_label, v.price_delta, v.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN variants v ON v.id = ci.variant_id
    WHERE ${whereSql}
  `, [whereParam]);

  const formatted = items.map(i => ({
    id:         i.id,
    quantity:   i.quantity,
    added_at:   i.added_at,
    product:    { id: i.product_id, name: i.name, slug: i.slug, price: i.price, images: JSON.parse(i.images) },
    variant:    i.variant_id ? { id: i.variant_id, label: i.variant_label, price_delta: i.price_delta, stock: i.stock } : null,
    unit_price: i.price + (i.price_delta ?? 0),
  }));

  const subtotal = formatted.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  res.json({ items: formatted, subtotal, session_id: owner.session_id });
});

// POST /api/cart — add item
router.post('/', async (req, res) => {
  const { product_id, variant_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id is required' });
  const safeQty = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), 10);

  const product = await db.get('SELECT * FROM products WHERE id = ? AND is_active = 1', [product_id]);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let finalVariantId = variant_id || null;
  const variants = await db.all('SELECT id, stock FROM variants WHERE product_id = ?', [product_id]);

  if (variants.length > 1 && !finalVariantId) {
    return res.status(400).json({ error: 'variant_id is required for this product' });
  }

  if (variants.length === 1 && !finalVariantId) {
    finalVariantId = variants[0].id;
  }

  if (finalVariantId) {
    const variant = await db.get('SELECT * FROM variants WHERE id = ? AND product_id = ?', [finalVariantId, product_id]);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    if (variant.stock < safeQty) return res.status(400).json({ error: 'Not enough stock' });
  }

  const owner      = await getCartOwner(req);
  const whereSql   = owner.user_id ? 'user_id = ?' : 'session_id = ?';
  const whereParam = owner.user_id ?? owner.session_id;

  const existing = await db.get(`
    SELECT id, quantity FROM cart_items
    WHERE ${whereSql} AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
  `, [whereParam, product_id, finalVariantId, finalVariantId]);

  if (existing) {
    await db.run('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [safeQty, existing.id]);
  } else {
    const col = owner.user_id ? 'user_id' : 'session_id';
    await db.run(
      `INSERT INTO cart_items (${col}, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)`,
      [owner.user_id ?? owner.session_id, product_id, finalVariantId, safeQty]
    );
  }

  res.status(201).json({ message: 'Item added to cart', session_id: owner.session_id });
});

// PUT /api/cart/:itemId — update quantity
router.put('/:itemId', async (req, res) => {
  const quantity = parseInt(req.body.quantity, 10);
  if (!quantity || isNaN(quantity) || quantity < 1) return res.status(400).json({ error: 'quantity must be a number >= 1' });
  if (quantity > 10) return res.status(400).json({ error: 'Maximum quantity per item is 10' });

  const owner      = await getCartOwner(req);
  const whereSql   = owner.user_id ? 'user_id = ?' : 'session_id = ?';
  const whereParam = owner.user_id ?? owner.session_id;

  const item = await db.get(
    `SELECT * FROM cart_items WHERE id = ? AND ${whereSql}`,
    [req.params.itemId, whereParam]
  );
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, item.id]);
  res.json({ message: 'Cart updated' });
});

// DELETE /api/cart/:itemId — remove item
router.delete('/:itemId', async (req, res) => {
  const owner      = await getCartOwner(req);
  const whereSql   = owner.user_id ? 'user_id = ?' : 'session_id = ?';
  const whereParam = owner.user_id ?? owner.session_id;

  const item = await db.get(
    `SELECT * FROM cart_items WHERE id = ? AND ${whereSql}`,
    [req.params.itemId, whereParam]
  );
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  await db.run('DELETE FROM cart_items WHERE id = ?', [item.id]);
  res.json({ message: 'Item removed' });
});

// DELETE /api/cart — clear entire cart
router.delete('/', async (req, res) => {
  const owner      = await getCartOwner(req);
  const whereSql   = owner.user_id ? 'user_id = ?' : 'session_id = ?';
  const whereParam = owner.user_id ?? owner.session_id;
  await db.run(`DELETE FROM cart_items WHERE ${whereSql}`, [whereParam]);
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
