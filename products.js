/**
 * RADICAL — Product Data
 * Single source of truth for all product data.
 * To swap in real images: update images.primary / images.hover and set placeholder: false.
 * No other file needs to change.
 */

window.RADICAL_PRODUCTS = (function () {
  'use strict';

  /* ── Product catalogue ───────────────────────────────────────── */
  const products = [
    {
      id:          'RAD-001',
      url: '/product',
      name:        'BLACK CROWN RING',
      subtitle:    'Oxidized Silver, Black Onyx',
      price:       '12,500',
      currency:    '₹',
      sku:         'RAD-JW-001',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/rad-001-primary.jpg',
        hover:   'assets/products/rad-001-detail.jpg',
      },
      placeholder: true,   // set false when real images are uploaded
      available:   true,
    },
    {
      id:          'RAD-002',
      url: '/product',
      name:        'BLACK SIGNET RING',
      subtitle:    'Oxidized Dark Silver, Black Onyx Cabochon',
      price:       '14,000',
      currency:    '₹',
      sku:         'RAD-JW-002',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/rad-002-primary.jpg',
        hover:   'assets/products/rad-002-detail.jpg',
      },
      placeholder: true,
      available:   true,
    },
    {
      id:          'RAD-003',
      url: '/product',
      name:        'GOLD & SILVER TRINITY BAND',
      subtitle:    'Two-Tone, Polished Yellow Gold & Brushed Silver',
      price:       '18,000',
      currency:    '₹',
      sku:         'RAD-JW-003',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/rad-003-primary.jpg',
        hover:   'assets/products/rad-003-detail.jpg',
      },
      placeholder: true,
      available:   true,
    },
  ];

  const collections = [
    {
      id:       'collection-i',
      name:     'COLLECTION I',
      subtitle: 'THE FIRST DISCIPLINE',
      year:     'MMXXV',
    },
  ];

  /* ── Internal builders ───────────────────────────────────────── */
  function _placeholder() {
    return '<div class="product-card__placeholder">'
      + '<div class="product-card__placeholder-inner">'
      + '<span class="product-card__placeholder-label">RADICAL</span>'
      + '<span class="product-card__placeholder-sub">Coming Soon</span>'
      + '</div>'
      + '</div>';
  }

  function _buildCard(product, index) {
    var imageMarkup;

    if (product.placeholder) {
      imageMarkup = _placeholder();
    } else {
      var loadPrimary = index < 2 ? 'eager' : 'lazy';
      imageMarkup =
        '<img class="img-primary"'
        + ' src="' + product.images.primary + '"'
        + ' alt="' + product.name + '"'
        + ' loading="' + loadPrimary + '" width="800" height="1000" />'
        + '<img class="img-hover"'
        + ' src="' + product.images.hover + '"'
        + ' alt="' + product.name + ' — detail"'
        + ' loading="lazy" width="800" height="1000" />';
    }

    return '<article class="product-card" data-product-id="' + product.id + '" data-category="' + product.category + '">'
      + '<a class="product-card__link" href="' + product.url + '">'
      + '<div class="product-card__image-wrap">'
      + imageMarkup
      + '<div class="product-card__hover-cta">View Piece</div>'
      + '</div>'
      + '<div class="product-card__info">'
      + '<span class="product-card__name">' + product.name + '</span>'
      + '<span class="product-card__price">' + product.currency + product.price + '</span>'
      + '</div>'
      + '</a>'
      + '</article>';
  }

  /* ── Public API ──────────────────────────────────────────────── */

  /**
   * Render product cards into a container element.
   * @param {Element} containerEl  — the grid element to populate
   * @param {number}  [limit]      — optional max number of cards (e.g., 4 for featured)
   */
  function renderGrid(containerEl, limit) {
    if (!containerEl) return;
    var items = typeof limit === 'number' ? products.slice(0, limit) : products;
    containerEl.innerHTML = items.map(function (p, i) { return _buildCard(p, i); }).join('');
  }

  /** Update every .product-count element on the page. */
  function updateProductCount() {
    var count = String(products.length).padStart(2, '0') + ' Pieces';
    document.querySelectorAll('.product-count').forEach(function (el) {
      el.textContent = count;
    });
  }

  return {
    products:           products,
    collections:        collections,
    renderGrid:         renderGrid,
    updateProductCount: updateProductCount,
  };
})();
