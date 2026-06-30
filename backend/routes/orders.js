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

  // Validate stock & variants
  for (const item of items) {
    if (!item.is_active) return res.status(400).json({ error: `${item.name} is no longer available` });

    const variants = await db.all('SELECT id, label, price_delta, stock FROM variants WHERE product_id = ?', [item.product_id]);
    if (variants.length > 1 && !item.variant_id) {
      return res.status(400).json({ error: `Size/variant is required for ${item.name}` });
    }
    if (variants.length === 1 && !item.variant_id) {
      item.variant_id = variants[0].id;
      item.variant_label = variants[0].label;
      item.price_delta = variants[0].price_delta;
      item.stock = variants[0].stock;
    }

    if (item.variant_id && item.stock < item.quantity) {
      return res.status(400).json({ error: `Not enough stock for ${item.name} (${item.variant_label || 'Standard'})` });
    }
  }

  const subtotal     = items.reduce((s, i) => s + (i.price + (i.price_delta ?? 0)) * i.quantity, 0);
  const shippingCost = subtotal >= 999 ? 0 : 99;  // free shipping above ₹999
  const total        = subtotal + shippingCost;

  // ── Self-Cleaning Stock Reclaiming ─────────────────────────────────────
  // 1. Reclaim stock from ANY pending orders older than 24 hours across the system
  try {
    const expiredOrders = await db.all(`
      SELECT id FROM orders 
      WHERE status = 'pending' 
        AND created_at < datetime('now', '-24 hours')
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
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: String(newOrder.id).substring(0, 40),
      notes: {
        radical_order_id: String(newOrder.id),
      },
    });
    console.log('[RADICAL] Razorpay order created:', razorpayOrder.id);
  } catch (rzpErr) {
    console.error('[RADICAL] Razorpay order creation failed:', rzpErr);
    return res.status(502).json({ 
      error: 'Could not create payment order. Please try again.' 
    });
  }

  // Save razorpay_order_id to DB immediately
  try {
    await db.run('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [razorpayOrder.id, newOrder.id]);
    console.log('[RADICAL] razorpay_order_id saved to DB:', {
      orderId: newOrder.id,
      razorpayOrderId: razorpayOrder.id
    });
  } catch (dbErr) {
    console.error('[RADICAL] Failed to save razorpay_order_id:', dbErr);
    // Still continue — return the IDs to frontend even if 
    // DB update failed, webhook will be fallback
  }

  return res.status(201).json({
    success: true,
    localOrderId: newOrder.id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// Previous payment callback route removed. 
// TODO: Add new payment gateway webhook/callback route here after integration.


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
    // Validate required environment variables first (before idempotency check)
    const requiredEnvVars = [
      'DELHIVERY_SELLER_NAME',
      'DELHIVERY_SELLER_ADDRESS',
      'DELHIVERY_SELLER_PIN',
      'DELHIVERY_SELLER_CITY',
      'DELHIVERY_SELLER_STATE',
      'DELHIVERY_PICKUP_LOCATION_NAME'
    ];
    const missingVars = requiredEnvVars.filter(v => !process.env[v] || process.env[v].trim() === '');
    
    if (missingVars.length > 0) {
      const errorMsg = `Missing required env var(s): ${missingVars.join(', ')}`;
      console.error(`[Delhivery] ${errorMsg}`);
      await db.run(
        "UPDATE orders SET shipping_status = 'failed_manual_review', delhivery_error = ?, updated_at = datetime('now') WHERE id = ?",
        [errorMsg, orderRecord.id]
      );
      return;
    }

    // Idempotency guard: check if waybill is already set
    const currentOrder = await db.get('SELECT waybill FROM orders WHERE id = ?', [orderRecord.id]);
    if (currentOrder && currentOrder.waybill) {
      console.log(`[Delhivery] Order RAD${orderRecord.id} already has a waybill: ${currentOrder.waybill}. Skipping fulfillment.`);
      return currentOrder.waybill;
    }

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
      seller_name: process.env.DELHIVERY_SELLER_NAME,
      seller_add: process.env.DELHIVERY_SELLER_ADDRESS,
      seller_pin: process.env.DELHIVERY_SELLER_PIN,
      seller_city: process.env.DELHIVERY_SELLER_CITY,
      seller_state: process.env.DELHIVERY_SELLER_STATE,
      products_desc: products_desc || 'Men\'s Jewellery - RADICAL',
      quantity: quantity || 1,
      pickup_location_name: process.env.DELHIVERY_PICKUP_LOCATION_NAME
    };

    const delhivery = require('../utils/delhivery');
    console.log(`[Delhivery] Triggering automatic shipment creation for order RAD${orderRecord.id}`);
    const shipResult = await delhivery.createShipment(shipmentPayload);
    console.log('[Delhivery] Full create response:', JSON.stringify(shipResult));

    // Require success:true AND a package whose own status is not 'Fail'.
    // Delhivery always echoes the waybill back even in rejection responses, so checking
    // packages.length alone is not sufficient — a failed response returns packages with
    // status:"Fail" and serviceable:false while success:false at the top level.
    if (shipResult && shipResult.success === true && shipResult.packages && shipResult.packages.length > 0) {
      const firstPkg = shipResult.packages[0];
      const waybill = firstPkg.waybill || shipResult.waybill;

      if (waybill && firstPkg.status !== 'Fail') {
        // Save waybill and update status in orders table, clear delhivery_error
        await db.run(
          "UPDATE orders SET waybill = ?, shipping_status = 'shipped', delhivery_error = NULL, updated_at = datetime('now') WHERE id = ?",
          [waybill, orderRecord.id]
        );
        console.log(`[Delhivery] [Order RAD${orderRecord.id}] Shipment created successfully. Waybill: ${waybill}`);
        return waybill;
      }
    }
    
    console.error('[Delhivery] Shipment response did not return a valid waybill:', JSON.stringify(shipResult));
    
    let errorMsg = 'Shipment response did not return a valid waybill';
    if (shipResult) {
      if (shipResult.errors && shipResult.errors.length > 0) {
        errorMsg = shipResult.errors.join(', ');
      } else if (shipResult.packages && shipResult.packages.length > 0) {
        const pkg = shipResult.packages[0];
        if (pkg.remarks && pkg.remarks.length > 0) {
          errorMsg = Array.isArray(pkg.remarks) ? pkg.remarks.join(', ') : String(pkg.remarks);
        } else if (pkg.reason) {
          errorMsg = pkg.reason;
        } else if (pkg.status) {
          errorMsg = `Package Status: ${pkg.status}`;
        }
      } else if (shipResult.rmk) {
        errorMsg = shipResult.rmk;
      } else {
        errorMsg = JSON.stringify(shipResult).substring(0, 300);
      }
    }

    await db.run(
      "UPDATE orders SET shipping_status = 'failed_manual_review', delhivery_error = ?, updated_at = datetime('now') WHERE id = ?",
      [errorMsg.substring(0, 300), orderRecord.id]
    );
  } catch (err) {
    console.error('[Delhivery] FulfillOrder error:', err.message);
    try {
      await db.run(
        "UPDATE orders SET shipping_status = 'failed_manual_review', delhivery_error = ?, updated_at = datetime('now') WHERE id = ?",
        [err.message.substring(0, 300), orderRecord.id]
      );
    } catch (e) {
      console.error('[Delhivery] Failed to flag order status:', e.message);
    }
  }
}

router.fulfillOrder = fulfillOrder;
module.exports = router;
