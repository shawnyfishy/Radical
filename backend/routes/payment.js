const router = require('express').Router();
const db     = require('../db/database');
const crypto = require('crypto');
const express = require('express');

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

module.exports = router;
