/**
 * RADICAL — Store (Cart Drawer + Auth UI)
 * Drives the cart drawer, bag count, add-to-bag buttons, and auth modal.
 */

(function () {
  const API = window.RADICAL_API;

  // ── State ─────────────────────────────────────────────────────
  let cartItems   = [];
  let cartSubtotal = 0;

  // ── DOM refs ──────────────────────────────────────────────────
  const bagBtn       = document.getElementById('nav-bag-btn');
  const bagCount     = document.querySelector('.nav__bag-count');
  const accountBtn   = document.getElementById('nav-account-btn');
  const cartDrawer   = document.getElementById('cart-drawer');
  const cartOverlay  = document.getElementById('cart-overlay');
  const cartClose    = document.getElementById('cart-close');
  const cartBody     = document.getElementById('cart-body');
  const cartFooter   = document.getElementById('cart-footer');
  const authModal    = document.getElementById('auth-modal');
  const authOverlay  = document.getElementById('auth-overlay');
  const authClose    = document.getElementById('auth-modal-close');

  // ── Cart Drawer ───────────────────────────────────────────────
  function openCart()  { cartDrawer?.classList.add('is-open'); cartOverlay?.classList.add('is-active'); document.body.style.overflow = 'hidden'; refreshCart(); }
  function closeCart() { cartDrawer?.classList.remove('is-open'); cartOverlay?.classList.remove('is-active'); document.body.style.overflow = ''; }

  bagBtn?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  async function refreshCart() {
    if (!cartBody) return;
    cartBody.innerHTML = '<p class="cart__loading">Loading…</p>';
    try {
      const data  = await API.cart.get();
      cartItems    = data.items;
      cartSubtotal = data.subtotal;
      renderCart();
    } catch (e) {
      cartBody.innerHTML = `<p class="cart__empty">Could not load cart.</p>`;
    }
  }

  function renderCart() {
    if (!cartItems.length) {
      cartBody.innerHTML  = '<p class="cart__empty">Your bag is empty.</p>';
      cartFooter.innerHTML = '';
      updateBagCount(0);
      return;
    }

    const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
    updateBagCount(totalQty);

    cartBody.innerHTML = cartItems.map(item => `
      <div class="cart__item" data-id="${item.id}">
        <div class="cart__item-img">
          <img src="${item.product.images[0] || ''}" alt="${item.product.name}" />
        </div>
        <div class="cart__item-info">
          <p class="cart__item-name">${item.product.name}</p>
          ${item.variant ? `<p class="cart__item-variant">${item.variant.label}</p>` : ''}
          <p class="cart__item-price">₹${(item.unit_price * item.quantity).toLocaleString('en-IN')}</p>
          <div class="cart__item-qty">
            <button class="cart__qty-btn" data-action="dec" data-id="${item.id}" data-qty="${item.quantity}">−</button>
            <span>${item.quantity}</span>
            <button class="cart__qty-btn" data-action="inc" data-id="${item.id}" data-qty="${item.quantity}">+</button>
          </div>
        </div>
        <button class="cart__item-remove" data-id="${item.id}" aria-label="Remove">
          <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none">
            <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
          </svg>
        </button>
      </div>
    `).join('');

    cartFooter.innerHTML = `
      <div class="cart__subtotal">
        <span>Subtotal</span>
        <span>₹${cartSubtotal.toLocaleString('en-IN')}</span>
      </div>
      <p class="cart__shipping-note">${cartSubtotal >= 999 ? 'Free shipping applied' : `₹${(999 - cartSubtotal).toLocaleString('en-IN')} away from free shipping`}</p>
      <a href="/checkout.html" class="cart__checkout-btn">Proceed to Checkout</a>
      <button class="cart__clear-btn" id="cart-clear">Clear bag</button>
    `;

    document.getElementById('cart-clear')?.addEventListener('click', async () => {
      await API.cart.clear();
      await refreshCart();
    });

    // Qty buttons
    cartBody.querySelectorAll('.cart__qty-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id  = btn.dataset.id;
        const qty = Number(btn.dataset.qty);
        const newQty = btn.dataset.action === 'inc' ? qty + 1 : qty - 1;
        if (newQty < 1) {
          await API.cart.remove(id);
        } else {
          await API.cart.update(id, newQty);
        }
        await refreshCart();
      });
    });

    // Remove buttons
    cartBody.querySelectorAll('.cart__item-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await API.cart.remove(btn.dataset.id);
        await refreshCart();
      });
    });
  }

  function updateBagCount(n) {
    if (!bagCount) return;
    bagCount.textContent = n > 0 ? n : '';
    bagCount.classList.toggle('has-items', n > 0);
  }

  // ── Add-to-Bag buttons (product pages) ───────────────────────
  document.querySelectorAll('[data-add-to-bag]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      const variantId = btn.dataset.variantId || null;
      const orig = btn.textContent;
      btn.textContent = 'Adding…';
      btn.disabled = true;
      try {
        await API.cart.add(Number(productId), variantId ? Number(variantId) : null, 1);
        btn.textContent = 'Added ✓';
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
        await refreshCart();
        openCart();
      } catch (e) {
        btn.textContent = e.message;
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2000);
      }
    });
  });

  // ── Auth Modal ────────────────────────────────────────────────
  function openAuth()  { authModal?.classList.add('is-open'); authOverlay?.classList.add('is-active'); document.body.style.overflow = 'hidden'; }
  function closeAuth() { authModal?.classList.remove('is-open'); authOverlay?.classList.remove('is-active'); document.body.style.overflow = ''; }

  accountBtn?.addEventListener('click', () => {
    if (API.isLoggedIn()) {
      window.location.href = '/account.html';
    } else {
      openAuth();
    }
  });
  authClose?.addEventListener('click', closeAuth);
  authOverlay?.addEventListener('click', closeAuth);

  // Auth tab switching
  document.querySelectorAll('.auth__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth__tab, .auth__panel').forEach(el => el.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.getElementById(`auth-${tab.dataset.tab}`)?.classList.add('is-active');
    });
  });

  // Login form
  document.getElementById('auth-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const err      = document.getElementById('login-error');
    try {
      const data = await API.auth.login(email, password);
      API.setToken(data.token);
      window.dispatchEvent(new Event('radical:auth-change'));
      closeAuth();
      updateAuthNav(data.user);
    } catch (e) {
      err.textContent = e.message;
    }
  });

  // Register form
  document.getElementById('auth-register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name     = document.getElementById('reg-name').value;
    const email    = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const err      = document.getElementById('reg-error');
    try {
      const data = await API.auth.register(name, email, password);
      API.setToken(data.token);
      window.dispatchEvent(new Event('radical:auth-change'));
      closeAuth();
      updateAuthNav(data.user);
    } catch (e) {
      err.textContent = e.message;
    }
  });

  function updateAuthNav(user) {
    if (accountBtn && user) {
      accountBtn.setAttribute('aria-label', user.name || 'My Account');
    }
  }

  // ── Init ──────────────────────────────────────────────────────
  async function init() {
    // Load bag count on page load
    try {
      const data = await API.cart.get();
      const qty  = (data.items || []).reduce((s, i) => s + i.quantity, 0);
      updateBagCount(qty);
    } catch {}

    // Restore auth state
    if (API.isLoggedIn()) {
      try {
        const { user } = await API.auth.me();
        updateAuthNav(user);
      } catch { API.clearToken(); }
    }
  }

  init();
})();
