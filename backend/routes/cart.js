const router = require('express').Router();
const db     = require('../db/database');
const crypto = require('crypto');

// Resolve cart owner: logged-in user OR guest session
function getCartOwner(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const jwt     = require('jsonwebtoken');
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      return { user_id: payload.id, session_id: null };
    } catch {}
  }
  // Guest — session_id comes from header X-Session-ID
  let sessionId = req.headers['x-session-id'];
  if (sessionId) {
    const exists = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
    if (!exists) {
      try {
        db.prepare('INSERT INTO sessions (id) VALUES (?)').run(sessionId);
      } catch (e) {
        sessionId = crypto.randomUUID();
        db.prepare('INSERT INTO sessions (id) VALUES (?)').run(sessionId);
      }
    }
  } else {
    sessionId = crypto.randomUUID();
    db.prepare('INSERT INTO sessions (id) VALUES (?)').run(sessionId);
  }
  return { user_id: null, session_id: sessionId };
}

function cartWhere(owner) {
  return owner.user_id
    ? { sql: 'user_id = ?',    params: [owner.user_id] }
    : { sql: 'session_id = ?', params: [owner.session_id] };
}

// GET /api/cart
router.get('/', (req, res) => {
  const owner = getCartOwner(req);
  const where = cartWhere(owner);

  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.added_at,
           p.id AS product_id, p.name, p.slug, p.price, p.images,
           v.id AS variant_id, v.label AS variant_label, v.price_delta, v.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN variants v ON v.id = ci.variant_id
    WHERE ci.${where.sql}
  `).all(...where.params);

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
router.post('/', (req, res) => {
  const { product_id, variant_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id is required' });
  const safeQty = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), 10);

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (variant_id) {
    const variant = db.prepare('SELECT * FROM variants WHERE id = ? AND product_id = ?').get(variant_id, product_id);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    if (variant.stock < safeQty) return res.status(400).json({ error: 'Not enough stock' });
  }

  const owner = getCartOwner(req);
  const where = cartWhere(owner);

  const existing = db.prepare(`
    SELECT id, quantity FROM cart_items
    WHERE ${where.sql} AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
  `).get(...where.params, product_id, variant_id ?? null, variant_id ?? null);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(safeQty, existing.id);
  } else {
    const col = owner.user_id ? 'user_id' : 'session_id';
    db.prepare(`INSERT INTO cart_items (${col}, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)`)
      .run(owner.user_id ?? owner.session_id, product_id, variant_id ?? null, safeQty);
  }

  res.status(201).json({ message: 'Item added to cart', session_id: owner.session_id });
});

// PUT /api/cart/:itemId — update quantity
router.put('/:itemId', (req, res) => {
  const quantity = parseInt(req.body.quantity, 10);
  if (!quantity || isNaN(quantity) || quantity < 1) return res.status(400).json({ error: 'quantity must be a number >= 1' });
  if (quantity > 10) return res.status(400).json({ error: 'Maximum quantity per item is 10' });

  const owner = getCartOwner(req);
  const where = cartWhere(owner);

  const item = db.prepare(`SELECT * FROM cart_items WHERE id = ? AND ${where.sql}`).get(req.params.itemId, ...where.params);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, item.id);
  res.json({ message: 'Cart updated' });
});

// DELETE /api/cart/:itemId — remove item
router.delete('/:itemId', (req, res) => {
  const owner = getCartOwner(req);
  const where = cartWhere(owner);

  const item = db.prepare(`SELECT * FROM cart_items WHERE id = ? AND ${where.sql}`).get(req.params.itemId, ...where.params);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  res.json({ message: 'Item removed' });
});

// DELETE /api/cart — clear entire cart
router.delete('/', (req, res) => {
  const owner = getCartOwner(req);
  const where = cartWhere(owner);
  db.prepare(`DELETE FROM cart_items WHERE ${where.sql}`).run(...where.params);
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
