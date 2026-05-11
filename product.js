/**
 * RADICAL — Men's Jewellery
 * product.js · Product Detail Page interactions (GSAP Modernized)
 */

(function () {
  'use strict';

  // Ensure GSAP is loaded
  if (typeof gsap === 'undefined') return;

  /* ─────────────────────────────────────────────────
     IMAGE DATA
  ───────────────────────────────────────────────── */
  const galleryImgEls = document.querySelectorAll('.pdp__gallery-img');
  const IMAGES = Array.from(galleryImgEls).map((img, i) => ({
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
  }));

  let currentLightboxIndex = 0;

  /* ─────────────────────────────────────────────────
     DOM REFERENCES
  ───────────────────────────────────────────────── */
  const galleryItems = document.querySelectorAll('.pdp__gallery-item');
  const lightbox = document.getElementById('pdp-lightbox');
  const lbStage = document.getElementById('pdp-lb-stage');
  const lbImg = document.getElementById('pdp-lb-img');
  const lbPlaceholder = document.getElementById('pdp-lb-placeholder');
  const lbClose = document.getElementById('pdp-lb-close');
  const lbPrev = document.getElementById('pdp-lb-prev');
  const lbNext = document.getElementById('pdp-lb-next');
  const addBtn = document.getElementById('pdp-add-btn');
  const sizeBtns = document.querySelectorAll('.pdp__size-btn');
  const accordionToggles = document.querySelectorAll('.pdp__accordion-toggle');

  /* ─────────────────────────────────────────────────
     LIGHTBOX — GSAP powered
  ───────────────────────────────────────────────── */
  function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxSlide();
    
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
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
    }
    if (lbPrev) lbPrev.classList.toggle('is-hidden', currentLightboxIndex === 0);
    if (lbNext) lbNext.classList.toggle('is-hidden', currentLightboxIndex === IMAGES.length - 1);
  }

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => openLightbox(parseInt(item.dataset.index, 10)));
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', () => navigateLightbox(-1));
  if (lbNext) lbNext.addEventListener('click', () => navigateLightbox(1));

  /* ─────────────────────────────────────────────────
     ACCORDIONS — GSAP powered
  ───────────────────────────────────────────────── */
  accordionToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const parent = toggle.closest('.pdp__accordion');
      const body = parent.querySelector('.pdp__accordion-body');
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        toggle.setAttribute('aria-expanded', 'false');
        body.style.display = 'none';
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        body.style.display = 'block';
      }
    });
  });

  /* ─────────────────────────────────────────────────
     SIZE SELECTOR & ADD TO BAG
  ───────────────────────────────────────────────── */
  sizeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const originalText = addBtn.textContent;
      addBtn.textContent = 'Added \u2713';
      addBtn.disabled = true;
      addBtn.disabled = true;

      setTimeout(() => {
        addBtn.textContent = originalText;
        addBtn.disabled = false;
      }, 1500);
    });
  }

  console.log('%cRADICAL · Product page GSAP initialized', 'font-family:serif; font-size:14px; color:#1A1A1A; font-weight:bold;');

})();
