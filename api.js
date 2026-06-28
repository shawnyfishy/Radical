/**
 * RADICAL — API Client
 * Handles all communication with the backend, auth tokens, and guest sessions.
 */

const API = (() => {
  const BASE = '/api';

  // ── Session / Auth helpers ──────────────────────────────────
  function getToken()   { return localStorage.getItem('radical_token'); }
  function getSession() {
    let sid = localStorage.getItem('radical_session');
    if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('radical_session', sid); }
    return sid;
  }
  function setToken(token) { localStorage.setItem('radical_token', token); }
  function clearToken()    { localStorage.removeItem('radical_token'); }
  function isLoggedIn()    { return !!getToken(); }

  function headers() {
    const h = { 'Content-Type': 'application/json', 'X-Session-ID': getSession() };
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  }

  async function req(method, path, body) {
    const res = await fetch(BASE + path, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // ── Auth ─────────────────────────────────────────────────────
  const auth = {
    register: (name, email, password) => req('POST', '/auth/register', { name, email, password }),
    login:    (email, password)        => req('POST', '/auth/login', { email, password }),
    me:       ()                        => req('GET',  '/auth/me'),
    logout:   () => { clearToken(); window.dispatchEvent(new Event('radical:auth-change')); },
  };

  // ── Products ─────────────────────────────────────────────────
  const products = {
    list:   (params = {}) => req('GET', '/products?' + new URLSearchParams(params)),
    get:    (slug)         => req('GET', `/products/${slug}`),
  };

  // ── Cart ─────────────────────────────────────────────────────
  const cart = {
    get:    ()                              => req('GET',    '/cart'),
    add:    (product_id, variant_id, qty)   => req('POST',   '/cart', { product_id, variant_id, quantity: qty ?? 1 }),
    update: (itemId, quantity)              => req('PUT',    `/cart/${itemId}`, { quantity }),
    remove: (itemId)                        => req('DELETE', `/cart/${itemId}`),
    clear:  ()                              => req('DELETE', '/cart'),
  };

  // ── Orders ───────────────────────────────────────────────────
  const orders = {
    place:  (shipping_address, opts = {}) => req('POST', '/orders', { shipping_address, ...opts }),
    list:   ()                             => req('GET',  '/orders'),
    get:    (id)                           => req('GET',  `/orders/${id}`),
  };

  // ── Payment ──────────────────────────────────────────────────
  const payment = {
    verify: (razorpayOrderId, razorpayPaymentId, razorpaySignature, localOrderId) =>
      req('POST', '/payment/verify', {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        localOrderId: localOrderId,
      }),
  };

  // ── Addresses ────────────────────────────────────────────────
  const addresses = {
    list:   ()       => req('GET',    '/addresses'),
    add:    (data)   => req('POST',   '/addresses', data),
    remove: (id)     => req('DELETE', `/addresses/${id}`),
  };

  // ── Shipping ──────────────────────────────────────────────────
  const shipping = {
    checkPincode: (pincode) => req('POST', '/shipping/check-pincode', { pincode }),
    getRate:      (data)    => req('POST', '/shipping/rate', data),
    track:        (waybill) => req('GET',  `/shipping/track/${waybill}`),
  };

  return { auth, products, cart, orders, addresses, shipping, payment, setToken, getToken, clearToken, isLoggedIn, getSession };
})();

window.RADICAL_API = API;
