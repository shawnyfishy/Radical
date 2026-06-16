const router = require('express').Router();
const db     = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// POST /api/orders — place an order from current cart
router.post('/', (req, res) => {
  const { shipping_address, guest_email, notes } = req.body;
  if (!shipping_address) return res.status(400).json({ error: 'shipping_address is required' });

  // Resolve user
  let userId = null;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      userId = jwt.verify(header.slice(7), process.env.JWT_SECRET).id;
    } catch {}
  }

  const sessionId = req.headers['x-session-id'];
  const cartWhere   = userId ? 'ci.user_id = ?' : 'ci.session_id = ?';
  const deleteWhere = userId ? 'user_id = ?' : 'session_id = ?';
  const cartParam   = userId ?? sessionId;

  if (!userId && !sessionId) return res.status(400).json({ error: 'No cart session found' });

  const items = db.prepare(`
    SELECT ci.id AS cart_item_id, ci.quantity,
           p.id AS product_id, p.name, p.price, p.is_active,
           v.id AS variant_id, v.label AS variant_label, v.price_delta, v.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN variants v ON v.id = ci.variant_id
    WHERE ${cartWhere}
  `).all(cartParam);

  if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

  // Validate stock
  for (const item of items) {
    if (!item.is_active) return res.status(400).json({ error: `${item.name} is no longer available` });
    if (item.variant_id && item.stock < item.quantity) {
      return res.status(400).json({ error: `Not enough stock for ${item.name} (${item.variant_label})` });
    }
  }

  const subtotal     = items.reduce((s, i) => s + (i.price + (i.price_delta ?? 0)) * i.quantity, 0);
  const shippingCost = subtotal >= 999 ? 0 : 99;  // free shipping above ₹999
  const total        = subtotal + shippingCost;

  // Create order in a transaction
  const createOrder = db.transaction(() => {
    const order = db.prepare(`
      INSERT INTO orders (user_id, guest_email, subtotal, shipping_cost, total, shipping_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, guest_email ?? null, subtotal, shippingCost, total, JSON.stringify(shipping_address), notes ?? null);

    const orderId = order.lastInsertRowid;

    for (const item of items) {
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_label, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, item.product_id, item.variant_id ?? null, item.name, item.variant_label ?? null, item.quantity, item.price + (item.price_delta ?? 0));

      // Decrement stock
      if (item.variant_id) {
        db.prepare('UPDATE variants SET stock = stock - ? WHERE id = ?').run(item.quantity, item.variant_id);
      }
    }

    // Clear cart
    db.prepare(`DELETE FROM cart_items WHERE ${deleteWhere}`).run(cartParam);

    return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  });

  const newOrder = createOrder();
  newOrder.shipping_address = JSON.parse(newOrder.shipping_address);
  newOrder.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(newOrder.id);

  res.status(201).json({ order: newOrder });
});

// GET /api/orders — current user's orders
router.get('/', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const withItems = orders.map(o => ({
    ...o,
    shipping_address: JSON.parse(o.shipping_address),
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
  }));
  res.json({ orders: withItems });
});

// GET /api/orders/:id — single order
router.get('/:id', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.shipping_address = JSON.parse(order.shipping_address);
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ order });
});

// PATCH /api/orders/:id/status — admin updates order status
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ message: 'Status updated', status });
});

module.exports = router;
