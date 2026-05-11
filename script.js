/**
 * RADICAL — Men's Jewellery
 * Unified Performance Engine — Awwwards Edition
 *
 * Stack: GSAP 3.12 (ScrollTrigger + CustomEase) · Lenis · SplitType
 *
 * Note: Framer Motion is React-only. All spring physics here use
 * GSAP CustomEase + elastic curves — identical feel, zero React dep.
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     1. GSAP REGISTRATION + CUSTOM EASES
  ───────────────────────────────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  // Ease aliases — GSAP native / cubic-bezier strings
  const EASE = {
    out_quad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // standard reveals (Phase 2/3)
    emerge:   'expo.out',                               // section entrances
    silk:     'power2.inOut',                           // transitions, swaps
    sharp:    'power3.in',                              // sharp entry
  };

  /* ─────────────────────────────────────────────────────────────
     2. LENIS — SYNCED TO GSAP TICKER (single RAF loop)
  ───────────────────────────────────────────────────────────── */
  const lenis = new Lenis({
    lerp:        0.08,
    smoothWheel: true,
    syncTouch:   false,
    duration:    1.2,
  });

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);

  /* ─────────────────────────────────────────────────────────────
     3. SCROLL PROGRESS BAR
  ───────────────────────────────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    lenis.on('scroll', ({ progress }) => { bar.style.width = `${progress * 100}%`; });
  }

  /* ─────────────────────────────────────────────────────────────
     5. NAVIGATION (native RAF — zero layout thrash)
  ───────────────────────────────────────────────────────────── */
  const nav      = document.getElementById('main-nav');
  const menuBtn  = document.getElementById('nav-menu-btn');
  const closeBtn = document.getElementById('nav-close-btn');
  const backdrop = document.getElementById('nav-backdrop');
  const overlay  = document.getElementById('nav-overlay');
  const searchBtn   = document.getElementById('nav-search-btn');
  const searchStrip = document.getElementById('search-strip');
  const searchScrim = document.getElementById('search-scrim');
  const searchClose = document.getElementById('search-close-btn');
  const searchInput = document.getElementById('search-input');

  let lastScrollY = 0, ticking = false;
  function updateNav() {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 20);
      nav.style.transform = (y > 150 && y > lastScrollY) ? 'translateY(-100%)' : 'translateY(0)';
    }
    lastScrollY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateNav); ticking = true; }
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────────
     6. PAGE ENTRANCE — overlay slides left off screen
  ───────────────────────────────────────────────────────────── */
  function initPageEntrance() {
    const pt = document.getElementById('page-transition');
    if (!pt) return;

    gsap.fromTo(pt,
      { xPercent: 0 },
      {
        xPercent: -100,
        duration: 1.0,
        ease: EASE.silk,
        delay: 0.05,
        onComplete: () => {
          pt.style.pointerEvents = 'none';
          gsap.set(pt, { xPercent: 100 });  // reset to right for next exit
        }
      }
    );
  }

  /* ─────────────────────────────────────────────────────────────
     7. PAGE EXIT — overlay slides in from right, then navigate
  ───────────────────────────────────────────────────────────── */
  function initPageTransition() {
    const pt = document.getElementById('page-transition');
    if (!pt) return;

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href ||
          href.startsWith('http') ||
          href.startsWith('mailto') ||
          href.startsWith('tel') ||
          link.target === '_blank' ||
          (href.startsWith('#') && !href.includes('/'))) return;

      e.preventDefault();
      lenis.stop();
      pt.style.pointerEvents = 'all';

      gsap.fromTo(pt,
        { xPercent: 100 },
        {
          xPercent: 0,
          duration: 0.72,
          ease: EASE.silk,
          onComplete: () => { window.location.href = href; }
        }
      );
    });
  }

  /* ─────────────────────────────────────────────────────────────
     8. PRELOADER (index.html only)
  ───────────────────────────────────────────────────────────── */
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const brand = preloader.querySelector('.preloader__brand');
    const tl = gsap.timeline();

    // Brand wordmark fades in
    if (brand) {
      tl.fromTo(brand,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        0.15
      );
    }

    // Slide the entire panel up and off screen
    tl.to(preloader, {
      yPercent: -100,
      duration: 1.0,
      ease: EASE.silk,
      delay: 0.55,
      onComplete: () => preloader.classList.add('is-done'),
    });
  }

  /* ─────────────────────────────────────────────────────────────
     9. HERO ENTRANCE — SplitType word cascade + Ken Burns
  ───────────────────────────────────────────────────────────── */
  function initHero() {
    const heroContent = document.querySelector('.hero__content, .about-hero__content');
    if (!heroContent) return;

    const tl = gsap.timeline({ delay: 0.15 });

    // Label
    const label = heroContent.querySelector('.hero__label, .about-hero__label');
    if (label) {
      tl.fromTo(label,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        0.1
      );
    }

    // Headline — word-by-word with perspective
    const headline = heroContent.querySelector('.hero__headline, .about-hero__headline');
    if (headline && typeof SplitType !== 'undefined') {
      headline.style.perspective = '600px';
      const split = new SplitType(headline, { types: 'lines,words' });
      gsap.set(split.words, { autoAlpha: 0, yPercent: 110, rotateX: -20 });
      tl.to(split.words, {
        autoAlpha: 1,
        yPercent: 0,
        rotateX: 0,
        duration: 1.2,
        ease: EASE.emerge,
        stagger: { each: 0.065, from: 'start' },
      }, 0.3);
    } else if (headline) {
      tl.fromTo(headline, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE.emerge }, 0.3);
    }

    // Sub / about sub
    const sub = heroContent.querySelector('.about-hero__sub');
    if (sub) tl.fromTo(sub, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.6');

    // CTA
    const cta = heroContent.querySelector('.hero__cta');
    if (cta) tl.fromTo(cta, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.7');

    // Hero image — Ken Burns entrance
    const heroImgCover = document.querySelector('.about-hero__img');
    if (heroImgCover) {
      tl.fromTo(heroImgCover, { scale: 1.14 }, { scale: 1, duration: 2.0, ease: 'power3.out' }, 0);
      gsap.to(heroImgCover, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.about-hero', start: 'top top', end: 'bottom top', scrub: 0.8 }
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     10. SCROLL REVEALS — Awwwards: clip-path + word stagger
  ───────────────────────────────────────────────────────────── */
  function initReveals() {
    // ── All h2/h3 — word reveal ──
    document.querySelectorAll('h2, h3, .campaign__headline, .banner__headline, .about-section__heading, .about-closing__statement').forEach(el => {
      if (el.closest('.hero__content, .about-hero__content')) return;
      if (typeof SplitType === 'undefined') return;

      el.style.perspective = '600px';
      el.style.overflow = 'visible';
      const split = new SplitType(el, { types: 'lines,words' });

      gsap.set(split.words, { autoAlpha: 0, yPercent: 100, rotateX: -18 });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(split.words, {
          autoAlpha: 1, yPercent: 0, rotateX: 0,
          duration: 1.1, ease: EASE.emerge,
          stagger: { each: 0.055, from: 'start' },
        }),
      });
    });

    // ── Philosophy text — line by line ──
    const philText = document.querySelector('.philosophy__text');
    if (philText && typeof SplitType !== 'undefined') {
      const split = new SplitType(philText, { types: 'lines' });
      gsap.set(split.lines, { autoAlpha: 0, y: 28 });
      ScrollTrigger.create({
        trigger: philText, start: 'top 88%', once: true,
        onEnter: () => gsap.to(split.lines, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }),
      });
    }

    // ── Labels / captions ──
    gsap.utils.toArray(
      '.campaign__label, .banner__label, .about-section__label, .editorial__caption, .category__title, .footer__logo'
    ).forEach(el => {
      gsap.set(el, { autoAlpha: 0, y: 24 });
      ScrollTrigger.create({
        trigger: el, start: 'top 91%', once: true,
        onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE.emerge }),
      });
    });

    // ── Body copy paragraphs ──
    gsap.utils.toArray('.campaign__text, .about-section__body, .about-closing__sub, .philosophy__text').forEach(el => {
      if (el.closest('[data-split]')) return;
      gsap.set(el, { autoAlpha: 0, y: 24 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'power3.out' }),
      });
    });

    // ── Staggered grids (editorial + category) ──
    [
      { sel: '#editorial-grid .editorial__item', parent: '#editorial-grid' },
      { sel: '#category-row .category__item',   parent: '#category-row' },
    ].forEach(({ sel, parent }) => {
      const items = gsap.utils.toArray(sel);
      if (!items.length) return;
      gsap.set(items, { autoAlpha: 0, y: 44 });
      ScrollTrigger.create({
        trigger: parent, start: 'top 85%', once: true,
        onEnter: () => gsap.to(items, { autoAlpha: 1, y: 0, duration: 1.0, ease: EASE.emerge, stagger: 0.12 }),
      });
    });

    // ── CTA links ──
    gsap.utils.toArray('.campaign__link, .banner__cta, .about-closing__cta').forEach(el => {
      gsap.set(el, { autoAlpha: 0, y: 20 });
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }),
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     11. IMAGE CLIP-PATH REVEAL (Awwwards signature move)
  ───────────────────────────────────────────────────────────── */
  function initImageReveals() {
    gsap.utils.toArray('.editorial__media, .campaign__media, .banner__media, .about-section__media, .pdp__gallery-item').forEach(wrap => {
      // Clip reveal
      gsap.fromTo(wrap,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.5,
          ease: EASE.silk,
          scrollTrigger: { trigger: wrap, start: 'top 89%', once: true },
        }
      );
    });
  }

  /* ─────────────────────────────────────────────────────────────
     12. IMAGE PARALLAX (drifting internal parallax on all images)
  ───────────────────────────────────────────────────────────── */
  function initParallax() {
    [
      { sel: '.editorial__media',     y: 14 },
      { sel: '.campaign__media',      y: 18 },
      { sel: '.banner__media',        y: 22 },
      { sel: '.about-section__media', y: 16 },
      { sel: '.category__media',      y: 10 },
    ].forEach(({ sel, y }) => {
      document.querySelectorAll(sel).forEach(wrap => {
        const img = wrap.querySelector('img');
        if (!img) return;
        wrap.style.overflow = 'hidden';
        // Start centered (yPercent: 0), drift gently down — no upward crop at entry
        gsap.set(img, { scale: 1.15, yPercent: 0 });
        gsap.to(img, {
          yPercent: y,
          ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     13. MAGNETIC HOVER on CTAs (Framer Motion spring equivalent)
  ───────────────────────────────────────────────────────────── */
  function initMagnetics() {
    document.querySelectorAll('.hero__cta, .campaign__link, .about-closing__cta, .banner__cta').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r  = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  * 0.5)) * 0.36;
        const dy = (e.clientY - (r.top  + r.height * 0.5)) * 0.36;
        gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     14. PRODUCT CARD HOVER — scale-up lift + image zoom
  ───────────────────────────────────────────────────────────── */
  function initProductHover() {
    document.querySelectorAll('.editorial__item, .category__item').forEach(card => {
      const img = card.querySelector('.editorial__img, .category__img');
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -8,    duration: 0.4, ease: 'power2.out' });
        if (img) gsap.to(img, { scale: 1.07, duration: 0.7, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.5)' });
        if (img) gsap.to(img, { scale: 1,    duration: 0.55, ease: 'power2.out' });
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     15. MENU OPEN / CLOSE
  ───────────────────────────────────────────────────────────── */
  let menuOpen = false;

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    overlay && overlay.classList.add('is-open');
    nav && nav.classList.add('is-menu-open');
    document.body.classList.add('menu-open');
    lenis.stop();

    const items = gsap.utils.toArray('.nav-overlay__item');
    gsap.set(items, { autoAlpha: 0, x: -28 });
    gsap.to(items, { autoAlpha: 1, x: 0, duration: 0.75, ease: EASE.emerge, stagger: 0.07, delay: 0.2 });
  }

  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    const items = gsap.utils.toArray('.nav-overlay__item');
    gsap.to(items, {
      autoAlpha: 0, x: -18,
      duration: 0.25, ease: 'power2.in', stagger: 0.03,
      onComplete: () => {
        overlay && overlay.classList.remove('is-open');
        nav && nav.classList.remove('is-menu-open');
        document.body.classList.remove('menu-open');
        lenis.start();
      }
    });
  }

  if (menuBtn)  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  function openSearch() {
    searchStrip && searchStrip.classList.add('is-open');
    searchScrim  && searchScrim.classList.add('is-active');
    lenis.stop();
    setTimeout(() => searchInput && searchInput.focus(), 100);
  }
  function closeSearch() {
    searchStrip && searchStrip.classList.remove('is-open');
    searchScrim  && searchScrim.classList.remove('is-active');
    lenis.start();
  }
  if (searchBtn)   searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);
  if (searchScrim) searchScrim.addEventListener('click', closeSearch);

  /* ─────────────────────────────────────────────────────────────
     16. PRODUCT PAGE (PDP)
  ───────────────────────────────────────────────────────────── */
  function initProductPage() {
    const galleryItems = document.querySelectorAll('.pdp__gallery-item');
    if (!galleryItems.length) return;

    // Gallery entrance stagger
    gsap.set(galleryItems, { autoAlpha: 0, y: 32 });
    gsap.to(galleryItems, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE.emerge, stagger: 0.1, delay: 0.5 });

    // Lightbox
    const lb      = document.getElementById('pdp-lightbox');
    const lbImg   = document.getElementById('pdp-lb-img');
    const lbClose = document.getElementById('pdp-lb-close');
    const lbPrev  = document.getElementById('pdp-lb-prev');
    const lbNext  = document.getElementById('pdp-lb-next');
    const IMGS    = Array.from(document.querySelectorAll('.pdp__gallery-img')).map(i => ({ src: i.src, alt: i.alt }));
    let lbIdx     = 0;

    function openLb(i) {
      lbIdx = i;
      if (lbImg) { lbImg.src = IMGS[i].src; lbImg.alt = IMGS[i].alt; }
      lb && lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lenis.stop();
      if (lbPrev) lbPrev.classList.toggle('is-hidden', lbIdx === 0);
      if (lbNext) lbNext.classList.toggle('is-hidden', lbIdx === IMGS.length - 1);
    }
    function closeLb() {
      lb && lb.classList.remove('is-open');
      document.body.style.overflow = '';
      lenis.start();
    }
    galleryItems.forEach((item, i) => item.addEventListener('click', () => openLb(i)));
    if (lbClose) lbClose.addEventListener('click', closeLb);
    if (lbPrev)  lbPrev.addEventListener('click',  () => { if (lbIdx > 0)                openLb(lbIdx - 1); });
    if (lbNext)  lbNext.addEventListener('click',  () => { if (lbIdx < IMGS.length - 1) openLb(lbIdx + 1); });

    // Accordions
    document.querySelectorAll('.pdp__accordion-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const body   = btn.closest('.pdp__accordion').querySelector('.pdp__accordion-body');
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !isOpen);
        body.style.display = isOpen ? 'none' : 'block';
      });
    });

    // Size selector
    document.querySelectorAll('.pdp__size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pdp__size-btn').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
    });

    // Add to bag
    const addBtn = document.getElementById('pdp-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const orig = addBtn.textContent;
        addBtn.textContent = 'Added ✓';
        addBtn.disabled = true;
        setTimeout(() => { addBtn.textContent = orig; addBtn.disabled = false; }, 1500);
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     17. NAV IMAGE SWAP (Odd Ritual DNA)
  ───────────────────────────────────────────────────────────── */
  function initNavImageSwap() {
    const imgEl = document.getElementById('nav-overlay-img');
    if (!imgEl) return;

    const map = {
      'Shop':             'assets/rings_collection.png',
      'Collections':      'assets/pendants_collection.png',
      'Our Philosophy':   'assets/lifestyle_banner.png',
      'The Steel':        'assets/ring_1_detail.png',
      'Craftsmanship':    'assets/lifestyle_banner.png',
      'Contact':          'assets/pendants_collection.png',
      'Rings':            'assets/rings_collection.png',
      'Pendants':         'assets/pendants_collection.png',
      'Bracelets':        'assets/bracelets_collection.png',
      'Limited Editions': 'assets/limited_1_front.png',
    };

    document.querySelectorAll('.nav-overlay__link, .nav-overlay__sublink').forEach(link => {
      link.addEventListener('mouseenter', () => {
        const key = link.textContent.trim();
        if (!map[key]) return;
        gsap.to(imgEl, {
          autoAlpha: 0, duration: 0.18,
          onComplete: () => { imgEl.src = map[key]; gsap.to(imgEl, { autoAlpha: 1, duration: 0.28 }); }
        });
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     18. ABOUT SECTION REVEALS (directional slide-in)
  ───────────────────────────────────────────────────────────── */
  function initAboutReveals() {
    document.querySelectorAll('.about-reveal--left').forEach(el => {
      gsap.fromTo(el,
        { autoAlpha: 0, x: -64 },
        { autoAlpha: 1, x: 0, duration: 1.2, ease: EASE.emerge,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true } }
      );
    });
    document.querySelectorAll('.about-reveal--right').forEach(el => {
      gsap.fromTo(el,
        { autoAlpha: 0, x: 64 },
        { autoAlpha: 1, x: 0, duration: 1.2, ease: EASE.emerge,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true } }
      );
    });
    document.querySelectorAll('.about-reveal--up, .about-reveal:not(.about-reveal--left):not(.about-reveal--right)').forEach(el => {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 52, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: EASE.emerge,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
      );
    });
  }

  /* ─────────────────────────────────────────────────────────────
     19. FOOTER ACCORDION
  ───────────────────────────────────────────────────────────── */
  function initFooter() {
    document.querySelectorAll('.footer__col-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const col    = btn.closest('.footer__col');
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !isOpen);
        col.classList.toggle('is-open', !isOpen);
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     20. ORCHESTRATION
  ───────────────────────────────────────────────────────────── */
  function init() {
    initPageEntrance();      // ← runs first: slides transition overlay off
    initPreloader();         // homepage only
    initScrollProgress();
    initHero();
    initReveals();
    initImageReveals();
    initParallax();
    initMagnetics();
    initProductHover();
    initProductPage();
    initNavImageSwap();
    initAboutReveals();
    initFooter();
    initPageTransition();    // ← runs last so other click handlers fire first

    setTimeout(() => ScrollTrigger.refresh(), 200);
  }

  if (document.fonts) {
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load', init);
  }

})();
