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

// 3a. FETCH WAYBILL NUMBER FROM DELHIVERY
// Fetches one (or more) pre-assigned waybill numbers from the account's allocated series.
// Required when the account is not configured for auto-assignment during order creation.
async function fetchWaybill(count = 1) {
  const baseUrl = getBaseUrl();
  const clientName = process.env.DELHIVERY_SELLER_NAME;
  if (!clientName) {
    throw new Error('Failed to fetch waybill from Delhivery: DELHIVERY_SELLER_NAME env var is not set');
  }

  const url = count > 1
    ? `${baseUrl}/waybill/api/bulk/json/?cl=${encodeURIComponent(clientName)}&count=${count}`
    : `${baseUrl}/waybill/api/fetch/json/?cl=${encodeURIComponent(clientName)}`;

  console.log(`[Delhivery] Fetching waybill(s) for client "${clientName}" via ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeader()
  });

  const rawText = await response.text();
  console.log(`[Delhivery] Waybill fetch raw response (status ${response.status}):`, rawText);

  if (!response.ok) {
    throw new Error(`Failed to fetch waybill from Delhivery: HTTP ${response.status} — ${rawText}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Failed to fetch waybill from Delhivery: non-JSON response — ${rawText}`);
  }

  // Delhivery actual single-waybill response: "57361810000011"  (raw JSON string)
  // Delhivery object response (documented): { "waybill": "57361810000011" }
  // Delhivery bulk response (documented):   { "waybill": ["...", "..."] }  or plain array
  if (count === 1) {
    let waybill;
    if (typeof parsed === 'string' && parsed.trim() !== '') {
      waybill = parsed.trim();  // actual observed format
    } else if (parsed && typeof parsed.waybill === 'string' && parsed.waybill.trim() !== '') {
      waybill = parsed.waybill.trim();  // documented object format
    } else {
      throw new Error(`Failed to fetch waybill from Delhivery: unexpected response shape — ${rawText}`);
    }
    return waybill;
  } else {
    let waybills;
    if (Array.isArray(parsed) && parsed.length > 0) {
      waybills = parsed.map(w => String(w).trim());
    } else if (parsed && Array.isArray(parsed.waybill) && parsed.waybill.length > 0) {
      waybills = parsed.waybill.map(w => String(w).trim());
    } else {
      throw new Error(`Failed to fetch waybill from Delhivery: unexpected bulk response shape — ${rawText}`);
    }
    return waybills;
  }
}

// 3b. CREATE SHIPMENT / WAYBILL
async function createShipment(orderData) {
  // Pre-fetch a waybill if caller did not supply one explicitly.
  // Auto-assignment (blank waybill) fails on accounts configured to require explicit pre-fetching.
  let waybill = orderData.waybill || '';
  if (!waybill) {
    waybill = await fetchWaybill(1); // throws with a clear message on failure
    console.log(`[Delhivery] Pre-fetched waybill ${waybill} for order ${orderData.order}`);
  }

  const shipmentPayload = {
    format: 'json',
    data: JSON.stringify({
      shipments: [
        {
          waybill: waybill,
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
  fetchWaybill,
  createShipment,
  trackShipment,
  cancelShipment
};
