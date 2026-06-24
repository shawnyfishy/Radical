const router = require('express').Router();
const db     = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

// All routes in this file require admin
router.use(requireAdmin);

// GET /api/admin/dashboard — summary stats
router.get('/dashboard', (req, res) => {
  const stats = {
    total_orders:    db.prepare("SELECT COUNT(*) AS n FROM orders").get().n,
    pending_orders:  db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'").get().n,
    total_products:  db.prepare("SELECT COUNT(*) AS n FROM products WHERE is_active = 1").get().n,
    total_customers: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'").get().n,
    revenue:         db.prepare("SELECT COALESCE(SUM(total), 0) AS n FROM orders WHERE status != 'cancelled'").get().n,
    low_stock:       db.prepare("SELECT COUNT(*) AS n FROM variants WHERE stock <= 5").get().n,
  };
  res.json({ stats });
});

// GET /api/admin/orders — all orders with filters
router.get('/orders', (req, res) => {
  const { status, page = 1 } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  let sql = 'SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o LEFT JOIN users u ON u.id = o.user_id';
  const params = [];

  if (status) { sql += ' WHERE o.status = ?'; params.push(status); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const orders = db.prepare(sql).all(...params);
  const total  = db.prepare(`SELECT COUNT(*) AS n FROM orders${status ? ' WHERE status = ?' : ''}`).get(...(status ? [status] : [])).n;

  res.json({ orders: orders.map(o => ({ ...o, shipping_address: JSON.parse(o.shipping_address) })), total, page: Number(page), limit: Number(limit) });
});

// GET /api/admin/products — all products including inactive
router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  const withVariants = products.map(p => ({
    ...p,
    images:   JSON.parse(p.images),
    variants: db.prepare('SELECT * FROM variants WHERE product_id = ?').all(p.id),
  }));
  res.json({ products: withVariants });
});

// GET /api/admin/customers — all customers
router.get('/customers', (req, res) => {
  const customers = db.prepare("SELECT id, name, email, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC").all();
  res.json({ customers });
});

// GET /api/admin/inventory — low/out-of-stock variants
router.get('/inventory', (req, res) => {
  const variants = db.prepare(`
    SELECT v.*, p.name AS product_name, p.slug
    FROM variants v
    JOIN products p ON p.id = v.product_id
    WHERE p.is_active = 1
    ORDER BY v.stock ASC
  `).all();
  res.json({ variants });
});

module.exports = router;
