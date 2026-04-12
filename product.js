/**
 * RADICAL — Men's Jewellery
 * product.js · Phase 24: Product Detail Page interactions
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────
     IMAGE DATA — read from DOM so this file works
     for every product page without modification.
  ───────────────────────────────────────────────── */
  const galleryImgEls         = document.querySelectorAll('.pdp__gallery-img');
  const galleryPlaceholderEls = document.querySelectorAll('.pdp__gallery-placeholder');

  const IMAGES = Array.from(galleryImgEls).map((img, i) => ({
    src:         img.getAttribute('src') || '',
    alt:         img.getAttribute('alt') || '',
    placeholder: galleryPlaceholderEls[i]
                   ? galleryPlaceholderEls[i].textContent.trim()
                   : '[PRODUCT IMAGE ' + (i + 1) + ']',
  }));

  let currentLightboxIndex = 0;


  /* ─────────────────────────────────────────────────
     DOM REFERENCES
  ───────────────────────────────────────────────── */
  const galleryItems    = document.querySelectorAll('.pdp__gallery-item');
  const galleryStack    = document.getElementById('pdp-gallery-stack');
  const lightbox        = document.getElementById('pdp-lightbox');
  const lbStage         = document.getElementById('pdp-lb-stage');
  const lbImg           = document.getElementById('pdp-lb-img');
  const lbPlaceholder   = document.getElementById('pdp-lb-placeholder');
  const lbClose         = document.getElementById('pdp-lb-close');
  const lbPrev          = document.getElementById('pdp-lb-prev');
  const lbNext          = document.getElementById('pdp-lb-next');
  const addBtn          = document.getElementById('pdp-add-btn');
  const sizeBtns        = document.querySelectorAll('.pdp__size-btn');
  const accordionToggles = document.querySelectorAll('.pdp__accordion-toggle');
  const carouselDotsEl  = document.getElementById('pdp-carousel-dots');


  /* ─────────────────────────────────────────────────
     LIGHTBOX — Open / Close / Navigate
  ───────────────────────────────────────────────── */
  function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxSlide();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function navigateLightbox(dir) {
    const next = currentLightboxIndex + dir;
    if (next >= 0 && next < IMAGES.length) {
      currentLightboxIndex = next;
      updateLightboxSlide();
    }
  }

  function updateLightboxSlide() {
    const img = IMAGES[currentLightboxIndex];

    if (img.src) {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbImg.style.display = 'block';
      lbPlaceholder.style.display = 'none';
    } else {
      lbImg.src = '';
      lbImg.style.display = 'none';
      lbPlaceholder.textContent = img.placeholder;
      lbPlaceholder.style.display = 'flex';
    }

    // Show/hide arrows at bounds
    if (lbPrev) lbPrev.classList.toggle('is-hidden', currentLightboxIndex === 0);
    if (lbNext) lbNext.classList.toggle('is-hidden', currentLightboxIndex === IMAGES.length - 1);
  }

  /* Gallery item clicks */
  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      openLightbox(parseInt(item.dataset.index, 10));
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(parseInt(item.dataset.index, 10));
      }
    });
  });

  /* Lightbox controls */
  if (lbClose) lbClose.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
  if (lbPrev)  lbPrev.addEventListener('click',  (e) => { e.stopPropagation(); navigateLightbox(-1); });
  if (lbNext)  lbNext.addEventListener('click',  (e) => { e.stopPropagation(); navigateLightbox(1); });

  /* Click outside image (on dark backdrop) to close */
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (lbStage && lbStage.contains(e.target)) return;
      if (lbClose && lbClose.contains(e.target)) return;
      if (lbPrev  && lbPrev.contains(e.target))  return;
      if (lbNext  && lbNext.contains(e.target))  return;
      closeLightbox();
    });
  }

  /* Keyboard navigation */
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   navigateLightbox(-1);
    if (e.key === 'ArrowRight')  navigateLightbox(1);
  });

  /* Touch swipe in lightbox */
  let lbTouchStartX = 0;
  if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
      lbTouchStartX = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      const deltaX = e.changedTouches[0].clientX - lbTouchStartX;
      if (Math.abs(deltaX) > 50) {
        navigateLightbox(deltaX < 0 ? 1 : -1);
      }
    }, { passive: true });
  }


  /* ─────────────────────────────────────────────────
     SIZE SELECTOR
  ───────────────────────────────────────────────── */
  sizeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach((b) => {
        b.classList.remove('is-selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
    });
  });


  /* ─────────────────────────────────────────────────
     ADD TO BAG
  ───────────────────────────────────────────────── */
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addBtn.textContent = 'Added \u2713';
      addBtn.disabled = true;

      // Increment bag count in nav
      const bagCountEl = document.querySelector('.nav__bag-count');
      const bagBtn     = document.getElementById('nav-bag-btn');
      if (bagCountEl) {
        const count = (parseInt(bagCountEl.textContent, 10) || 0) + 1;
        bagCountEl.textContent = count;
        bagCountEl.classList.add('has-items');
        if (bagBtn) {
          bagBtn.setAttribute('aria-label', `Shopping bag (${count} item${count !== 1 ? 's' : ''})`);
        }
      }

      setTimeout(() => {
        addBtn.textContent = 'Add to Bag';
        addBtn.disabled = false;
      }, 1500);
    });
  }


  /* ─────────────────────────────────────────────────
     PDP ACCORDIONS
  ───────────────────────────────────────────────── */
  accordionToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const body       = toggle.closest('.pdp__accordion').querySelector('.pdp__accordion-body');
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        toggle.setAttribute('aria-expanded', 'false');
        body.style.maxHeight = null;
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });


  /* ─────────────────────────────────────────────────
     MOBILE CAROUSEL DOTS
     Built dynamically; update active on scroll.
  ───────────────────────────────────────────────── */
  if (carouselDotsEl && galleryStack && IMAGES.length > 1) {
    // Build dots
    IMAGES.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'pdp__carousel-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Go to image ' + (i + 1));
      dot.addEventListener('click', () => {
        const item = galleryStack.children[i];
        if (item) galleryStack.scrollTo({ left: item.offsetLeft, behavior: 'smooth' });
      });
      carouselDotsEl.appendChild(dot);
    });

    const dots = carouselDotsEl.querySelectorAll('.pdp__carousel-dot');

    // Update active dot on scroll
    let dotTimeout;
    galleryStack.addEventListener('scroll', () => {
      clearTimeout(dotTimeout);
      dotTimeout = setTimeout(() => {
        const itemWidth   = galleryStack.offsetWidth;
        const activeIndex = Math.round(galleryStack.scrollLeft / itemWidth);
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeIndex));
      }, 50);
    }, { passive: true });
  }


  /* ─────────────────────────────────────────────────
     GALLERY IMAGE LOAD HANDLER
     Fades in real images once loaded.
  ───────────────────────────────────────────────── */
  document.querySelectorAll('.pdp__gallery-img').forEach((img) => {
    if (img.src) {
      img.addEventListener('load', () => img.classList.add('is-loaded'));
      if (img.complete && img.naturalWidth > 0) img.classList.add('is-loaded');
    }
  });


  console.log('%cRADICAL \u00B7 Phase 24 PDP initialized', 'font-family:serif; font-size:14px; color:#1A1A1A; font-weight:bold;');

})();
