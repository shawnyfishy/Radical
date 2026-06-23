const router = require('express').Router();
const db     = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { generatePaymentURL } = require('../utils/payment');

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// POST /api/orders — place an order from current cart
router.post('/', async (req, res) => {
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

  // ── Self-Cleaning Stock Reclaiming ─────────────────────────────────────
  // 1. Reclaim stock from ANY pending orders older than 20 minutes across the system
  try {
    const expiredOrders = db.prepare(`
      SELECT id FROM orders 
      WHERE status = 'pending' 
        AND created_at < datetime('now', '-20 minutes')
    `).all();

    for (const exp of expiredOrders) {
      db.transaction(() => {
        db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(exp.id);
        const expItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(exp.id);
        for (const item of expItems) {
          if (item.variant_id) {
            db.prepare('UPDATE variants SET stock = stock + ? WHERE id = ?').run(item.quantity, item.variant_id);
          }
        }
      })();
    }
  } catch (e) {
    console.error('[RADICAL] Failed to clean up expired pending orders:', e);
  }

  // 2. Cancel previous pending orders for the SAME user or session to free their own stock
  try {
    const userPendingOrders = userId 
      ? db.prepare("SELECT id FROM orders WHERE user_id = ? AND status = 'pending'").all(userId)
      : db.prepare("SELECT id FROM orders WHERE session_id = ? AND status = 'pending'").all(cartParam);

    for (const po of userPendingOrders) {
      db.transaction(() => {
        db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(po.id);
        const poItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(po.id);
        for (const item of poItems) {
          if (item.variant_id) {
            db.prepare('UPDATE variants SET stock = stock + ? WHERE id = ?').run(item.quantity, item.variant_id);
          }
        }
      })();
    }
  } catch (e) {
    console.error('[RADICAL] Failed to clean up previous user pending orders:', e);
  }

  // Create order in a transaction (does not clear cart, but reserves stock)
  const createOrder = db.transaction(() => {
    const order = db.prepare(`
      INSERT INTO orders (user_id, guest_email, session_id, subtotal, shipping_cost, total, shipping_address, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(userId, guest_email ?? null, userId ? null : cartParam, subtotal, shippingCost, total, JSON.stringify(shipping_address), notes ?? null);

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

    return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  });

  const newOrder = createOrder();
  
  // Resolve customer email, name, and phone for the payment gateway
  let customerEmail = guest_email || null;
  let customerName = 'Customer';
  let customerPhone = '919999999999';

  try {
    const parsedAddr = typeof shipping_address === 'string' ? JSON.parse(shipping_address) : shipping_address;
    if (parsedAddr) {
      if (parsedAddr.name) customerName = parsedAddr.name;
      if (parsedAddr.phone) customerPhone = parsedAddr.phone;
    }
  } catch (e) {
    console.error('[RADICAL] Failed to parse shipping address for payment:', e);
  }

  if (userId) {
    try {
      const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
      if (user) {
        if (!customerEmail) customerEmail = user.email;
        if (customerName === 'Customer' && user.name) customerName = user.name;
      }
    } catch {}
  }

  // Generate ICICI Bank redirect link
  try {
    const paymentUrl = await generatePaymentURL(
      `RAD${newOrder.id}_${Date.now()}`, 
      newOrder.total, 
      req.headers.host, 
      customerEmail,
      customerName,
      customerPhone
    );
    res.status(201).json({ order: newOrder, paymentUrl });
  } catch (err) {
    console.error('[RADICAL] Payment initiation failed:', err);
    res.status(500).json({ error: 'Failed to initiate secure checkout session: ' + err.message });
  }
});

// ── Payment Callback (ICICI Return URL) ──────────────────────────────────
router.all('/payment/callback', async (req, res) => {
  const params = { ...req.query, ...req.body };
  console.log('[RADICAL] Payment callback received:', params);

  const referenceNo = params['ReferenceNo'] || params['Reference No'] || params['merchantTxnNo'] || '';
  const responseCode = params['Response_Code'] || params['Response Code'] || params['responseCode'] || '';
  const txnStatus = params['txnStatus'] || '';
  
  if (!referenceNo) {
    return res.status(400).send('Invalid payment callback: ReferenceNo is missing.');
  }

  // Parse order ID from ReferenceNo (e.g., "RAD15_17822..." -> 15, "15" -> 15)
  const orderIdMatch = referenceNo.match(/^(?:RAD|TEST)?(\d+)/);
  if (!orderIdMatch) {
    return res.status(400).send('Invalid payment callback: Invalid ReferenceNo format.');
  }
  const orderDbId = parseInt(orderIdMatch[1], 10);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderDbId);
  if (!order) {
    return res.status(404).send('Order not found.');
  }

  // If already confirmed, redirect directly to success screen
  if (order.status === 'confirmed') {
    return res.redirect(`/checkout.html?status=success&orderId=RAD${order.id}`);
  }

  const isSuccess = (
    responseCode === 'E000' || 
    responseCode === '000' || 
    responseCode === 'R1000' || 
    txnStatus.toUpperCase() === 'SUC' || 
    txnStatus.toUpperCase() === 'SUCCESS' ||
    params['status'] === 'success'
  );

  if (isSuccess) {
    try {
      // 1. Update order status to confirmed
      db.prepare("UPDATE orders SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?").run(order.id);
      
      // Get the updated order state
      const confirmedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
      
      // 2. Clear customer cart
      const deleteWhere = confirmedOrder.user_id ? 'user_id = ?' : 'session_id = ?';
      const deleteParam = confirmedOrder.user_id ?? confirmedOrder.session_id;
      db.prepare(`DELETE FROM cart_items WHERE ${deleteWhere}`).run(deleteParam);

      // 3. Send order details to the Google Sheet delivery team webhook
      await submitToGoogleSheets(confirmedOrder);

      return res.redirect(`/checkout.html?status=success&orderId=RAD${order.id}`);
    } catch (e) {
      console.error('[RADICAL] Failed to finalize successful order:', e);
      return res.redirect(`/checkout.html?status=failed&error=Failed to process payment confirmation: ${e.message}`);
    }
  } else {
    // Payment failed or was cancelled
    try {
      // 1. Update order status to cancelled
      db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(order.id);
      
      // 2. Restore stock levels
      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      for (const item of orderItems) {
        if (item.variant_id) {
          db.prepare('UPDATE variants SET stock = stock + ? WHERE id = ?').run(item.quantity, item.variant_id);
        }
      }
      
      const errorMsg = params['Reason'] || 'Payment failed or was cancelled by the customer.';
      return res.redirect(`/checkout.html?status=failed&error=${encodeURIComponent(errorMsg)}`);
    } catch (e) {
      console.error('[RADICAL] Failed to handle payment cancellation:', e);
      return res.redirect(`/checkout.html?status=failed&error=Payment processing error: ${e.message}`);
    }
  }
});

// ── Payment Simulation Endpoint ──────────────────────────────────────────
// Simulates the ICICI bank redirection callback
router.get('/payment/simulate', (req, res) => {
  const { orderId, status } = req.query;
  if (!orderId || !status) {
    return res.status(400).send('Missing query parameters: orderId and status are required.');
  }

  const responseCode = status === 'success' ? 'E000' : 'E999';
  const reason = status === 'success' ? '' : 'Simulated transaction failure.';

  const params = new URLSearchParams();
  params.append('ReferenceNo', orderId.startsWith('RAD') ? orderId : `RAD${orderId}`);
  params.append('Response_Code', responseCode);
  if (reason) params.append('Reason', reason);

  res.redirect(`/api/orders/payment/callback?${params.toString()}`);
});

// Helper function to write order to Google Sheets
async function submitToGoogleSheets(order) {
  const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby-7UlBa-iX7VVi0NcOmvisUOjKscCZX7Ai7HUpI9SusSIt2RG258ln0CPHBllUCFfTQA/exec';
  
  const shippingAddress = JSON.parse(order.shipping_address);
  const nameParts = (shippingAddress.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const cityStateCountry = `${shippingAddress.city}, ${shippingAddress.state}, India`;
  const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const itemsSummary = items.map(i => 
    `${i.product_name}${i.variant_label ? ' (' + i.variant_label + ')' : ''} x${i.quantity}`
  ).join('; ');

  const payload = {
    first_name:         firstName,
    last_name:          lastName,
    email:              order.guest_email || '',
    phone:              shippingAddress.phone || '',
    address_line1:      shippingAddress.line1 || '',
    address_line2:      shippingAddress.line2 || '',
    city_state_country: cityStateCountry,
    zipcode:            shippingAddress.postal_code || '',
    product_name:       itemsSummary,
    total_amount:       `₹${order.total.toLocaleString('en-IN')}`,
    date_and_time:      formattedDate,
    order_id:           `RAD${order.id}`,
    payment_method:     'Online Payment',
  };

  try {
    // This is a server-to-server request (Node fetch), so CORS does not apply here at all.
    const formBody = Object.entries(payload)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const resp = await fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      body: formBody,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    // Apps Script returns HTTP 200 even when the script itself throws —
    // the failure shows up as an HTML error page in the body, not the status code.
    const bodyText = await resp.text();
    const looksLikeScriptError = /<title>Error<\/title>|errorMessage/i.test(bodyText);
    if (!resp.ok || looksLikeScriptError) {
      throw new Error(`Apps Script returned an error page (HTTP ${resp.status}): ${bodyText.slice(0, 300)}`);
    }

    console.log(`[RADICAL] Google Sheet webhook succeeded for Order RAD${order.id}:`, bodyText.slice(0, 200));
  } catch (err) {
    console.error(`[RADICAL] Google Sheet webhook failed for Order RAD${order.id}:`, err);
  }
}

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
