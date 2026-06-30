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

// Import notifyGoogleSheets helper
const { notifyGoogleSheets } = require('./payment');
// Import fulfillOrder helper
const { fulfillOrder } = require('./orders');

// GET /api/admin/orders/fulfillment-status
// Returns orders where status = 'paid' AND waybill IS NULL, ordered by created_at DESC
router.get('/orders/fulfillment-status', async (req, res) => {
  try {
    const orders = await db.all(
      `SELECT id, created_at, total, shipping_address, shipping_status, delhivery_error 
       FROM orders 
       WHERE status = 'paid' AND waybill IS NULL 
       ORDER BY created_at DESC`
    );

    const formattedOrders = orders.map(o => {
      let shippingAddress = {};
      try {
        shippingAddress = JSON.parse(o.shipping_address || '{}');
      } catch (e) {
        console.error(`Failed to parse shipping address for order ${o.id}:`, e);
      }
      return {
        id: o.id,
        created_at: o.created_at,
        total: o.total,
        shipping_address: shippingAddress,
        shipping_status: o.shipping_status,
        delhivery_error: o.delhivery_error
      };
    });

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('[RADICAL] Failed to fetch fulfillment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/orders/:id/retry-fulfillment
// Standalone retry logic that triggers Delhivery fulfillment for a single order on demand
router.post('/orders/:id/retry-fulfillment', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Await standalone execution of fulfillOrder
    const fulfillResult = await fulfillOrder(order);

    // Fetch the updated order state to check results
    const updatedOrder = await db.get('SELECT waybill, shipping_status, delhivery_error FROM orders WHERE id = ?', [orderId]);

    if (updatedOrder.waybill) {
      res.json({
        success: true,
        message: 'Order successfully fulfilled and shipment created',
        waybill: updatedOrder.waybill,
        shipping_status: updatedOrder.shipping_status,
        _debug_raw_delhivery: fulfillResult && fulfillResult.raw ? fulfillResult.raw : null
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: updatedOrder.delhivery_error || 'Delhivery shipment creation failed with unknown error',
        shipping_status: updatedOrder.shipping_status
      });
    }
  } catch (error) {
    console.error('[RADICAL] Failed to retry fulfillment:', error);
    res.status(500).json({ error: 'Internal server error during retry-fulfillment' });
  }
});

// GET /api/admin/orders/sync-status
// Returns orders where sheets_synced_at IS NULL (never successfully synced), ordered by created_at DESC
router.get('/orders/sync-status', async (req, res) => {
  try {
    const orders = await db.all(
      `SELECT id, created_at, status, total, guest_email, shipping_address, sheets_sync_error 
       FROM orders 
       WHERE sheets_synced_at IS NULL 
       ORDER BY created_at DESC`
    );

    const formattedOrders = orders.map(o => {
      let shippingAddress = {};
      try {
        shippingAddress = JSON.parse(o.shipping_address || '{}');
      } catch (e) {
        console.error(`Failed to parse shipping address for order ${o.id}:`, e);
      }
      return {
        id: o.id,
        created_at: o.created_at,
        status: o.status,
        total: o.total,
        guest_email: o.guest_email,
        shipping_address: shippingAddress,
        sheets_sync_error: o.sheets_sync_error
      };
    });

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('[RADICAL] Failed to fetch sheets sync status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/orders/:id/resync-sheet
// Standalone retry logic that triggers Google Sheets sync for a single order on demand
router.post('/orders/:id/resync-sheet', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Await standalone execution of notifyGoogleSheets
    await notifyGoogleSheets(orderId, db);

    // Fetch the updated order state to check sync results
    const updatedOrder = await db.get('SELECT sheets_synced_at, sheets_sync_error FROM orders WHERE id = ?', [orderId]);

    if (updatedOrder.sheets_synced_at) {
      res.json({ 
        success: true, 
        message: 'Order successfully synced to Google Sheets', 
        synced_at: updatedOrder.sheets_synced_at 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: updatedOrder.sheets_sync_error || 'Google Sheets sync failed with unknown error' 
      });
    }
  } catch (error) {
    console.error('[RADICAL] Failed to resync order to Google Sheets:', error);
    res.status(500).json({ error: 'Internal server error during resync' });
  }
});

// GET /api/admin/delhivery/config-check
// Reports whether Delhivery variables are set, masking the API Key
router.get('/delhivery/config-check', async (req, res) => {
  try {
    const apiKey = process.env.DELHIVERY_API_KEY;
    res.json({
      DELHIVERY_API_KEY: {
        is_set: typeof apiKey === 'string' && apiKey.length > 0,
        length: typeof apiKey === 'string' ? apiKey.length : 0
      },
      DELHIVERY_ENV: process.env.DELHIVERY_ENV || null,
      DELHIVERY_SELLER_NAME: process.env.DELHIVERY_SELLER_NAME || null,
      DELHIVERY_SELLER_ADDRESS: process.env.DELHIVERY_SELLER_ADDRESS || null,
      DELHIVERY_SELLER_PIN: process.env.DELHIVERY_SELLER_PIN || null,
      DELHIVERY_SELLER_CITY: process.env.DELHIVERY_SELLER_CITY || null,
      DELHIVERY_SELLER_STATE: process.env.DELHIVERY_SELLER_STATE || null,
      DELHIVERY_PICKUP_LOCATION_NAME: process.env.DELHIVERY_PICKUP_LOCATION_NAME || null
    });
  } catch (error) {
    console.error('[RADICAL] Failed to check Delhivery config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
