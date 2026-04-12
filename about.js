/**
 * RADICAL — Men's Jewellery
 * about.js · Phase 25: Philosophy page animations
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────
     1. HERO FADE-IN
     Triggers after body becomes visible (fonts ready).
     Piggybacks on the body opacity transition in script.js.
  ───────────────────────────────────────────────── */
  const heroContent = document.getElementById('about-hero-content');

  function triggerHero() {
    if (!heroContent) return;
    // Small delay so body fade-in completes first (0.5s)
    setTimeout(() => {
      heroContent.classList.add('is-visible');
    }, 550);
  }

  if ('fonts' in document) {
    document.fonts.ready.then(triggerHero);
  } else {
    window.addEventListener('load', triggerHero);
  }


  /* ─────────────────────────────────────────────────
     2. SCROLL-TRIGGERED REVEAL ANIMATIONS
     IntersectionObserver on .about-reveal elements.
     Adds .is-visible which transitions opacity + transform.
  ───────────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.about-reveal');

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);

            // Cleanup will-change after animation settles
            setTimeout(() => {
              entry.target.style.willChange = 'auto';
            }, 900);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.12,
      }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: show everything immediately
    document.querySelectorAll('.about-reveal').forEach((el) => {
      el.classList.add('is-visible');
    });
  }


  /* ─────────────────────────────────────────────────
     3. SECTION IMAGE LOAD HANDLER
     Fades in real images once loaded.
  ───────────────────────────────────────────────── */


  console.log('%cRADICAL \u00B7 Phase 25 Philosophy page initialized', 'font-family:serif; font-size:14px; color:#1A1A1A; font-weight:bold;');

})();
