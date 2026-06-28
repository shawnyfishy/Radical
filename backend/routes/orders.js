const router = require('express').Router();
const db     = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');


const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const VALID_STATUSES = ['pending', 'paid', 'payment_failed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

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

  const items = await db.all(`
    SELECT ci.id AS cart_item_id, ci.quantity,
           p.id AS product_id, p.name, p.price, p.is_active,
           v.id AS variant_id, v.label AS variant_label, v.price_delta, v.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN variants v ON v.id = ci.variant_id
    WHERE ${cartWhere}
  `, [cartParam]);

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
    const expiredOrders = await db.all(`
      SELECT id FROM orders 
      WHERE status = 'pending' 
        AND created_at < datetime('now', '-20 minutes')
    `);

    for (const exp of expiredOrders) {
      const expItems = await db.all("SELECT * FROM order_items WHERE order_id = ?", [exp.id]);
      const statements = [
        { sql: "UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", args: [exp.id] }
      ];
      for (const item of expItems) {
        if (item.variant_id) {
          statements.push({
            sql: 'UPDATE variants SET stock = stock + ? WHERE id = ?',
            args: [item.quantity, item.variant_id]
          });
        }
      }
      await db.transaction(statements);
    }
  } catch (e) {
    console.error('[RADICAL] Failed to clean up expired pending orders:', e);
  }

  // 2. Cancel previous pending orders for the SAME user or session to free their own stock
  try {
    const userPendingOrders = userId 
      ? await db.all("SELECT id FROM orders WHERE user_id = ? AND status = 'pending'", [userId])
      : await db.all("SELECT id FROM orders WHERE session_id = ? AND status = 'pending'", [cartParam]);

    for (const po of userPendingOrders) {
      const poItems = await db.all("SELECT * FROM order_items WHERE order_id = ?", [po.id]);
      const statements = [
        { sql: "UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", args: [po.id] }
      ];
      for (const item of poItems) {
        if (item.variant_id) {
          statements.push({
            sql: 'UPDATE variants SET stock = stock + ? WHERE id = ?',
            args: [item.quantity, item.variant_id]
          });
        }
      }
      await db.transaction(statements);
    }
  } catch (e) {
    console.error('[RADICAL] Failed to clean up previous user pending orders:', e);
  }

  // Create order transaction (Insert order record first, then batch order items + stock decrements)
  let orderId;
  try {
    const orderResult = await db.run(`
      INSERT INTO orders (user_id, guest_email, session_id, subtotal, shipping_cost, total, shipping_address, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [userId, guest_email ?? null, userId ? null : cartParam, subtotal, shippingCost, total, JSON.stringify(shipping_address), notes ?? null]);

    orderId = orderResult.lastInsertRowid;

    const batchStatements = [];
    for (const item of items) {
      batchStatements.push({
        sql: `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_label, quantity, unit_price)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [orderId, item.product_id, item.variant_id ?? null, item.name, item.variant_label ?? null, item.quantity, item.price + (item.price_delta ?? 0)]
      });

      if (item.variant_id) {
        batchStatements.push({
          sql: 'UPDATE variants SET stock = stock - ? WHERE id = ?',
          args: [item.quantity, item.variant_id]
        });
      }
    }

    if (batchStatements.length > 0) {
      await db.transaction(batchStatements);
    }
  } catch (e) {
    console.error('[RADICAL] Order creation transaction failed:', e);
    return res.status(500).json({ error: 'Failed to create order.' });
  }

  const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  
  // Create Razorpay order
  try {
    const parsedAddr = typeof shipping_address === 'string' ? JSON.parse(shipping_address) : shipping_address;
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // Razorpay uses paise
      currency: 'INR',
      receipt: String(newOrder.id).substring(0, 40),
      notes: {
        radical_order_id: String(newOrder.id),
        customer_name: parsedAddr?.name || 'Customer',
        customer_email: guest_email || '',
      },
    });

    // Store the Razorpay order ID in the database
    await db.run('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [razorpayOrder.id, newOrder.id]);

    return res.status(201).json({
      success: true,
      localOrderId: newOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[RADICAL] Razorpay order creation failed:', err);
    return res.status(502).json({ 
      error: 'Could not create payment order. Please try again.' 
    });
  }
});

// Previous payment callback route removed. 
// TODO: Add new payment gateway webhook/callback route here after integration.

// Helper function to write order to Google Sheets
async function submitToGoogleSheets(order) {
  const SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycby-7UlBa-iX7VVi0NcOmvisUOjKscCZX7Ai7HUpI9SusSIt2RG258ln0CPHBllUCFfTQA/exec';
  
  const shippingAddress = JSON.parse(order.shipping_address);
  const nameParts = (shippingAddress.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const cityStateCountry = `${shippingAddress.city}, ${shippingAddress.state}, India`;
  const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
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
router.get('/', requireAuth, async (req, res) => {
  const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  const withItems = await Promise.all(orders.map(async o => ({
    ...o,
    shipping_address: JSON.parse(o.shipping_address),
    items: await db.all('SELECT * FROM order_items WHERE order_id = ?', [o.id]),
  })));
  res.json({ orders: withItems });
});

// GET /api/orders/:id — single order
router.get('/:id', requireAuth, async (req, res) => {
  const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.shipping_address = JSON.parse(order.shipping_address);
  order.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  res.json({ order });
});

// PATCH /api/orders/:id/status — admin updates order status
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const order = await db.get('SELECT id FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  await db.run("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, req.params.id]);
  res.json({ message: 'Status updated', status });
});

// Automatic Delhivery shipment creation post-payment
async function fulfillOrder(orderRecord) {
  try {
    const shippingAddress = JSON.parse(orderRecord.shipping_address);
    
    // Retrieve items from order_items to build product description and weight/quantity
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderRecord.id]);
    const products_desc = items.map(i => `${i.product_name}${i.variant_label ? ' (' + i.variant_label + ')' : ''}`).join(', ').substring(0, 100);
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const shipmentPayload = {
      order: `RAD${orderRecord.id}`,
      name: shippingAddress.name || 'Customer',
      add: `${shippingAddress.line1}${shippingAddress.line2 ? ', ' + shippingAddress.line2 : ''}`,
      pin: shippingAddress.postal_code,
      city: shippingAddress.city,
      state: shippingAddress.state,
      phone: shippingAddress.phone || '919999999999',
      payment_mode: 'Prepaid', // Online payment callback is always Prepaid
      order_date: new Date().toISOString(),
      total_amount: orderRecord.total,
      cod_amount: 0,
      weight: 0.3, // rings/pendants approx 0.2-0.3 kg with packaging
      seller_name: 'RADICAL',
      seller_add: 'City Centre, unit no. 320, 3rd Floor, Sector-12, Sai Road City Centre, Dwarka, New Delhi',
      seller_pin: '110078',
      seller_city: 'New Delhi',
      seller_state: 'Delhi',
      products_desc: products_desc || 'Men\'s Jewellery - RADICAL',
      quantity: quantity || 1,
      pickup_location_name: 'RADICAL Inc'
    };

    const delhivery = require('../utils/delhivery');
    console.log(`[Delhivery] Triggering automatic shipment creation for order RAD${orderRecord.id}`);
    const shipResult = await delhivery.createShipment(shipmentPayload);

    if (shipResult && (shipResult.success || (shipResult.packages && shipResult.packages.length > 0))) {
      const firstPkg = shipResult.packages?.[0] || {};
      const waybill = firstPkg.waybill || shipResult.waybill;
      
      if (waybill) {
        // Save waybill and update status in orders table
        await db.run(
          "UPDATE orders SET waybill = ?, shipping_status = 'shipped', updated_at = datetime('now') WHERE id = ?",
          [waybill, orderRecord.id]
        );
        console.log(`[Delhivery] [Order RAD${orderRecord.id}] Shipment created successfully. Waybill: ${waybill}`);
        return waybill;
      }
    }
    
    console.error('[Delhivery] Shipment response did not return a valid waybill:', JSON.stringify(shipResult));
    await db.run(
      "UPDATE orders SET shipping_status = 'failed_manual_review', updated_at = datetime('now') WHERE id = ?",
      [orderRecord.id]
    );
  } catch (err) {
    console.error('[Delhivery] FulfillOrder error:', err.message);
    // Flag for manual review
    try {
      await db.run(
        "UPDATE orders SET shipping_status = 'failed_manual_review', updated_at = datetime('now') WHERE id = ?",
        [orderRecord.id]
      );
    } catch (e) {
      console.error('[Delhivery] Failed to flag order status:', e.message);
    }
  }
}

module.exports = router;
