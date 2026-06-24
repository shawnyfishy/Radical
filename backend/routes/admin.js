const router = require('express').Router();
const db     = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  const [orders, pending, products, customers, revenue, lowStock] = await Promise.all([
    db.get("SELECT COUNT(*) AS n FROM orders"),
    db.get("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'"),
    db.get("SELECT COUNT(*) AS n FROM products WHERE is_active = 1"),
    db.get("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'"),
    db.get("SELECT COALESCE(SUM(total), 0) AS n FROM orders WHERE status != 'cancelled'"),
    db.get("SELECT COUNT(*) AS n FROM variants WHERE stock <= 5"),
  ]);
  res.json({ stats: {
    total_orders:    orders.n,
    pending_orders:  pending.n,
    total_products:  products.n,
    total_customers: customers.n,
    revenue:         revenue.n,
    low_stock:       lowStock.n,
  }});
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;

  let sql = 'SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o LEFT JOIN users u ON u.id = o.user_id';
  const params = [];
  if (status) { sql += ' WHERE o.status = ?'; params.push(status); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [orders, countRow] = await Promise.all([
    db.all(sql, params),
    db.get(`SELECT COUNT(*) AS n FROM orders${status ? ' WHERE status = ?' : ''}`, status ? [status] : []),
  ]);

  res.json({
    orders: orders.map(o => ({ ...o, shipping_address: JSON.parse(o.shipping_address) })),
    total: countRow.n,
    page,
    limit,
  });
});

// GET /api/admin/products
router.get('/products', async (req, res) => {
  const products = await db.all('SELECT * FROM products ORDER BY created_at DESC');
  const withVariants = await Promise.all(products.map(async p => ({
    ...p,
    images:   JSON.parse(p.images),
    variants: await db.all('SELECT * FROM variants WHERE product_id = ?', [p.id]),
  })));
  res.json({ products: withVariants });
});

// GET /api/admin/customers
router.get('/customers', async (req, res) => {
  const customers = await db.all("SELECT id, name, email, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC");
  res.json({ customers });
});

// GET /api/admin/inventory
router.get('/inventory', async (req, res) => {
  const variants = await db.all(`
    SELECT v.*, p.name AS product_name, p.slug
    FROM variants v
    JOIN products p ON p.id = v.product_id
    WHERE p.is_active = 1
    ORDER BY v.stock ASC
  `);
  res.json({ variants });
});

module.exports = router;
