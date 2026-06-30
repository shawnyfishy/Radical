const router = require('express').Router();
const db     = require('../db/database');
const fetch  = require('node-fetch');
const crypto = require('crypto');
const express = require('express');

async function notifyGoogleSheets(orderId, db) {
  try {
    // Fetch full order details from DB
    const order = await db.get(
      `SELECT o.*, 
              GROUP_CONCAT(
                p.name || ' x' || oi.quantity || COALESCE(' (' || v.label || ')', ''), ', '
              ) as product_summary
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN variants v ON oi.variant_id = v.id
       WHERE o.id = ?
       GROUP BY o.id`,
      [orderId]
    );

    if (!order) {
      console.error('[RADICAL] Sheets: order not found:', orderId);
      return;
    }

    // Parse shipping address — it is stored as a JSON string
    let address = {};
    try {
      address = JSON.parse(order.shipping_address || '{}');
    } catch (parseErr) {
      console.error('[RADICAL] Sheets: failed to parse shipping_address:', parseErr);
      address = {};
    }

    // Split full name into first and last
    const fullName = (address.name || address.full_name || 
      address.firstName + ' ' + address.lastName || '').trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build city/state/country string
    const cityStateCountry = [
      address.city,
      address.state,
      address.country || 'India'
    ].filter(Boolean).join(', ');

    // Format timestamp
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // Build payload matching Apps Script column mappings
    const payload = {
      order_id: String(order.id),
      first_name: firstName,
      last_name: lastName,
      email: order.guest_email || address.email || '',
      phone: address.phone || address.mobile || address.contact || '',
      address_line1: address.line1 || address.address1 || address.address_line1 || address.addressLine1 || '',
      address_line2: address.line2 || address.address2 || address.address_line2 || address.addressLine2 || '',
      city_state_country: cityStateCountry,
      zipcode: address.pincode || address.zip || address.postal_code || address.zipcode || '',
      product_name: order.product_summary || 'RADICAL Product',
      total_amount: String(order.total || order.subtotal || ''),
      payment_method: 'Razorpay',
      date_and_time: timestamp,
    };

    console.log('[RADICAL] Sending to Google Sheets:', payload);

    // POST to Apps Script as JSON
    const sheetsUrl = process.env.SHEETS_WEBHOOK_URL;
    if (!sheetsUrl) {
      console.error('[RADICAL] Sheets: SHEETS_WEBHOOK_URL not set in environment variables');
      return;
    }

    const sheetsRes = await fetch(sheetsUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const sheetsBody = await sheetsRes.text();
    console.log('[RADICAL] Google Sheets response:', sheetsBody);

    let parsed = null;
    try {
      parsed = JSON.parse(sheetsBody);
    } catch (parseErr) {
      console.error('[RADICAL] Sheets response was not valid JSON:', parseErr);
    }

    if (sheetsRes.ok && parsed && parsed.status === 'success') {
      await db.run(
        `UPDATE orders SET sheets_synced_at = datetime('now'), sheets_sync_error = NULL WHERE id = ?`,
        [orderId]
      );
      console.log('[RADICAL] Google Sheets sync succeeded and recorded for order:', orderId);
    } else {
      const errorMsg = parsed && parsed.message 
        ? parsed.message 
        : sheetsBody.substring(0, 300) || `HTTP error status ${sheetsRes.status}`;
      
      await db.run(
        `UPDATE orders SET sheets_sync_error = ? WHERE id = ?`,
        [errorMsg, orderId]
      );
      console.warn('[RADICAL] Google Sheets sync failed and error recorded for order:', orderId, errorMsg);
    }

  } catch (sheetsErr) {
    // Never throw from here — a Sheets failure must never
    // break the payment confirmation flow
    console.error('[RADICAL] Google Sheets notification failed:', sheetsErr);
    try {
      const errorMsg = sheetsErr.message || String(sheetsErr);
      await db.run(
        `UPDATE orders SET sheets_sync_error = ? WHERE id = ?`,
        [errorMsg.substring(0, 300), orderId]
      );
    } catch (dbErr) {
      console.error('[RADICAL] Failed to record Sheets sync error to DB:', dbErr);
    }
  }
}

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      localOrderId 
    } = req.body;

    // Validate that all required fields are present
    if (!razorpay_order_id || !razorpay_payment_id || 
        !razorpay_signature || !localOrderId) {
      return res.status(400).json({ 
        error: 'Missing required payment verification fields.' 
      });
    }

    // Generate expected signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare signatures using timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'hex'),
      Buffer.from(razorpay_signature, 'hex')
    );

    if (!isValid) {
      console.error('[RADICAL] Payment signature mismatch for order:', localOrderId);
      return res.status(400).json({ 
        error: 'Payment verification failed. Invalid signature.' 
      });
    }

    // Update order status to paid in the database
    const updateResult = await db.run(
      `UPDATE orders 
       SET status = 'paid',
           razorpay_payment_id = ?,
           paid_at = datetime('now')
       WHERE razorpay_order_id = ?`,
      [razorpay_payment_id, razorpay_order_id]
    );

    console.log('[RADICAL] Payment verify DB update:', {
      razorpay_order_id,
      razorpay_payment_id,
      rowsAffected: updateResult.rowsAffected
    });

    if (updateResult.rowsAffected === 0) {
      console.error('[RADICAL] Verify: no order found for:', razorpay_order_id);
      // Payment is real but order not found — return success 
      // anyway so user sees confirmation, log for manual fix
      return res.json({
        success: true,
        warning: 'Payment captured. Order needs manual review.',
        razorpay_order_id,
        razorpay_payment_id
      });
    }

    // Notify Google Sheets asynchronously
    notifyGoogleSheets(localOrderId, db).catch(err => {
      console.error('[RADICAL] Sheets notify error in verify:', err);
    });

    return res.json({ 
      success: true, 
      message: 'Payment verified.' 
    });

  } catch (err) {
    console.error('[RADICAL] Payment verification error:', err);
    return res.status(500).json({ 
      error: 'Internal error during payment verification.' 
    });
  }
});

// POST /api/payment/webhook
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers['x-razorpay-signature'];

      if (!signature) {
        return res.status(400).json({ 
          error: 'Missing webhook signature.' 
        });
      }

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );

      if (!isValid) {
        console.error('[RADICAL] Webhook signature invalid');
        return res.status(400).json({ error: 'Invalid signature.' });
      }

      const event = JSON.parse(req.body.toString());
      const eventType = event.event;

      console.log('[RADICAL] Webhook received:', eventType);

      if (eventType === 'payment.captured' || 
          eventType === 'order.paid') {
        const razorpayOrderId = 
          event.payload?.payment?.entity?.order_id || 
          event.payload?.order?.entity?.id;
        
        const razorpayPaymentId = 
          event.payload?.payment?.entity?.id;

         if (razorpayOrderId) {
           // Primary lookup by razorpay_order_id
           let webhookResult = await db.run(
             `UPDATE orders 
              SET status = 'paid',
                  razorpay_payment_id = COALESCE(
                    NULLIF(razorpay_payment_id, ''), ?
                  ),
                  paid_at = COALESCE(NULLIF(paid_at, ''), datetime('now'))
              WHERE razorpay_order_id = ?`,
             [razorpayPaymentId || null, razorpayOrderId]
           );

           console.log('[RADICAL] Webhook marked order paid:', {
             razorpayOrderId,
             razorpayPaymentId,
             rowsAffected: webhookResult.rowsAffected
           });

           let updated = webhookResult.rowsAffected > 0;

           // Fallback: if no rows updated, try by payment_id directly
           if (webhookResult.rowsAffected === 0 && razorpayPaymentId) {
             webhookResult = await db.run(
               `UPDATE orders 
                SET status = 'paid',
                    razorpay_order_id = COALESCE(
                      NULLIF(razorpay_order_id, ''), ?
                    ),
                    paid_at = COALESCE(NULLIF(paid_at, ''), datetime('now'))
                WHERE razorpay_payment_id = ?`,
               [razorpayOrderId, razorpayPaymentId]
             );
             console.log('[RADICAL] Webhook fallback by payment_id:', {
               razorpayPaymentId,
               rowsAffected: webhookResult.rowsAffected
             });
             updated = webhookResult.rowsAffected > 0;
           }

           if (updated) {
             // Get the local order ID to pass to Sheets
             const orderLookup = await db.get(
               `SELECT id FROM orders 
                WHERE razorpay_order_id = ? OR razorpay_payment_id = ?`,
               [razorpayOrderId, razorpayPaymentId]
             );
             
             if (orderLookup) {
               notifyGoogleSheets(orderLookup.id, db).catch(err => {
                 console.error('[RADICAL] Sheets notify error in webhook:', err);
               });
             }
           }
         }
      }

      if (eventType === 'payment.failed') {
        const razorpayOrderId = 
          event.payload?.payment?.entity?.order_id;
        if (razorpayOrderId) {
          await db.run(`UPDATE orders 
                  SET status = 'payment_failed' 
                  WHERE razorpay_order_id = ? 
                    AND status = 'pending'`,
            [razorpayOrderId]);
          console.log('[RADICAL] Payment failed for order:', razorpayOrderId);
        }
      }

      return res.json({ status: 'ok' });

    } catch (err) {
      console.error('[RADICAL] Webhook processing error:', err);
      return res.status(500).json({ error: 'Webhook error.' });
    }
  }
);

router.notifyGoogleSheets = notifyGoogleSheets;
module.exports = router;
