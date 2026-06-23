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
     FAILSAFE: Force page visible after 4s regardless of what fails
     This is the wired-up implementation of videoSafetyTimeout.
     If GSAP/Lenis/Barba fail to load, the preloader hides and the
     page becomes visible — never stuck on a black screen.
  ───────────────────────────────────────────────────────────── */
  var videoSafetyTimeout = setTimeout(function() {
    var pre = document.getElementById('preloader');
    if (pre && !pre.classList.contains('is-done')) {
      pre.style.display = 'none';
      document.body.classList.add('is-done');
      console.warn('[RADICAL] Preloader failsafe triggered — check library loads');
    }
  }, 4000);

  /* ─────────────────────────────────────────────────────────────
     1. GSAP REGISTRATION + CUSTOM EASES
  ───────────────────────────────────────────────────────────── */

  // Guard: if GSAP failed to load, page must still become visible
  if (typeof gsap === 'undefined') {
    console.warn('[RADICAL] GSAP failed to load — animations disabled');
    var pre = document.getElementById('preloader');
    if (pre) pre.style.display = 'none';
    document.body.classList.add('is-done');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, CustomEase);

  gsap.config({ force3D: true, nullTargetWarn: false, autoSleep: 60 });
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Register Custom Eases
  CustomEase.create('loaderEase', '0.65, 0.01, 0.05, 0.99');
  CustomEase.create('ease-3', '0.65, 0.01, 0.05, 0.99');
  CustomEase.create('ease-2', 'M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1');
  CustomEase.create('ease-1', 'M0,0 C0.15,0 0.15,1 1,1');

  // Ease aliases — GSAP native / cubic-bezier strings
  const EASE = {
    out_quad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // standard reveals (Phase 2/3)
    emerge:   'expo.out',                               // section entrances
    silk:     'power2.inOut',                           // transitions, swaps
    sharp:    'power3.in',                              // sharp entry
    loader:   'loaderEase',                             // exact Odd Ritual animation curve
    ease1:    'ease-1',
    ease2:    'ease-2',
    ease3:    'ease-3',
  };

  // Cleanup registry — document/window listeners registered by page-specific inits
  // are pushed here and flushed on every Barba transition to prevent stacking
  const _cleanup = [];
  let _productTrackRafActive = false;
  let _isBarbaTransition = false;
  let _scrollOverlapMM = null;

  /* ─────────────────────────────────────────────────────────────
     2. LENIS — SYNCED TO GSAP TICKER (single RAF loop)
  ───────────────────────────────────────────────────────────── */
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      lerp:        0.08,
      smoothWheel: true,
      syncTouch:   false,
      duration:    1.2,
    });

    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);
  }

  /* ─────────────────────────────────────────────────────────────
     3. SCROLL PROGRESS BAR
  ───────────────────────────────────────────────────────────── */
  let scrollProgressBar;
  let heroRevealTl;
  let isVideoReady = false;
  let isPreloaderFinished = false;
  // videoSafetyTimeout is wired up at the top of this IIFE as a hard failsafe.

  function checkAndPlayReveal() {
    const preloader = document.getElementById('preloader');
    const isPreloaderActive = preloader && !preloader.classList.contains('is-done') && preloader.style.display !== 'none';
    const readyToReveal = (!isPreloaderActive || isPreloaderFinished);
    if (readyToReveal && heroRevealTl && heroRevealTl.paused()) {
      heroRevealTl.play();
    }
  }
  if (lenis) {
    lenis.on('scroll', ({ progress }) => {
      if (scrollProgressBar) {
        scrollProgressBar.style.width = `${progress * 100}%`;
      }
    });
  }

  function initScrollProgress() {
    scrollProgressBar = document.getElementById('scroll-progress');
  }

  /* ─────────────────────────────────────────────────────────────
     5. NAVIGATION (native RAF — zero layout thrash)
  ───────────────────────────────────────────────────────────── */
  let nav, menuBtn, closeBtn, backdrop, overlay, searchBtn, searchStrip, searchScrim, searchClose, searchInput;
  let lastScrollY = 0, ticking = false;
  let navDarkZoneEl = null; // dark hero/gallery element the nav should show white text over, if any

  function reQueryDOMElements() {
    nav         = document.getElementById('main-nav');
    menuBtn     = document.getElementById('nav-menu-btn');
    closeBtn    = document.getElementById('nav-close-btn');
    backdrop    = document.getElementById('nav-backdrop');
    overlay     = document.getElementById('nav-overlay');
    searchBtn   = document.getElementById('nav-search-btn');
    searchStrip = document.getElementById('search-strip');
    searchScrim = document.getElementById('search-scrim');
    searchClose = document.getElementById('search-close-btn');
    searchInput = document.getElementById('search-input');
    // Re-resolved on every page since Barba swaps .page-content but never the header itself
    navDarkZoneEl = document.querySelector('.hero-slider, .about-hero, .pdp');
  }

  reQueryDOMElements();

  function updateNav() {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 20);
      nav.style.transform = (y > 150 && y > lastScrollY) ? 'translateY(-100%)' : 'translateY(0)';

      // White text while a dark hero/gallery is still behind the nav; charcoal otherwise.
      const overDarkZone = !!navDarkZoneEl && navDarkZoneEl.getBoundingClientRect().bottom > nav.offsetHeight;
      nav.classList.toggle('is-on-dark', overDarkZone);
    }
    lastScrollY = y;
    ticking = false;
  }
  updateNav();
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateNav); ticking = true; }
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────────
     6. PAGE ENTRANCE
  ───────────────────────────────────────────────────────────── */
  function initPageEntrance() {
    // Handled by preloader on initial home load and Barba.js on page transitions.
  }

  /* ─────────────────────────────────────────────────────────────
     7. PAGE TRANSITION (Barba.js SPA)
  ───────────────────────────────────────────────────────────── */
  function initPageTransition() {
    if (typeof barba === 'undefined') return;

    barba.hooks.before((data) => {
      _isBarbaTransition = true;
      heroRevealTl = null;
      document.documentElement.classList.add('is-transitioning');
      if (typeof lenis !== 'undefined') lenis.stop();

      // Lock all links during transition to prevent race conditions
      document.querySelectorAll('a[href]').forEach(function(link) {
        link.style.pointerEvents = 'none';
      });

      // Flush document/window listeners from the outgoing page
      _cleanup.forEach(fn => fn());
      _cleanup.length = 0;
      _productTrackRafActive = false;

      // Kill active tweens and clear ALL GSAP inline styles from the outgoing container.
      // Without clearProps, Barba's cache stores elements frozen at their animation state
      // (opacity:0, transform:translateY(30px) etc.), causing invisible content on revisit.
      if (data.current.container) {
        var outEls = data.current.container.querySelectorAll('*');
        gsap.killTweensOf(outEls);
        gsap.set(outEls, { clearProps: 'all' });
      }

      ScrollTrigger.getAll().forEach(t => t.kill());

      // Close menu overlay if open
      const navWrap = document.getElementById('nav-overlay');
      if (navWrap && navWrap.getAttribute('data-nav') === 'open') {
        navWrap.setAttribute('data-nav', 'closed');
        navWrap.classList.remove('is-open');
        navWrap.style.display = 'none';
        document.body.classList.remove('menu-open');
        const mainHeader = document.getElementById('main-nav');
        if (mainHeader) mainHeader.classList.remove('is-menu-open');
      }
    });

    barba.hooks.after((data) => {
      document.documentElement.classList.remove('is-transitioning');
      window.scrollTo(0, 0);
      reQueryDOMElements();
      updateNav();
      if (typeof lenis !== 'undefined') lenis.start();
      _isBarbaTransition = false;
      if (heroRevealTl && heroRevealTl.paused()) heroRevealTl.play();

      // Restore link pointer-events
      document.querySelectorAll('a[href]').forEach(function(link) {
        link.style.pointerEvents = '';
      });

      // Double-rAF ensures the browser has fully painted and calculated final layout
      // before ScrollTrigger measures element positions. Without this, triggers fire
      // at wrong scroll offsets because the DOM isn't settled yet.
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          ScrollTrigger.refresh(true);
        });
      });
    });

    barba.init({
      preventRunning: true,
      cacheIgnore: true,
      timeout: 10000,
      prevent: ({ el }) => {
        if (!el || !el.href) return false;
        const href = el.getAttribute('href') || '';
        if (el.hostname && el.hostname !== window.location.hostname) return true;
        if (href.startsWith('#')) return true;
        if (el.hash && el.pathname === window.location.pathname) return true;
        if (el.href === window.location.href) return true;
        if (/account|checkout/.test(href)) return true;
        return false;
      },
      views: [
        {
          namespace: 'shop',
          beforeLeave() {
            ScrollTrigger.getAll()
              .filter(function (st) { return st.vars.id && st.vars.id.startsWith('products-'); })
              .forEach(function (st) { st.kill(); });
          },
        },
      ],
      transitions: [
        {
          sync: true,
          leave(data) {
            const scrollY = window.scrollY || window.pageYOffset;
            
            // Fix leaving container at current scroll offset
            gsap.set(data.current.container, {
              position: 'fixed',
              top: -scrollY,
              left: 0,
              width: '100%',
              zIndex: 1
            });

            // Instantly scroll window to 0 (leaving container remains visually stable)
            window.scrollTo(0, 0);
            if (typeof lenis !== 'undefined') {
              lenis.scrollTo(0, { immediate: true });
            }

            return gsap.fromTo(data.current.container,
              { opacity: 1, y: 0 },
              {
                opacity: 0.4,
                y: '20vh',
                duration: 1.0,
                ease: 'ease-3'
              }
            );
          },
          enter(data) {
            // Run initialization immediately on the new container BEFORE it animates into view.
            // This applies all GSAP initial state sets (like yPercent, opacity, clip-path)
            // so the elements are already pre-hidden and won't flash unstyled on screen.
            initNewPage(data.next.namespace);

            let tl = gsap.timeline({
              defaults: {
                duration: 1.0,
                ease: 'ease-3'
              }
            });

            // Enter next container on top of current (at scroll 0)
            gsap.set(data.next.container, {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              zIndex: 2,
              y: '-20vh',
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)'
            });

            tl.to(data.next.container, {
              y: '0vh',
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              clearProps: 'all'
            });

            return tl;
          }
        }
      ]
    });
  }

  /* ─────────────────────────────────────────────────────────────
     8. PRELOADER (index.html only)
  ───────────────────────────────────────────────────────────── */
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    // Check if we arrived via internal site navigation
    const isNavigatingWithinSite = document.referrer && document.referrer.includes(window.location.hostname);
    // Check if this is a page reload
    const navEntries = performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';
    if (isNavigatingWithinSite && !isReload) {
      preloader.style.display = 'none';
      preloader.classList.add('is-done');
      isPreloaderFinished = true;
      return;
    }

    const brand = preloader.querySelector('.preloader__brand');
    const logo  = preloader.querySelector('.preloader__logo');
    const box = preloader.querySelector('.preloader__box');
    const boxBg = preloader.querySelector('.preloader__box-bg');
    const imageWrap = preloader.querySelector('.preloader__image-wrap');
    const boxImg = preloader.querySelector('.preloader__box-img');
    
    const tl = gsap.timeline({
      onStart: () => {
        if (lenis) lenis.stop();
      },
      onComplete: () => {
        if (lenis) lenis.start();
        preloader.classList.add('is-done');
        preloader.style.display = 'none';
        isPreloaderFinished = true;
        checkAndPlayReveal();
      }
    });    // 1. Logo and brand staggered entrance (retaining the exact current animation)
    if (brand) {
      tl.fromTo(brand,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.85 },
        0.2
      );
    }
    if (logo) {
      tl.fromTo(logo,
        { autoAlpha: 0, y: 30, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.85 },
        0.6
      );
    }

    // 2. Box background and image container sweep down from top to bottom (revealing the image, covering the logo)
    // Staggered by 15%, matching Odd Ritual
    const sweepDuration = 1.0;
    
    if (boxBg) {
      tl.fromTo(boxBg,
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: sweepDuration, ease: 'power2.inOut' },
        1.8 // Start after logo animation completes
      );
    }

    if (imageWrap) {
      tl.fromTo(imageWrap,
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: sweepDuration, ease: 'power2.inOut' },
        1.8 // same time as boxBg — image always covers the red
      );
    }

    // 3. Center box collapses down (disappears from top to bottom)
    if (box) {
      tl.to(box, {
        clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
        duration: 1.0,
        ease: 'power3.inOut'
      }, 3.2); // Start after sweep is complete
    }

    // 4. Image inside slides down slightly while collapsing
    if (boxImg) {
      tl.to(boxImg, {
        yPercent: 10,
        duration: 1.0,
        ease: 'power3.inOut'
      }, 3.2);
    }

    // 5. Entire black preloader screen collapses down to reveal the homepage
    tl.to(preloader, {
      clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
      duration: 1.0,
      ease: 'power3.inOut'
    }, 3.2 + 1.0 * 0.3); // '<30%' equivalent of box collapse start
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
        { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power3.out' },
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
        stagger: { each: 0.06, from: 'start' },
      }, 0.3);
    } else if (headline) {
      tl.fromTo(headline, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE.emerge }, 0.3);
    }

    // Sub / about sub
    const sub = heroContent.querySelector('.about-hero__sub');
    if (sub) tl.fromTo(sub, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power3.out' }, '-=0.6');

    // CTA
    const cta = heroContent.querySelector('.hero__cta');
    if (cta) tl.fromTo(cta, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power3.out' }, '-=0.7');

    // Hero image — Ken Burns entrance
    const heroImgCover = document.querySelector('.about-hero__img');
    if (heroImgCover) {
      tl.fromTo(heroImgCover, { scale: 1.14 }, { scale: 1, duration: 1.1, ease: 'power3.out' }, 0);
      gsap.to(heroImgCover, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.about-hero', start: 'top top', end: 'bottom top', scrub: 0.8 }
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     9b. HERO SLIDER (Odd Ritual DNA)
  ───────────────────────────────────────────────────────────── */
  function initHeroSlider() {
    const sliderEl = document.querySelector('.hero-slider');
    if (!sliderEl) return;

    const childItems = sliderEl.querySelectorAll('.hero-slider_item');
    const activeIndicator = sliderEl.querySelector('.is-active-indicator');
    
    if (!childItems.length) return;

    let activeIndex = 0;
    const totalSlides = childItems.length;

    // Initialize states
    childItems.forEach((item, index) => {
      if (index === 0) {
        item.style.display = 'flex';
        item.classList.add('active');
      } else {
        item.style.display = 'none';
        item.classList.remove('active');
      }
    });

    if (activeIndicator) {
      activeIndicator.textContent = '01';
    }

    function moveSlide(nextIndex, forwards) {
      if (nextIndex === activeIndex) return;

      const prevItem = childItems[activeIndex];
      const nextItem = childItems[nextIndex];

      // Reset display states for active and target items
      prevItem.style.display = 'flex';
      nextItem.style.display = 'flex';

      const prevItemImg = prevItem.querySelector('.hero-slide_visual img');
      const nextItemImg = nextItem.querySelector('.hero-slide_visual img');

      let tl = gsap.timeline({
        defaults: { duration: 1.0, ease: 'ease-2' },
        onComplete: () => {
          // Clean up display states after transition
          childItems.forEach((item, idx) => {
            if (idx !== nextIndex) {
              item.style.display = 'none';
              item.classList.remove('active');
            }
          });
          nextItem.classList.add('active');
        }
      });

      if (forwards) {
        tl.fromTo(
          nextItem,
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }
        );
        tl.fromTo(
          prevItem,
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
          { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' },
          '<'
        );
        if (prevItemImg) tl.fromTo(prevItemImg, { yPercent: 0 }, { yPercent: 10 }, '<');
        if (nextItemImg) tl.fromTo(nextItemImg, { yPercent: -10 }, { yPercent: 0 }, '<');
      } else {
        tl.fromTo(
          nextItem,
          { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' },
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }
        );
        tl.fromTo(
          prevItem,
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
          '<'
        );
        if (prevItemImg) tl.fromTo(prevItemImg, { yPercent: 0 }, { yPercent: -10 }, '<');
        if (nextItemImg) tl.fromTo(nextItemImg, { yPercent: 10 }, { yPercent: 0 }, '<');
      }

      activeIndex = nextIndex;

      // Update active indicator with a smooth vertical slide + fade transition
      if (activeIndicator) {
        gsap.to(activeIndicator, {
          yPercent: 100,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            activeIndicator.textContent = '0' + (nextIndex + 1);
            gsap.fromTo(activeIndicator,
              { yPercent: -100, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
          }
        });
      }
    }

    // Bind active indicator cycle click and hover effect
    if (activeIndicator) {
      var onIndicatorClick = function() {
        var nextIndex = activeIndex + 1;
        if (nextIndex >= totalSlides) nextIndex = 0;
        moveSlide(nextIndex, true);
      };
      var onIndicatorEnter = function() {
        document.querySelectorAll('.slide-overlay').forEach(function(ov) { ov.classList.add('darken'); });
      };
      var onIndicatorLeave = function() {
        document.querySelectorAll('.slide-overlay').forEach(function(ov) { ov.classList.remove('darken'); });
      };
      activeIndicator.addEventListener('click', onIndicatorClick);
      activeIndicator.addEventListener('mouseenter', onIndicatorEnter);
      activeIndicator.addEventListener('mouseleave', onIndicatorLeave);
      _cleanup.push(function() {
        activeIndicator.removeEventListener('click', onIndicatorClick);
        activeIndicator.removeEventListener('mouseenter', onIndicatorEnter);
        activeIndicator.removeEventListener('mouseleave', onIndicatorLeave);
      });
    }

    // Touch swipe gestures
    let touchStartX = 0;
    let touchEndX = 0;

    var onSliderTouchStart = function(e) { touchStartX = e.changedTouches[0].screenX; };
    var onSliderTouchEnd = function(e) { touchEndX = e.changedTouches[0].screenX; handleGesture(); };
    sliderEl.addEventListener('touchstart', onSliderTouchStart, { passive: true });
    sliderEl.addEventListener('touchend', onSliderTouchEnd, { passive: true });
    _cleanup.push(function() {
      sliderEl.removeEventListener('touchstart', onSliderTouchStart);
      sliderEl.removeEventListener('touchend', onSliderTouchEnd);
    });

    function handleGesture() {
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 50) {
        if (diffX < 0) {
          // Swipe Left: Next slide
          let nextIndex = activeIndex + 1;
          if (nextIndex >= totalSlides) nextIndex = 0;
          moveSlide(nextIndex, true);
        } else {
          // Swipe Right: Prev slide
          let prevIndex = activeIndex - 1;
          if (prevIndex < 0) prevIndex = totalSlides - 1;
          moveSlide(prevIndex, false);
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────
     SHARED — Masked line reveal (Blæd-style)
     Each line slides up from behind an overflow:hidden mask.
     No opacity fade — the mask does all the visual work.
  ───────────────────────────────────────────────────────────── */
  function applyMaskReveal(el, opts) {
    if (!el || el.dataset.splitDone) return;
    if (typeof SplitType === 'undefined') return;
    el.dataset.splitDone = 'true';

    const o = Object.assign({ dur: 1.0, stagger: 0.1, start: 'top 88%', delay: 0 }, opts);
    const split = new SplitType(el, { types: 'lines' });
    if (!split.lines || !split.lines.length) return;

    split.lines.forEach(line => {
      const mask = document.createElement('div');
      mask.className = 'line-mask';
      line.parentNode.insertBefore(mask, line);
      mask.appendChild(line);
    });

    gsap.set(split.lines, { yPercent: 110 });

    ScrollTrigger.create({
      trigger: el,
      start: o.start,
      once: true,
      onEnter: () => gsap.to(split.lines, {
        yPercent: 0,
        duration: o.dur,
        ease: 'power4.out',
        stagger: o.stagger,
        delay: o.delay,
      }),
    });
  }

  /* ─────────────────────────────────────────────────────────────
     10. SCROLL REVEALS — masked line reveal throughout site
  ───────────────────────────────────────────────────────────── */
  function initReveals() {
    // ── All headings ──
    document.querySelectorAll('h1, h2, h3, h4').forEach(el => {
      if (el.closest('.hero-slider, .hero__content, .about-hero__content, #preloader, .preloader, .nav')) return;
      applyMaskReveal(el, { dur: 1.0, stagger: 0.1 });
    });

    // ── Body copy ──
    document.querySelectorAll([
      '.brand-intro__statement', '.campaign__text', '.banner__text',
      '.about-section__body', '.philosophy__text', '.about-closing__sub',
      '.pdp__description', '.product__description', '.about-closing__statement',
    ].join(', ')).forEach(el => {
      if (el.closest('.hero-slider, .hero__content, .preloader')) return;
      applyMaskReveal(el, { dur: 0.85, stagger: 0.08, start: 'top 90%' });
    });

    // ── Labels / captions ──
    document.querySelectorAll([
      '.campaign__label', '.banner__label', '.about-section__label',
      '.editorial__caption', '.category__title', '.footer__logo',
    ].join(', ')).forEach(el => {
      applyMaskReveal(el, { dur: 0.65, stagger: 0, start: 'top 91%' });
    });

    // ── CTA links ──
    gsap.utils.toArray('.campaign__link, .banner__cta, .about-closing__cta').forEach(el => {
      gsap.set(el, { autoAlpha: 0, y: 18 });
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power4.out' }),
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
        onEnter: () => gsap.to(items, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'power4.out', stagger: 0.1 }),
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     11. IMAGE CLIP-PATH REVEAL (Awwwards signature move)
  ───────────────────────────────────────────────────────────── */
  function initImageReveals() {
    gsap.utils.toArray('.editorial__media, .campaign__media, .banner__media, .about-section__media, .pdp__gallery-item, .manifesto-item-img-wrap').forEach(wrap => {
      // Clip reveal
      gsap.fromTo(wrap,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.6,
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
      { sel: '.about-section__media', y: 16 },
      { sel: '.category__media',      y: 10 },
    ].forEach(({ sel, y }) => {
      document.querySelectorAll(sel).forEach(wrap => {
        const img = wrap.querySelector('img');
        if (!img) return;
        wrap.style.overflow = 'hidden';
        gsap.set(img, { scale: 1.15, yPercent: 0 });
        gsap.to(img, {
          yPercent: y,
          ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
      });
    });

    // ── Manifesto — parallax on image, fade-rise on headline ──
    const manifestoImg = document.querySelector('.manifesto__img');
    if (manifestoImg) {
      gsap.to(manifestoImg, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: '.manifesto__visual',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        },
      });
    }

    const manifestoLines = document.querySelectorAll('.manifesto__line-inner');
    if (manifestoLines.length) {
      // Animate in on scroll — text is ALREADY VISIBLE in CSS (no initial hide),
      // GSAP adds the motion on top. clipPath ensures no layout jump.
      ScrollTrigger.create({
        trigger: '.manifesto__copy',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo(manifestoLines,
            { y: 60, opacity: 0.01 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.15 }
          );
        },
      });
    }

    // ── Full-bleed Lifestyle Visual Parallax ──
    document.querySelectorAll('[data-parallax-visual]').forEach(img => {
      const parent = img.closest('.full-bleed-visual-section');
      if (!parent) return;
      gsap.fromTo(img,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: parent,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    });

    // ── Manifesto Stacked Items Parallax ──
    document.querySelectorAll('[data-parallax-img]').forEach(img => {
      const parent = img.closest('.manifesto-item-img-wrap');
      if (!parent) return;
      parent.style.overflow = 'hidden';
      gsap.set(img, { scale: 1.15 });
      gsap.fromTo(img,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: parent,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    });
  }

  /* ─────────────────────────────────────────────────────────────
     12b. CARD OVERLAP SCROLL TRIGGER (Replication from Odd Ritual)
  ───────────────────────────────────────────────────────────── */
  function initScrollOverlap() {
    // Revert any previous matchMedia context before creating a new one.
    // Without this, every page visit that calls initScrollOverlap adds
    // another persistent media-change listener that recreates ScrollTriggers on resize.
    if (_scrollOverlapMM) { _scrollOverlapMM.revert(); _scrollOverlapMM = null; }
    _scrollOverlapMM = gsap.matchMedia();
    _scrollOverlapMM.add("(min-width: 992px) and (pointer: fine)", () => {
      document.querySelectorAll('[data-scroll-overlap]').forEach(el => {
        gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=500px",
            scrub: true,
          }
        }).to(el, { yPercent: 50, ease: "power1.in" });
      });
    });
    _cleanup.push(function() {
      if (_scrollOverlapMM) { _scrollOverlapMM.revert(); _scrollOverlapMM = null; }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     13. MAGNETIC HOVER on CTAs (Framer Motion spring equivalent)
  ───────────────────────────────────────────────────────────── */
  function initMagnetics() {
    document.querySelectorAll('.hero__cta, .campaign__link, .about-closing__cta, .banner__cta').forEach(function(btn) {
      var onMove = function(e) {
        var r  = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width  * 0.5)) * 0.36;
        var dy = (e.clientY - (r.top  + r.height * 0.5)) * 0.36;
        gsap.to(btn, { x: dx, y: dy, duration: 0.5, ease: 'power2.out' });
      };
      var onLeave = function() {
        gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)' });
      };
      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', onLeave);
      _cleanup.push(function() {
        btn.removeEventListener('mousemove', onMove);
        btn.removeEventListener('mouseleave', onLeave);
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     14. PRODUCT CARD HOVER — scale-up lift + image zoom
  ───────────────────────────────────────────────────────────── */
  function initProductHover() {
    document.querySelectorAll('.editorial__item, .category__item').forEach(function(card) {
      var img = card.querySelector('.editorial__img, .category__img');
      var onEnter = function() {
        gsap.to(card, { y: -8,   duration: 0.5,  ease: 'power2.out' });
        if (img) gsap.to(img, { scale: 1.07, duration: 0.65, ease: 'power2.out' });
      };
      var onLeave = function() {
        gsap.to(card, { y: 0,   duration: 0.65, ease: 'elastic.out(1.2, 0.5)' });
        if (img) gsap.to(img, { scale: 1,    duration: 0.5,  ease: 'power2.out' });
      };
      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      _cleanup.push(function() {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     15. MENU OPEN / CLOSE
  ───────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────
     15. MENU OPEN / CLOSE (Staggered Dropdown Curtain)
  ───────────────────────────────────────────────────────────── */
  function initMenu() {
    const navWrap = document.getElementById('nav-overlay');
    if (!navWrap) return;

    const mainHeader   = document.getElementById('main-nav');
    const bgPanelFull  = navWrap.querySelector('.bg-panel_full');    // bottom image area
    const imgsWrap     = navWrap.querySelector('.menu-img_inner');
    const menuToggles  = document.querySelectorAll('[data-menu-toggle]');
    const menuLinks    = navWrap.querySelectorAll('.menu-link');
    const fadeTargets  = navWrap.querySelectorAll('[data-menu-fade]');

    // Use querySelectorAll to correctly get BOTH .bg-panel elements
    // (querySelector('.bg-panel') would return .bg-panel.first twice since it matches both classes)
    const allBgPanels = Array.from(navWrap.querySelectorAll('.bg-panel'));

    let activeTl = null; // Always create a fresh timeline — never reuse a completed one

    let navImagesPreloaded = false;
    const preloadNavImages = () => {
      if (navImagesPreloaded) return;
      navImagesPreloaded = true;
      // Lazy-load nav hover images on first menu open (removed from display:none HTML block)
      const navImgSrcs = [
        'assets/images/nav-shop.webp',
        'assets/images/home.webp',
        'assets/images/nav-about.webp',
        'assets/images/nav-contact.webp',
      ];
      navImgSrcs.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };

    const openNav = () => {
      preloadNavImages(); // lazy-load hover images on first open
      if (activeTl) activeTl.kill();
      if (lenis) lenis.stop();
      navWrap.setAttribute('data-nav', 'open');
      navWrap.classList.add('is-open');
      if (mainHeader) mainHeader.classList.add('is-menu-open');
      document.body.classList.add('menu-open');

      activeTl = gsap.timeline()
        .set(navWrap,     { display: 'block' })
        .set(allBgPanels, { yPercent: -101 }, 0)
        .set(bgPanelFull, { yPercent: 101  }, 0)
        .set(menuLinks,   { yPercent: 130  }, 0)
        .set(fadeTargets, { autoAlpha: 0, y: 10 }, 0)
        .fromTo(allBgPanels,
          { yPercent: -101 },
          { yPercent: 0, duration: 0.65, ease: 'ease-3', stagger: 0.08 }, 0)
        .fromTo(bgPanelFull,
          { yPercent: 101 },
          { yPercent: 0, duration: 0.65, ease: 'ease-3' }, 0.05)
        .fromTo(imgsWrap,
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.5, ease: 'ease-3' }, 0.35)
        .fromTo(menuLinks,
          { yPercent: 130 },
          { yPercent: 0, duration: 0.65, ease: 'ease-3', stagger: 0.08 }, 0.3)
        .fromTo(fadeTargets,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05 }, 0.55);
    };

    const closeNav = () => {
      if (activeTl) activeTl.kill();
      if (lenis) lenis.start();
      navWrap.setAttribute('data-nav', 'closed');
      document.body.classList.remove('menu-open');

      activeTl = gsap.timeline({
        onComplete: () => {
          gsap.set(navWrap, { display: 'none' });
          navWrap.classList.remove('is-open');
          if (mainHeader) mainHeader.classList.remove('is-menu-open');
        }
      })
        .to(fadeTargets, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' }, 0)
        .to(menuLinks,   { yPercent: -130, duration: 0.5, ease: 'ease-3', stagger: 0.04 }, 0)
        .to(allBgPanels, { yPercent: -101, duration: 0.5, ease: 'ease-3', stagger: 0.07 }, 0.1)
        .to(bgPanelFull, { yPercent: 101,  duration: 0.5, ease: 'ease-3' }, 0.1)
        .to(imgsWrap,    { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', duration: 0.5, ease: 'ease-3' }, 0.1);
    };

    menuToggles.forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const state = navWrap.getAttribute('data-nav');
        if (state === 'open') {
          closeNav();
        } else {
          openNav();
        }
      });
    });

    menuLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeNav();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navWrap.getAttribute('data-nav') === 'open') {
        closeNav();
      }
    });

    // Stagger dim / highlight on hover
    const menuListItems = navWrap.querySelectorAll('.menu-list-item');
    menuListItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        menuListItems.forEach(el => {
          if (el !== item) el.classList.add('inactive');
        });
      });
      item.addEventListener('mouseleave', () => {
        menuListItems.forEach(el => el.classList.remove('inactive'));
      });
    });
  }



  function openSearch() {
    searchStrip && searchStrip.classList.add('is-open');
    searchScrim  && searchScrim.classList.add('is-active');
    if (lenis) lenis.stop();
    setTimeout(() => searchInput && searchInput.focus(), 100);
  }
  function closeSearch() {
    searchStrip && searchStrip.classList.remove('is-open');
    searchScrim  && searchScrim.classList.remove('is-active');
    if (lenis) lenis.start();
  }
  function initSearch() {
    if (searchBtn)   searchBtn.addEventListener('click', openSearch);
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    if (searchScrim) searchScrim.addEventListener('click', closeSearch);
  }

  /* ─────────────────────────────────────────────────────────────
     16. PRODUCT PAGE (PDP)
  ───────────────────────────────────────────────────────────── */
  function initProductPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    let localProduct = null;
    let category = 'rings';
    
    const container = document.querySelector('[data-barba="container"]');
    const namespace = container ? container.getAttribute('data-barba-namespace') : '';
    if (namespace === 'product-bracelet') category = 'bracelets';
    else if (namespace === 'product-pendant') category = 'pendants';

    if (!productId || typeof window.RADICAL_PRODUCTS === 'undefined') {
      setupLightboxTriggers();
      setupSizesAndAddBtn();
      setupAccordions();
      return;
    }

    localProduct = window.RADICAL_PRODUCTS.products.find(p => p.id === productId);
    if (!localProduct) {
      setupLightboxTriggers();
      setupSizesAndAddBtn();
      setupAccordions();
      return;
    }

    category = localProduct.category;

    // Update document title & breadcrumb initially
    document.title = localProduct.name + ' — RADICAL Men\'s Jewellery';
    const breadcrumbSpan = document.querySelector('.pdp__breadcrumb span');
    if (breadcrumbSpan) {
      breadcrumbSpan.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    }

    const baseProducts = window.RADICAL_PRODUCTS.getBaseProducts();
    const baseProduct = baseProducts.find(bp => bp.variants.some(v => v.id === productId));

    function getColorStyle(colorStr) {
      const color = colorStr.toUpperCase().trim();
      if (color === 'BLACK' || color === 'BLACK GEM') return 'background-color: #1A1A1A;';
      if (color === 'SILVER') return 'background-color: #E0E0E0;';
      if (color === 'GOLD') return 'background-color: #D4AF37;';
      if (color === 'BLACK ON BLACK') return 'background-color: #222222; border: 1px dashed #444;';
      if (color === 'BLACK ON SILVER') return 'background: linear-gradient(135deg, #1A1A1A 50%, #E0E0E0 50%);';
      if (color === 'DIAMOND ON SILVER') return 'background: linear-gradient(135deg, #FFFFFF 50%, #E0E0E0 50%);';
      if (color === 'DIAMOND GEM') return 'background-color: #F0F8FF; border: 1px solid #CCC;';
      if (color === 'DIAMOND ON BLACK') return 'background: linear-gradient(135deg, #FFFFFF 50%, #1A1A1A 50%);';
      if (color === 'BLACK WITH DIAMOND') return 'background: linear-gradient(135deg, #1A1A1A 50%, #FFFFFF 50%);';
      if (color === 'SILVER WITH BLACK GEMS') return 'background: linear-gradient(135deg, #E0E0E0 50%, #1A1A1A 50%);';
      if (color === 'SILVER WITH DIAMOND') return 'background: linear-gradient(135deg, #E0E0E0 50%, #FFFFFF 50%);';
      if (color === 'SILVER WITH BLACK STONE') return 'background: linear-gradient(135deg, #E0E0E0 50%, #1A1A1A 50%);';
      return 'background-color: #CCCCCC;';
    }

    async function renderPDPVariant(vId, isFirstLoad) {
      const targetProduct = window.RADICAL_PRODUCTS.products.find(p => p.id === vId);
      if (!targetProduct) return;

      if (!isFirstLoad) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + vId;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }

      document.title = targetProduct.name + " — RADICAL Men's Jewellery";
      const nameEl = document.querySelector('.pdp__name');
      if (nameEl) nameEl.textContent = targetProduct.name;

      const priceEl = document.querySelector('.pdp__price');
      if (priceEl) {
        if (targetProduct.comparePrice) {
          priceEl.innerHTML = `<span class="price-original">&#8377;${targetProduct.comparePrice}</span><span class="price-discounted">&#8377;${targetProduct.price}</span>`;
        } else {
          priceEl.innerHTML = `<span class="price-discounted">&#8377;${targetProduct.price}</span>`;
        }
      }

      const addBtn = document.getElementById('pdp-add-btn');
      if (addBtn) {
        addBtn.dataset.productId = targetProduct.dbId;
      }

      if (container) {
        container.setAttribute('data-product-handle', targetProduct.sku);
      }

      const galleryStack = document.getElementById('pdp-gallery-stack');
      if (galleryStack) {
        let galleryHtml = '';
        const imgsToShow = [targetProduct.images.primary];
        if (targetProduct.images.hover && targetProduct.images.hover !== targetProduct.images.primary) {
          imgsToShow.push(targetProduct.images.hover);
        }
        imgsToShow.forEach((src, idx) => {
          galleryHtml += `
            <div class="pdp__gallery-item" data-index="${idx}" role="button" tabindex="0" aria-label="View product image ${idx + 1} fullscreen">
              <img class="pdp__gallery-img" src="${src}" alt="${targetProduct.name} — Image ${idx + 1}" />
            </div>
          `;
        });
        galleryStack.innerHTML = galleryHtml;

        const newGalleryItems = galleryStack.querySelectorAll('.pdp__gallery-item');
        if (newGalleryItems.length) {
          gsap.set(newGalleryItems, { autoAlpha: 0, y: 32, clipPath: 'inset(100% 0% 0% 0%)' });
          gsap.to(newGalleryItems, {
            autoAlpha: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.2,
            ease: EASE.emerge,
            stagger: 0.1,
            delay: isFirstLoad ? 0.5 : 0.1
          });
        }

        setupLightboxTriggers();
      }

      if (addBtn && typeof window.RADICAL_API !== 'undefined') {
        const API = window.RADICAL_API;
        try {
          const { product } = await API.products.get(targetProduct.sku);
          const descEl = document.querySelector('.pdp__description');
          if (descEl && product.description) {
            descEl.textContent = product.description;
          }

          const variantMap = Object.fromEntries((product.variants || []).map(v => [v.label, v.id]));
          window.pdpActiveVariantMap = variantMap;

          const activeSizeBtn = document.querySelector('.pdp__size-btn[aria-pressed="true"]');
          if (activeSizeBtn) {
            const sizeValue = activeSizeBtn.dataset.size;
            const sizeLabel = targetProduct.category === 'pendants' ? `${sizeValue}` : `Size ${sizeValue}`;
            const vid = variantMap[sizeLabel];
            if (vid) addBtn.dataset.variantId = vid;
          }
        } catch (e) {
          console.error('[RADICAL] Failed to fetch variants:', e);
        }
      }

      const colorButtons = document.querySelectorAll('.pdp__color-btn');
      colorButtons.forEach(btn => {
        if (btn.dataset.id === vId) {
          btn.classList.add('is-selected');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('is-selected');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
      
      const labelSpan = document.querySelector('.pdp__colors-label span');
      if (labelSpan && targetProduct.name.indexOf(' - ') !== -1) {
        labelSpan.textContent = targetProduct.name.split(' - ')[1].trim();
      } else if (labelSpan) {
        labelSpan.textContent = 'Standard';
      }

      // ── Dynamic Details & Materials accordion content ──────────
      let detailsContentEl = null;
      document.querySelectorAll('.pdp__accordion-toggle').forEach(function(toggle) {
        if (toggle.textContent.trim().indexOf('Details') !== -1) {
          detailsContentEl = toggle.closest('.pdp__accordion').querySelector('.pdp__accordion-content');
        }
      });
      if (detailsContentEl) {
        var detailsText = targetProduct.details || 'Material : Brass, Silver plated\nColor : Silver';
        // Normalise \n literals that survived JS string encoding
        detailsText = detailsText.replace(/\\n/g, '\n');
        var lines = detailsText.split('\n');
        var html = '';
        lines.forEach(function(line) {
          var trimmed = line.replace(/\u00a0/g, ' ').trim();
          if (trimmed) {
            html += '<p>' + trimmed + '</p>';
          }
        });
        html += '<p>Hypoallergenic and tarnish-resistant</p>';
        detailsContentEl.innerHTML = html;
        // Refresh max-height if accordion is already open
        var detailsBody = detailsContentEl.closest('.pdp__accordion-body');
        var detailsToggle = detailsContentEl.closest('.pdp__accordion') &&
          detailsContentEl.closest('.pdp__accordion').querySelector('.pdp__accordion-toggle');
        if (detailsBody && detailsToggle && detailsToggle.getAttribute('aria-expanded') === 'true') {
          detailsBody.style.maxHeight = detailsBody.scrollHeight + 'px';
        }
      }
    }

    function setupLightboxTriggers() {
      const galleryItems = document.querySelectorAll('.pdp__gallery-item');
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
        if (lenis) lenis.stop();
        if (lbPrev) lbPrev.classList.toggle('is-hidden', lbIdx === 0);
        if (lbNext) lbNext.classList.toggle('is-hidden', lbIdx === IMGS.length - 1);
      }
      function closeLb() {
        lb && lb.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
      }

      galleryItems.forEach((item, i) => item.addEventListener('click', () => openLb(i)));
      
      if (lbClose) {
        const newLbClose = lbClose.cloneNode(true);
        lbClose.parentNode.replaceChild(newLbClose, lbClose);
        newLbClose.addEventListener('click', closeLb);
      }
      if (lbPrev) {
        const newLbPrev = lbPrev.cloneNode(true);
        lbPrev.parentNode.replaceChild(newLbPrev, lbPrev);
        newLbPrev.addEventListener('click', () => { if (lbIdx > 0) openLb(lbIdx - 1); });
      }
      if (lbNext) {
        const newLbNext = lbNext.cloneNode(true);
        lbNext.parentNode.replaceChild(newLbNext, lbNext);
        newLbNext.addEventListener('click', () => { if (lbIdx < IMGS.length - 1) openLb(lbIdx + 1); });
      }
    }

    }

    function setupSizesAndAddBtn() {
      document.querySelectorAll('.pdp__size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.pdp__size-btn').forEach(b => {
            b.setAttribute('aria-pressed', 'false');
            b.classList.remove('is-selected');
          });
          btn.setAttribute('aria-pressed', 'true');
          btn.classList.add('is-selected');
          
          const sizeValue = btn.dataset.size;
          const sizeLabel = category === 'pendants' ? `${sizeValue}` : `Size ${sizeValue}`;
          const vid = window.pdpActiveVariantMap ? window.pdpActiveVariantMap[sizeLabel] : null;
          const addBtn = document.getElementById('pdp-add-btn');
          if (vid && addBtn) {
            addBtn.dataset.variantId = vid;
          }
        });
      });
      // Note: The actual add-to-bag click + API call is handled by store.js via
      // event delegation on document.body — do NOT add a duplicate handler here.
    }

    function setupAccordions() {
      document.querySelectorAll('.pdp__accordion-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const body   = btn.closest('.pdp__accordion').querySelector('.pdp__accordion-body');
          const isOpen = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', !isOpen);
          if (isOpen) {
            body.style.maxHeight = '0';
          } else {
            body.style.maxHeight = body.scrollHeight + 'px';
          }
        });
      });
    }

    renderPDPVariant(productId, true);

    if (baseProduct && baseProduct.variants.length > 1) {
      let colorSelector = document.getElementById('pdp-color-selector');
      if (!colorSelector) {
        const sizesEl = document.querySelector('.pdp__sizes');
        if (sizesEl) {
          colorSelector = document.createElement('div');
          colorSelector.id = 'pdp-color-selector';
          colorSelector.className = 'pdp__colors';
          sizesEl.parentNode.insertBefore(colorSelector, sizesEl);
        }
      }

      if (colorSelector) {
        const currentVariantColor = localProduct.name.indexOf(' - ') !== -1 
          ? localProduct.name.split(' - ')[1].trim() 
          : 'Standard';
        
        let colorHtml = `
          <p class="pdp__colors-label">Color: <span>${currentVariantColor}</span></p>
          <div class="pdp__colors-row">
        `;
        baseProduct.variants.forEach(variant => {
          const isSel = variant.id === localProduct.id;
          const bgStyle = getColorStyle(variant.color);
          colorHtml += `
            <button class="pdp__color-btn ${isSel ? 'is-selected' : ''}" 
              data-id="${variant.id}" 
              data-color="${variant.color}" 
              aria-pressed="${isSel ? 'true' : 'false'}" 
              aria-label="Select color ${variant.color}" 
              style="${bgStyle}"></button>
          `;
        });
        colorHtml += `</div>`;
        colorSelector.innerHTML = colorHtml;

        colorSelector.querySelectorAll('.pdp__color-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const targetId = btn.dataset.id;
            renderPDPVariant(targetId, false);
          });
        });
      }
    }

    setupSizesAndAddBtn();
    setupAccordions();
  }

  /* ─────────────────────────────────────────────────────────────
     17. NAV IMAGE SWAP (Odd Ritual DNA)
  ───────────────────────────────────────────────────────────── */
  function initMenuImageSwap() {
    const navWrap = document.getElementById('nav-overlay');
    if (!navWrap) return;

    const hoverContainer = navWrap.querySelector('[img-hover_triggers-wrap]');
    const hoverTriggers = navWrap.querySelectorAll('[img-hover_trigger]');
    const targetWrapper = navWrap.querySelector('[target-img_wrap]');

    if (!hoverContainer || !targetWrapper || !hoverTriggers.length) return;

    // Matches the menu-link order: OUR SHOP, HOME, ABOUT US, CONTACT.
    // Previously sourced from a hidden <img class="target-imgs_hidden"> block
    // in index.html that was removed when nav images moved to JS-driven lazy
    // preload (preloadNavImages in initMenu) — that block was never replaced,
    // so this list is now the single source of truth.
    const mediaUrls = [
      'assets/images/nav-shop.webp',
      'assets/images/home.webp',
      'assets/images/nav-about.webp',
      'assets/images/nav-contact.webp',
    ];

    // Mouse enter container: wipe open targetWrapper
    hoverContainer.addEventListener('mouseenter', () => {
      gsap.fromTo(targetWrapper,
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.65, ease: 'expo.inOut' }
      );
    });

    // Mouse leave container: wipe close targetWrapper and clear DOM on complete
    hoverContainer.addEventListener('mouseleave', () => {
      gsap.to(targetWrapper, {
        clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
        duration: 0.65,
        ease: 'expo.inOut',
        onComplete: () => {
          targetWrapper.innerHTML = '';
          currentSrc = null;
        }
      });
    });

    let currentSrc = null;

    hoverTriggers.forEach((trigger, index) => {
      trigger.addEventListener('mouseenter', () => {
        const imageUrl = mediaUrls[index];
        if (!imageUrl || imageUrl === currentSrc) return;

        currentSrc = imageUrl;

        // Find the previous active slide
        const prevSlide = targetWrapper.querySelector('.menu-img_slide.is-active');

        // Create new active slide container and image
        const nextSlide = document.createElement('div');
        nextSlide.className = 'menu-img_slide is-active';
        const nextImg = document.createElement('img');
        nextImg.src = imageUrl;

        nextSlide.appendChild(nextImg);
        targetWrapper.appendChild(nextSlide);

        if (prevSlide) {
          prevSlide.classList.remove('is-active');
          const prevImg = prevSlide.querySelector('img');

          // Smooth double-parallax slide transition:
          // New slide slides down from top (yPercent: -100 -> 0)
          gsap.fromTo(nextSlide,
            { yPercent: -100 },
            { yPercent: 0, duration: 0.65, ease: 'power3.inOut' }
          );
          // New image inside slides up from bottom (yPercent: 70 -> 0)
          gsap.fromTo(nextImg,
            { yPercent: 70 },
            { yPercent: 0, duration: 0.65, ease: 'power3.inOut' }
          );

          // Old slide slides down out of view (yPercent: 0 -> 100)
          gsap.fromTo(prevSlide,
            { yPercent: 0 },
            { 
              yPercent: 100, 
              duration: 0.65, 
              ease: 'power3.inOut',
              onComplete: () => prevSlide.remove() // remove old slide from DOM
            }
          );
          // Old image inside slides up (yPercent: 0 -> -70)
          if (prevImg) {
            gsap.fromTo(prevImg,
              { yPercent: 0 },
              { yPercent: -70, duration: 0.65, ease: 'power3.inOut' }
            );
          }
        } else {
          // First hover: just set positions instantly
          gsap.set(nextSlide, { yPercent: 0 });
          gsap.set(nextImg, { yPercent: 0 });
        }
      });
    });
  }


  /* ─────────────────────────────────────────────────────────────
     18. PRODUCT TRACK — infinite auto-scroll + drag + hover parallax
  ───────────────────────────────────────────────────────────── */
  function initProductTrack() {
    const outer = document.getElementById('product-track-outer');
    const inner = document.getElementById('product-track-inner');
    if (!inner || !outer) return;

    inner.innerHTML = '';

    if (typeof window.RADICAL_PRODUCTS !== 'undefined') {
      const baseProducts = window.RADICAL_PRODUCTS.getBaseProducts();
      const rings = baseProducts.filter(p => p.category === 'rings');
      const bracelets = baseProducts.filter(p => p.category === 'bracelets');
      const pendants = baseProducts.filter(p => p.category === 'pendants');

      const maxLength = Math.max(rings.length, pendants.length);
      const alternating = [];
      for (let i = 0; i < maxLength; i++) {
        if (i < rings.length) alternating.push(rings[i]);
        if (bracelets.length > 0) {
          alternating.push(bracelets[i % bracelets.length]);
        }
        if (i < pendants.length) alternating.push(pendants[i]);
      }

      let trackHtml = '';
      alternating.forEach(product => {
        trackHtml += `
          <div class="product-track__item">
            <div class="product-track__img-wrap">
              <img src="${product.images.primary}" alt="${product.name}" class="product-track__img" loading="lazy" />
              <img src="${product.images.hover || product.images.primary}" alt="${product.name} — detail" class="product-track__img-hover" aria-hidden="true" data-hover-src="${product.images.hover || product.images.primary}" loading="lazy" />
            </div>
            <a href="${product.url}" class="product-track__link">
              <div class="product-track__info">
                <div class="product-track__text">
                  <div class="product-track__name">${product.name}</div>
                  <p class="product-track__sku">(${product.id})</p>
                </div>
                <div class="product-track__price-row">
                  <span class="product-track__price">₹${product.price}</span>
                  <div class="product-track__arrow-wrap">
                    <svg class="product-track__arrow-svg" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5.99805 1.00049L11.6549 6.65734M11.6549 6.65734H0.341193M11.6549 6.65734L5.99805 12.3142" stroke="currentColor"/></svg>
                    <svg class="product-track__arrow-svg is-2" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5.99805 1.00049L11.6549 6.65734M11.6549 6.65734H0.341193M11.6549 6.65734L5.99805 12.3142" stroke="currentColor"/></svg>
                  </div>
                </div>
              </div>
            </a>
          </div>
        `;
      });
      inner.innerHTML = trackHtml;
    }

    // Clone items for seamless infinite loop
    const originals = Array.from(inner.querySelectorAll('.product-track__item'));
    originals.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      inner.appendChild(clone);
    });

    let halfW = 0;
    const _measure = () => { halfW = inner.scrollWidth / 2; };
    requestAnimationFrame(_measure);
    window.addEventListener('resize', _measure, { passive: true });

    // Lerped scroll: targetX = logical destination, renderX = smoothed output
    let targetX  = 0;
    let renderX  = 0;
    let isDragging = false;
    let dragged    = false;
    let dragStartX = 0;
    let dragBase   = 0;

    const AUTO_SPEED = 0.45;  // px/frame (~27px/s at 60fps — slow, premium feel)
    const DRAG_LERP  = 0.055; // heavy, weighted drag — track lags behind cursor (mouse only)
    const TOUCH_LERP = 1;     // touch must track the finger 1:1 — any lag reads as "broken" on mobile
    const IDLE_LERP  = 0.08;  // smoothing factor during auto-scroll

    let activeDragLerp = DRAG_LERP;

    function getWrapped(x) {
      if (halfW <= 0) return x;
      return ((x % halfW) + halfW) % halfW - halfW;
    }

    _productTrackRafActive = true;

    function frame() {
      if (!_productTrackRafActive) return; // stop loop when page transitions away
      requestAnimationFrame(frame);
      if (halfW <= 0) return;

      if (!isDragging) {
        targetX -= AUTO_SPEED;
      }

      const lerpFactor = isDragging ? activeDragLerp : IDLE_LERP;
      renderX += (targetX - renderX) * lerpFactor;

      // Periodic normalization to prevent floating-point drift after long sessions
      if (halfW > 0 && Math.abs(renderX) > halfW * 200) {
        const w = getWrapped(renderX);
        const diff = w - renderX;
        renderX = w;
        targetX += diff;
      }

      inner.style.transform = 'translate3d(' + getWrapped(renderX) + 'px,0,0)';
    }
    requestAnimationFrame(frame);

    // Mouse drag — smooth lerp following, no momentum on release
    outer.addEventListener('mousedown', e => {
      isDragging = true;
      dragged    = false;
      dragStartX = e.clientX;
      dragBase   = renderX;
      activeDragLerp = DRAG_LERP;
      outer.classList.add('is-dragging');
    });

    const _trackMoveHandler = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 4) dragged = true;
      targetX = dragBase + dx;
    };
    document.addEventListener('mousemove', _trackMoveHandler);

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      targetX = renderX; // freeze — no coasting, no momentum
      outer.classList.remove('is-dragging');
    }
    document.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);

    // Register cleanup so Barba can remove these on page transition
    _cleanup.push(
      () => document.removeEventListener('mousemove', _trackMoveHandler),
      () => document.removeEventListener('mouseup', endDrag),
      () => window.removeEventListener('blur', endDrag),
      () => window.removeEventListener('resize', _measure)
    );

    // Suppress link clicks that were drag gestures
    inner.addEventListener('click', e => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // Touch
    let ts = 0, txBase = 0;

    outer.addEventListener('touchstart', e => {
      isDragging = true;
      dragged    = false;
      ts     = e.touches[0].clientX;
      txBase = renderX;
      activeDragLerp = TOUCH_LERP;
    }, { passive: true });

    outer.addEventListener('touchmove', e => {
      const cx = e.touches[0].clientX;
      const dx = cx - ts;
      if (Math.abs(dx) > 4) dragged = true;
      targetX = txBase + dx;
    }, { passive: true });

    outer.addEventListener('touchend', () => {
      isDragging = false;
      targetX = renderX;
    });

    // Scroll-entrance reveals
    const label = document.querySelector('.product-track-section__label');
    const cta   = document.querySelector('.product-track-section__cta');
    if (label) {
      gsap.set(label, { autoAlpha: 0, y: 12 });
      ScrollTrigger.create({ trigger: label, start: 'top 90%', once: true,
        onEnter: () => gsap.to(label, { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out' }) });
    }
    if (cta) {
      gsap.set(cta, { autoAlpha: 0, y: 12 });
      ScrollTrigger.create({ trigger: cta, start: 'top 95%', once: true,
        onEnter: () => gsap.to(cta, { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out' }) });
    }

    // Brand intro entrance
    const logocol   = document.querySelector('.brand-intro__logo-col');
    const statement = document.querySelector('.brand-intro__statement');
    if (logocol) {
      gsap.set(logocol, { autoAlpha: 0, x: -40 });
      ScrollTrigger.create({ trigger: logocol, start: 'top 88%', once: true,
        onEnter: () => gsap.to(logocol, { autoAlpha: 1, x: 0, duration: 1.0, ease: 'expo.out' }) });
    }
    if (statement) {
      gsap.set(statement, { autoAlpha: 0, y: 30 });
      ScrollTrigger.create({ trigger: statement, start: 'top 88%', once: true,
        onEnter: () => gsap.to(statement, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'expo.out', delay: 0.2 }) });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     18a. HELPER: FADE IN VIDEO ONCE READY (PREVENTS FIRST-FRAME FLASH)
  ───────────────────────────────────────────────────────────── */
  function enableFadeInOnPlay(videoEl) {
    if (!videoEl) return;

    // Set parent wrapper background to poster if available — shown while video buffers
    const poster = videoEl.getAttribute('poster');
    if (poster) {
      const wrapper = videoEl.parentElement;
      if (wrapper) {
        wrapper.style.backgroundImage = `url('${poster}')`;
        wrapper.style.backgroundSize = 'cover';
        wrapper.style.backgroundPosition = 'center';
      }
    }

    let shown = false;
    const showVideo = () => {
      if (shown) return;
      shown = true;
      try {
        videoEl.style.opacity = '1';
        videoEl.removeEventListener('canplay', showVideo);
        videoEl.removeEventListener('playing', showVideo);
        videoEl.removeEventListener('loadeddata', showVideo);
        videoEl.removeEventListener('timeupdate', showVideo);
      } catch (e) {}
    };

    // Show as soon as the browser has enough data to play
    videoEl.addEventListener('canplay', showVideo, { passive: true, once: true });
    videoEl.addEventListener('playing', showVideo, { passive: true, once: true });
    videoEl.addEventListener('loadeddata', showVideo, { passive: true, once: true });
    videoEl.addEventListener('timeupdate', showVideo, { passive: true, once: true });

    // Already ready right now
    if (videoEl.readyState >= 3) showVideo();

    // Absolute safety fallback — force-show after 3 seconds no matter what
    setTimeout(showVideo, 3000);
  }

  /* ─────────────────────────────────────────────────────────────
     18b. BACKGROUND VIDEOS (HERO & LIFESTYLE)
  ───────────────────────────────────────────────────────────── */
  function initHeroVideo() {
    // 1. Hero background video — streamed natively from its <source> in the
    // markup (no blob preload). The browser handles HTTP range requests for
    // progressive playback, which is what makes this work reliably on a CDN.
    const heroVideo = document.querySelector('.hero-bg-video');
    if (heroVideo) {
      enableFadeInOnPlay(heroVideo);

      let isIntersecting = true; // default true for hero section at top of page
      const tryPlayHero = () => {
        if (isIntersecting) {
          heroVideo.play().catch(() => {});
        }
      };

      // Skip the first 2 seconds of intro footage once duration is known
      let heroIntroSkipped = false;
      const skipHeroIntro = () => {
        if (heroIntroSkipped) return;
        if (heroVideo.duration && heroVideo.duration > 2.5) {
          heroVideo.currentTime = 2;
        }
        heroIntroSkipped = true;
      };
      heroVideo.addEventListener('loadedmetadata', skipHeroIntro);
      if (heroVideo.readyState >= 1) skipHeroIntro();

      heroVideo.addEventListener('canplay', tryPlayHero);
      heroVideo.addEventListener('canplaythrough', tryPlayHero);
      heroVideo.addEventListener('loadedmetadata', tryPlayHero);

      const heroSection = document.getElementById('hero');
      if (heroSection && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            isIntersecting = entry.isIntersecting;
            if (isIntersecting) {
              heroVideo.play().catch(() => {});
            } else {
              heroVideo.pause();
            }
          });
        });
        observer.observe(heroSection);
        _cleanup.push(() => {
          observer.disconnect();
          heroVideo.removeEventListener('canplay', tryPlayHero);
          heroVideo.removeEventListener('canplaythrough', tryPlayHero);
          heroVideo.removeEventListener('loadedmetadata', tryPlayHero);
          heroVideo.removeEventListener('loadedmetadata', skipHeroIntro);
        });
      }

      // Immediate autoplay attempt
      tryPlayHero();
    }

    // 2. Full-bleed lifestyle video — lazy: inject <source> and play only when
    //    the section is within ~1 viewport of scrolling into view.
    const fbSection = document.getElementById('full-bleed-visual');
    const fbVideo   = fbSection && fbSection.querySelector('.full-bleed-bg-video');
    if (fbVideo && 'IntersectionObserver' in window) {
      let fbLoaded = false;

      const loadAndPlayFb = () => {
        if (!fbLoaded) {
          fbLoaded = true;
          // Inject mobile/desktop source
          const isMobile = window.innerWidth <= 768;
          const src = isMobile ? 'assets/video/full-bleed-mobile.mp4' : 'assets/video/full-bleed-desktop.mp4';
          const source = document.createElement('source');
          source.src  = src;
          source.type = 'video/mp4';
          fbVideo.appendChild(source);
          fbVideo.load();
          enableFadeInOnPlay(fbVideo);
        }
        fbVideo.play().catch(() => {});
      };

      const fbObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadAndPlayFb();
          } else {
            fbVideo.pause();
          }
        });
      }, { rootMargin: '100% 0px' }); // trigger 1 viewport before section reaches view

      fbObserver.observe(fbSection);
      _cleanup.push(() => fbObserver.disconnect());
    }
  }


  /* ─────────────────────────────────────────────────────────────
     18c. HERO STRIP REVEAL (Blæd-style)
     5 horizontal strips each hold a live clone of the hero video,
     pre-offset so each strip shows the wrong portion of the frame —
     the image looks fragmented. All strips race to y:0 simultaneously,
     assembling the correct frame, then dissolve to hand off to the
     underlying hero video.
  ───────────────────────────────────────────────────────────── */
  function initHeroTileReveal() {
    const stripsEl = document.getElementById('hero-strips');
    if (!stripsEl) return;

    if (_isBarbaTransition) {
      stripsEl.style.opacity = '0';
    }

    const preloader = document.getElementById('preloader');
    const isPreloaderActive = preloader && !preloader.classList.contains('is-done') && preloader.style.display !== 'none';
    const shouldPause = isPreloaderActive || _isBarbaTransition;

    // Grab hero video + overlay BEFORE building strips so we can
    // pre-show the video (poster covers it while buffering) and
    // hide the overlay for the crossfade.
    const heroVideo   = document.querySelector('.hero-bg-video');
    const mainOverlay = document.querySelector('.hero-video-overlay');

    // Force video to opacity:1 immediately — its poster image is visible
    // while the video buffers, which exactly matches the strip poster image.
    // This prevents any black gap when strips dissolve.
    if (heroVideo) heroVideo.style.opacity = '1';
    if (mainOverlay) gsap.set(mainOverlay, { opacity: 0 });

    // Build 5 video strips — each a clone of the same hero video, sharing
    // the browser's HTTP cache so there's effectively one network fetch.
    const stripVideoSrc = window.HERO_VIDEO_SRC || 'assets/video/hero-desktop.mp4';
    let html = '';
    for (let i = 0; i < 5; i++) {
      html += `<div class="hstrip"><video class="hstrip__vid" autoplay muted loop playsinline preload="auto" poster="assets/hero_poster.webp"><source src="${stripVideoSrc}" type="video/mp4"></video></div>`;
    }
    stripsEl.innerHTML = html;

    const strips = gsap.utils.toArray('.hstrip__vid');
    if (!strips.length) return;

    strips.forEach((v) => {
      enableFadeInOnPlay(v);

      // Skip the first 2 seconds so strips assemble into the same frame
      // the main hero video starts on
      const skipStripIntro = () => {
        if (v.duration && v.duration > 2.5) v.currentTime = 2;
      };
      v.addEventListener('loadedmetadata', skipStripIntro, { once: true });
      if (v.readyState >= 1) skipStripIntro();

      v.play().catch(() => {});
    });

    const sh = window.innerHeight * 0.2;
    const offsets = [-3 * sh, -sh, 2 * sh, -sh, 3 * sh];
    strips.forEach((s, i) => gsap.set(s, { y: offsets[i] }));

    heroRevealTl = gsap.timeline({
      paused: shouldPause,
      onStart: () => {
        stripsEl.style.opacity = '1';
        gsap.set(strips, { willChange: 'transform, opacity' });
      },
      onComplete: () => {
        gsap.set(strips, { clearProps: 'willChange' });
      },
    });
    if (!shouldPause) heroRevealTl.delay(0.1);

    // ── Phase 1: strips slide to y:0 — video assembles into the correct frame ────
    heroRevealTl.to(strips, {
      y: 0,
      duration: 0.85,
      ease: 'expo.out',
      stagger: 0.035,
    });

    // ── Phase 2: true crossfade — strips dissolve + overlay fades in simultaneously ──
    // No +=pause. Starts the frame the last strip lands.
    // '<' on the overlay tween means both run at the same time: seamless.
    heroRevealTl.to(stripsEl, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => { stripsEl.remove(); },
    });

    if (mainOverlay) {
      heroRevealTl.to(mainOverlay, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.inOut',
      }, '<'); // simultaneous with strip dissolve — true crossfade
    }

    const readyToReveal = (!isPreloaderActive || isPreloaderFinished) && !_isBarbaTransition;
    if (readyToReveal && heroRevealTl && heroRevealTl.paused()) {
      heroRevealTl.play();
    }
  }

  /* ─────────────────────────────────────────────────────────────
     19. ABOUT SECTION REVEALS
     Images: directional slide. Text: same masked line reveal.
  ───────────────────────────────────────────────────────────── */
  function initAboutReveals() {
    document.querySelectorAll('.about-reveal').forEach(el => {
      // Text elements use the shared mask reveal (already handled by initReveals
      // for headings/body, but catch any remaining about-specific text wrappers)
      const isMedia = el.classList.contains('about-section__media') || el.querySelector('img, video');
      if (!isMedia) {
        applyMaskReveal(el, { dur: 1.0, stagger: 0.08 });
        return;
      }

      // Images / media: keep directional slide
      const fromLeft  = el.classList.contains('about-reveal--left');
      const fromRight = el.classList.contains('about-reveal--right');
      gsap.fromTo(el,
        { autoAlpha: 0, x: fromLeft ? -64 : fromRight ? 64 : 0, y: (!fromLeft && !fromRight) ? 52 : 0, scale: (!fromLeft && !fromRight) ? 0.97 : 1 },
        { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 1.2, ease: EASE.emerge,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true } }
      );
    });
  }

  /* ─────────────────────────────────────────────────────────────
     19. FOOTER ACCORDION
  ───────────────────────────────────────────────────────────── */
  function initFooter() {
    const signupForm = document.getElementById('footer-signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('footer-signup-email');
        const nameInput = document.getElementById('footer-signup-name');
        const phoneInput = document.getElementById('footer-signup-phone');
        if (!emailInput || !nameInput || !phoneInput) return;

        const email = emailInput.value;
        const name = nameInput.value;
        const phone = phoneInput.value;

        // Visual feedback transition
        const col = signupForm.parentElement;
        gsap.to(signupForm, {
          opacity: 0,
          y: -10,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            signupForm.style.display = 'none';

            const successMsg = document.createElement('div');
            successMsg.className = 'footer-signup-success';
            successMsg.style.fontFamily = 'var(--font-ui)';
            successMsg.style.fontSize = '11px';
            successMsg.style.letterSpacing = '2px';
            successMsg.style.fontWeight = '700';
            successMsg.style.lineHeight = '1.8';
            successMsg.style.color = 'var(--color-text)';
            successMsg.style.textTransform = 'uppercase';
            successMsg.innerHTML = `THANK YOU, ${name.split(' ')[0]}<br>WELCOME TO THE CLUB.`;

            col.appendChild(successMsg);

            gsap.fromTo(successMsg,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }
            );
          }
        });
      });
    }

    // Keep accordion support for old footer layouts during transition
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
     19. SHOP PAGE — collection grid, card hovers, scroll anims
  ───────────────────────────────────────────────────────────── */
  function initProductCardHovers(root) {
    var scope = root || document;
    var cards = scope.querySelectorAll('.product-card');
    if (!cards.length) return;

    var handlers = [];

    cards.forEach(function (card) {
      var wrap = card.querySelector('.product-card__image-wrap');
      if (!wrap) return;

      function onEnter() {
        wrap.style.willChange = 'transform';
        gsap.to(wrap, { scale: 1.03, duration: 0.55, ease: 'power2.out' });
      }

      function onLeave() {
        gsap.to(wrap, {
          scale: 1, duration: 0.45, ease: 'power2.inOut',
          onComplete: function () { wrap.style.willChange = 'auto'; },
        });
      }

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      handlers.push({ card: card, onEnter: onEnter, onLeave: onLeave });
    });

    _cleanup.push(function () {
      handlers.forEach(function (h) {
        h.card.removeEventListener('mouseenter', h.onEnter);
        h.card.removeEventListener('mouseleave', h.onLeave);
      });
    });
  }

  function initShopScrollAnimations() {
    var cards = gsap.utils.toArray('.products-grid .product-card, .featured-products__grid .product-card');
    if (!cards.length) return;

    if (window.innerWidth < 992) {
      // On mobile, bypass scroll animations to prevent layout shifts and keep cards visible immediately
      gsap.set(cards, { y: 0, opacity: 1 });
      return;
    }

    gsap.set(cards, { y: 24, opacity: 0 });

    ScrollTrigger.batch(cards, {
      id: 'products-batch',
      interval: 0.06,
      batchMax: 3,
      onEnter: function (batch) {
        gsap.to(batch, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.08 });
      },
      // No onLeaveBack: cards stay visible once revealed. Fading them back out on
      // scroll-up was causing them to flicker/vanish on mobile, where viewport-height
      // jitter (address bar show/hide) shifts trigger marks mid-scroll.
      start: 'top 92%',
    });
  }

  function initShopFilters() {
    var buttons = document.querySelectorAll('.filter-pill');
    var grid = document.getElementById('products-grid');
    if (!buttons.length || !grid) return;

    buttons.forEach(function (btn) {
      var onClick = function () {
        buttons.forEach(function (b) {
          b.classList.remove('filter-pill--active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('filter-pill--active');
        btn.setAttribute('aria-pressed', 'true');

        var filter = btn.dataset.filter;
        
        // Kill existing scroll triggers for products to prevent leaks
        ScrollTrigger.getAll()
          .filter(function (st) { return st.vars.id && st.vars.id.startsWith('products-'); })
          .forEach(function (st) { st.kill(); });
          
        // Render filtered grid
        RADICAL_PRODUCTS.renderGrid(grid, filter);
        
        // Re-initialize hovers and animations
        initProductCardHovers(grid.closest('.shop-page'));
        initShopScrollAnimations();
        
        // Update product count label
        var baseList = RADICAL_PRODUCTS.getBaseProducts();
        var filteredCount = filter === 'all'
          ? baseList.length
          : baseList.filter(function(p) { return p.category === filter; }).length;
        var countStr = String(filteredCount).padStart(2, '0') + ' Pieces';
        document.querySelectorAll('.product-count').forEach(function(el) {
          el.textContent = countStr;
        });
      };
      btn.addEventListener('click', onClick);
      _cleanup.push(function () { btn.removeEventListener('click', onClick); });
    });
  }

  function initShopPage() {
    var grid = document.getElementById('products-grid');
    if (!grid) return;
    if (typeof window.RADICAL_PRODUCTS === 'undefined') {
      console.warn('[RADICAL] products.js not loaded — shop grid empty');
      return;
    }

    RADICAL_PRODUCTS.renderGrid(grid);
    RADICAL_PRODUCTS.updateProductCount();
    initProductCardHovers(grid.closest('.shop-page'));
    initShopScrollAnimations();
    initShopFilters();
  }

  function initFeaturedProducts() {
    var grid = document.querySelector('.featured-products__grid');
    if (!grid) return;
    if (typeof window.RADICAL_PRODUCTS === 'undefined') return;

    RADICAL_PRODUCTS.renderGrid(grid, 4);
    initProductCardHovers(grid.closest('.featured-products'));
    initShopScrollAnimations();
  }

  /* ─────────────────────────────────────────────────────────────
     20. ORCHESTRATION
  ───────────────────────────────────────────────────────────── */
  function initNewPage(namespace) {
    const steps = [
      ['HeroVideo',       initHeroVideo],
      ['HeroTileReveal',  initHeroTileReveal],
      ['Hero',            initHero],
      ['HeroSlider',      initHeroSlider],
      ['Reveals',         initReveals],
      ['ImageReveals',    initImageReveals],
      ['Parallax',        initParallax],
      ['ScrollOverlap',   initScrollOverlap],
      ['Magnetics',       initMagnetics],
      ['ProductHover',    initProductHover],
      ['ProductPage',     initProductPage],
      ['ProductTrack',       initProductTrack],
      ['ShopPage',           initShopPage],
      ['FeaturedProducts',   initFeaturedProducts],
      ['AboutReveals',       initAboutReveals],
      ['Footer',             initFooter],
    ];

    for (const [name, fn] of steps) {
      try {
        fn();
      } catch (err) {
        console.error(`[RADICAL] init${name} crashed:`, err);
      }
    }
  }

  function init() {
    const steps = [
      ['PageEntrance',       initPageEntrance],
      ['ScrollProgress',     initScrollProgress],
      ['Search',             initSearch],
      ['HeroVideo',          initHeroVideo],
      ['HeroTileReveal',     initHeroTileReveal],
      ['Hero',               initHero],
      ['HeroSlider',         initHeroSlider],
      ['Reveals',            initReveals],
      ['ImageReveals',       initImageReveals],
      ['Parallax',           initParallax],
      ['ScrollOverlap',      initScrollOverlap],
      ['Magnetics',          initMagnetics],
      ['ProductHover',       initProductHover],
      ['ProductPage',        initProductPage],
      ['Menu',               initMenu],
      ['MenuImageSwap',      initMenuImageSwap],
      ['ProductTrack',       initProductTrack],
      ['ShopPage',           initShopPage],
      ['FeaturedProducts',   initFeaturedProducts],
      ['AboutReveals',       initAboutReveals],
      ['Footer',             initFooter],
      ['PageTransition',     initPageTransition],
    ];

    for (const [name, fn] of steps) {
      try {
        fn();
      } catch (err) {
        console.error(`[RADICAL] init${name} crashed:`, err);
      }
    }

    setTimeout(() => ScrollTrigger.refresh(), 200);
    console.log('[RADICAL] All init steps completed');
  }

  // 1. Run preloader immediately to hide the black overlay ASAP
  try {
    initPreloader();
  } catch (err) {
    console.error('[RADICAL] initPreloader crashed:', err);
  }

  // 2. Initialize everything else on DOMContentLoaded to prevent heavy assets (like video loads) from blocking page interactive state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 3. Refresh ScrollTrigger once all assets (images, fonts, stylesheets) are fully loaded to fix layout shift bugs
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });

})();
