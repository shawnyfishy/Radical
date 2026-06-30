// routes/shipping.js
const express = require('express');
const router = express.Router();
const delhivery = require('../utils/delhivery');
const { requireAdmin } = require('../middleware/auth');

// POST /api/shipping/check-pincode
// Body: { pincode: '400001' }
router.post('/check-pincode', async (req, res) => {
  try {
    const { pincode } = req.body;
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ 
        success: false, 
        error: 'A valid 6-digit pincode is required.' 
      });
    }
    const data = await delhivery.checkPincode(pincode);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[Delhivery] checkPincode error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipping/rate
// Body: { originPin, destinationPin, weight, paymentMode }
router.post('/rate', async (req, res) => {
  try {
    const { originPin, destinationPin, weight, paymentMode } = req.body;
    if (!originPin || !destinationPin || !weight) {
      return res.status(400).json({ 
        success: false, 
        error: 'originPin, destinationPin, and weight are required.' 
      });
    }
    const data = await delhivery.getShippingRate({ 
      originPin, destinationPin, weight, paymentMode 
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[Delhivery] getShippingRate error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipping/create
// Body: full orderData object
router.post('/create', requireAdmin, async (req, res) => {
  try {
    const orderData = req.body;
    const required = ['order', 'name', 'add', 'pin', 'city', 
                      'state', 'phone', 'total_amount', 'weight'];
    const missing = required.filter(field => !orderData[field]);
    if (missing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Missing required fields: ${missing.join(', ')}` 
      });
    }
    const data = await delhivery.createShipment(orderData);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[Delhivery] createShipment error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/shipping/track/:waybill
router.get('/track/:waybill', async (req, res) => {
  try {
    const { waybill } = req.params;
    if (!waybill) {
      return res.status(400).json({ 
        success: false, 
        error: 'Waybill number is required.' 
      });
    }
    const data = await delhivery.trackShipment(waybill);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[Delhivery] trackShipment error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipping/cancel
// Body: { waybill: 'WAYBILL123' }
router.post('/cancel', requireAdmin, async (req, res) => {
  try {
    const { waybill } = req.body;
    if (!waybill) {
      return res.status(400).json({ 
        success: false, 
        error: 'Waybill number is required for cancellation.' 
      });
    }
    const data = await delhivery.cancelShipment(waybill);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[Delhivery] cancelShipment error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
