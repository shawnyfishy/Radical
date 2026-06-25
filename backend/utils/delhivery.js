// delhivery.js — Delhivery API service module
const fetch = require('node-fetch');

function getBaseUrl() {
  const env = process.env.DELHIVERY_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'staging');
  return env === 'production'
    ? 'https://track.delhivery.com'
    : 'https://staging-express.delhivery.com';
}

function getAuthHeader() {
  const token = process.env.DELHIVERY_API_KEY;
  if (!token) {
    console.error('[Delhivery] Warning: DELHIVERY_API_KEY is not set in environment.');
  }
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

// 1. CHECK PINCODE SERVICEABILITY
// Returns whether a pincode is serviceable and estimated delivery days
async function checkPincode(pincode) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/c/api/pin-codes/json/?filter_codes=${pincode}`;
  console.log(`[Delhivery] Checking pincode ${pincode} via ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeader()
  });
  if (!response.ok) {
    throw new Error(`Delhivery pincode check failed: ${response.status}`);
  }
  return await response.json();
}

// 2. GET SHIPPING RATE / CHARGE ESTIMATE
// weight in kg (e.g. 0.5 for 500g)
// originPin and destinationPin are strings
// paymentMode: 'Prepaid' or 'COD'
async function getShippingRate({ originPin, destinationPin, weight, paymentMode = 'Prepaid' }) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/kinko/v1/invoice/charges/.json?` +
    `md=S` +                                // S = Surface, E = Express
    `&cgm=${weight * 1000}` +              // weight in grams
    `&o_pin=${originPin}` +
    `&d_pin=${destinationPin}` +
    `&ss=Delivered` +
    `&pt=${paymentMode}`;

  console.log(`[Delhivery] Checking shipping rate from ${originPin} to ${destinationPin} (${weight}kg) via ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeader()
  });
  if (!response.ok) {
    throw new Error(`Delhivery rate check failed: ${response.status}`);
  }
  return await response.json();
}

// 3. CREATE SHIPMENT / WAYBILL
async function createShipment(orderData) {
  const shipmentPayload = {
    format: 'json',
    data: JSON.stringify({
      shipments: [
        {
          waybill: orderData.waybill || '',
          order: orderData.order,
          name: orderData.name,
          add: orderData.add,
          pin: orderData.pin,
          city: orderData.city,
          state: orderData.state,
          country: orderData.country || 'India',
          phone: orderData.phone,
          payment_mode: orderData.payment_mode || 'Prepaid',
          order_date: orderData.order_date,
          total_amount: orderData.total_amount,
          cod_amount: orderData.cod_amount || 0,
          weight: orderData.weight,
          seller_name: orderData.seller_name || 'RADICAL',
          seller_add: orderData.seller_add,
          seller_pin: orderData.seller_pin,
          seller_city: orderData.seller_city,
          seller_state: orderData.seller_state,
          seller_country: orderData.seller_country || 'India',
          products_desc: orderData.products_desc,
          hsn_code: orderData.hsn_code || '',
          quantity: orderData.quantity || 1,
          shipment_type: 1, // 1 = forward, 3 = reverse
          fragile_shipment: false
        }
      ],
      pickup_location: {
        name: orderData.pickup_location_name || 'RADICAL Warehouse'
      }
    })
  };

  const baseUrl = getBaseUrl();
  console.log(`[Delhivery] Creating shipment for order ${orderData.order} via ${baseUrl}`);

  const formBody = Object.keys(shipmentPayload)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(shipmentPayload[k]))
    .join('&');

  const token = process.env.DELHIVERY_API_KEY;
  const response = await fetch(`${baseUrl}/api/cmu/create.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formBody
  });

  if (!response.ok) {
    throw new Error(`Delhivery shipment creation failed: ${response.status}`);
  }
  return await response.json();
}

// 4. TRACK SHIPMENT BY WAYBILL NUMBER
async function trackShipment(waybillNumber) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/v1/packages/json/?waybill=${waybillNumber}&verbose=1`;
  console.log(`[Delhivery] Tracking waybill ${waybillNumber} via ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeader()
  });
  if (!response.ok) {
    throw new Error(`Delhivery tracking failed: ${response.status}`);
  }
  return await response.json();
}

// 5. CANCEL SHIPMENT
async function cancelShipment(waybillNumber) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/p/edit?waybill=${waybillNumber}&cancellation=true`;
  console.log(`[Delhivery] Cancelling waybill ${waybillNumber} via ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeader()
  });
  if (!response.ok) {
    throw new Error(`Delhivery cancellation failed: ${response.status}`);
  }
  return await response.json();
}

module.exports = {
  checkPincode,
  getShippingRate,
  createShipment,
  trackShipment,
  cancelShipment
};
