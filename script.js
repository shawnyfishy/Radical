/**
 * RADICAL — Men's Jewellery
 * script.js · Phase 1: Navigation behaviour
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────
     DOM REFERENCES
  ───────────────────────────────────────────────── */
  const nav          = document.getElementById('main-nav');
  const menuBtn      = document.getElementById('nav-menu-btn');
  const closeBtn     = document.getElementById('nav-close-btn');
  const backdrop     = document.getElementById('nav-backdrop');
  const overlay      = document.getElementById('nav-overlay');
  const panel        = document.getElementById('nav-panel');
  const navLinks     = document.querySelectorAll('.nav-overlay__link');
  const bagCount     = document.querySelector('.nav__bag-count');

  // Hero elements
  const heroSection  = document.getElementById('hero');
  const heroImg      = document.querySelector('.hero__img');


  /* ─────────────────────────────────────────────────
     1. FULL PAGE LOAD EXPERIENCE — Phase 15
     Fires strictly after DOM and Fonts loaded
  ───────────────────────────────────────────────── */
  function initHeroAnimation() {
    if (!heroSection) return;
    
    // Add the animation class
    heroSection.classList.add('hero-animated');

    // Remove will-change after animations finish (1.2s delay + 0.6s max duration = 1800ms)
    setTimeout(() => {
      const animatedEls = document.querySelectorAll('.hero__label, .hero__headline, .hero__cta');
      animatedEls.forEach(el => {
        el.style.willChange = 'auto';
      });
      // hero__media keeps will-change: transform for Ken Burns
    }, 2000);
  }

  // Orchestrate Cinematic Body Fade-In
  document.addEventListener('DOMContentLoaded', () => {
    // Check if Font Loading API is available
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        // Soft white fade-in over 0.5s via inline CSS transition
        document.body.style.opacity = '1';
        
        // Trigger hero animations right after body finishes fading in
        setTimeout(initHeroAnimation, 500);
      });
    } else {
      // Fallback if fonts API is unavailable
      window.addEventListener('load', () => {
        document.body.style.opacity = '1';
        setTimeout(initHeroAnimation, 500);
      });
    }
  });


  /* ─────────────────────────────────────────────────
     2. HERO — IMAGE LOAD HANDLER
     Swap .hero__img src → it fades in when loaded.
     Usage: heroImg.src = 'path/to/photo.jpg'
  ───────────────────────────────────────────────── */
  const globalImages = document.querySelectorAll(
    '.hero__img, .editorial__img, .banner__img, .category__img, .campaign__img, .pdp__gallery-img, .about-hero__img, .about-section__img'
  );

  globalImages.forEach(img => {
    const reveal = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth > 0) {
      reveal();
    } else {
      img.addEventListener('load', reveal);
    }
  });


  /* ─────────────────────────────────────────────────
     3. STICKY NAV — SCROLL SHRINK & HIDE
     - Hysteresis gap for shrink (80px down, 30px up)
     - Hide on scroll down past 200px
     - Show on scroll up
  ───────────────────────────────────────────────── */
  const SHRINK_THRESHOLD = 20;  // Threshold to switch from Transparent to Solid
  const EXPAND_THRESHOLD = 5;   // Threshold to switch back to Transparent
  const HIDE_THRESHOLD = 150;   // Hides on scroll down past this point

  let ticking = false;
  let lastScrollY = window.scrollY;

  function handleNavScroll() {
    const currentScrollY = window.scrollY;

    // 1. Shrink / Expand with Hysteresis
    if (currentScrollY > SHRINK_THRESHOLD) {
      nav.classList.add('is-scrolled');
    } else if (currentScrollY < EXPAND_THRESHOLD) {
      nav.classList.remove('is-scrolled');
    }

    // 2. Hide / Show based on Direction
    if (currentScrollY <= 100) {
      // Always show near top
      nav.classList.remove('is-hidden');
    } else {
      if (currentScrollY > lastScrollY && currentScrollY > HIDE_THRESHOLD) {
        // Scrolling Down — Vanish
        nav.classList.add('is-hidden');
      } else if (currentScrollY < lastScrollY - 5) { 
        // Scrolling Up (with 5px buffer) — Reappear Instantly
        nav.classList.remove('is-hidden');
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  let scrollTimeout;

  window.addEventListener('scroll', () => {
    // Debounce at 10ms
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
      window.requestAnimationFrame(handleNavScroll);
    }, 10);
  }, { passive: true });

  // Run once on load to establish state
  handleNavScroll();


  /* ─────────────────────────────────────────────────
     2. NAVIGATION OVERLAY — OPEN / CLOSE
  ───────────────────────────────────────────────── */
  function openMenu() {
    overlay.classList.add('is-open');
    nav.classList.add('is-menu-open');
    overlay.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('is-open');
    nav.classList.remove('is-menu-open');
    overlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    if (overlay.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Toggle trigger
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMenu);
  }

  // Close triggers
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Backdrop click to close
  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // Close menu when clicking a nav link (smooth scroll + close), ignoring accordions
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      // Ignore clicks on accordion toggles
      if (link.classList.contains('nav-overlay__toggle')) {
        return;
      }
      
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        closeMenu();
        // Small delay to let panel close before scrolling
        setTimeout(() => {
          const target = document.querySelector(href);
          if (target) {
            const targetRect = target.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetOffsetTop = targetRect.top + scrollTop;
            const offsetPosition = targetOffsetTop - 70;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 500);
      }
    });
  });

  /* ─────────────────────────────────────────────────
     2.1 ACCORDION TOGGLES IN MENU
  ───────────────────────────────────────────────── */
  const accordionToggles = document.querySelectorAll('.nav-overlay__toggle');
  accordionToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const parentLi = toggle.closest('.nav-overlay__item');
      const sublist = parentLi.querySelector('.nav-overlay__sublist');
      
      if (parentLi.classList.contains('is-expanded')) {
        parentLi.classList.remove('is-expanded');
        toggle.setAttribute('aria-expanded', 'false');
        sublist.style.maxHeight = null;
      } else {
        parentLi.classList.add('is-expanded');
        toggle.setAttribute('aria-expanded', 'true');
        sublist.style.maxHeight = sublist.scrollHeight + 32 + "px"; // 32px accounts for padding
      }
    });
  });


  /* ─────────────────────────────────────────────────
     2.2 SEARCH OVERLAY — Phase 16
  ───────────────────────────────────────────────── */
  const searchBtn    = document.getElementById('nav-search-btn');
  const searchStrip  = document.getElementById('search-strip');
  const searchScrim  = document.getElementById('search-scrim');
  const searchClose  = document.getElementById('search-close-btn');
  const searchInput  = document.getElementById('search-input');

  function openSearch(e) {
    if (e) e.preventDefault();
    if (searchStrip && searchScrim) {
      searchStrip.classList.add('is-open');
      searchStrip.setAttribute('aria-hidden', 'false');
      searchScrim.classList.add('is-active');
      searchScrim.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
      // Auto-focus input
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 100);
    }
  }

  function closeSearch() {
    if (searchStrip && searchScrim) {
      searchStrip.classList.remove('is-open');
      searchStrip.classList.add('is-closing');
      searchStrip.setAttribute('aria-hidden', 'true');
      searchScrim.classList.remove('is-active');
      searchScrim.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      
      setTimeout(() => {
        searchStrip.classList.remove('is-closing');
        if (searchInput) searchInput.value = ''; // clear input on close
      }, 350); // wait for ease duration
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);
  if (searchScrim) searchScrim.addEventListener('click', closeSearch);

  // Close search on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchStrip && searchStrip.classList.contains('is-open')) {
      closeSearch();
    }
  });


  /* ─────────────────────────────────────────────────
     3. SMOOTH SCROLL — All anchor links
  ───────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        
        // Calculate offset minus 70px for sticky nav clearance
        const targetRect = target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetOffsetTop = targetRect.top + scrollTop;
        const offsetPosition = targetOffsetTop - 70;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // If the click came from inside the mobile menu, close the menu
        if (typeof closeMenu === 'function' && document.body.classList.contains('menu-open')) {
          closeMenu();
        }
      }
    });
  });


  /* ─────────────────────────────────────────────────
     4. SHOPPING BAG COUNT
     (Placeholder — ready for cart integration)
  ───────────────────────────────────────────────── */
  function updateBagCount(count) {
    if (!bagCount) return;
    bagCount.textContent = count;
    if (count > 0) {
      bagCount.classList.add('has-items');
      document.getElementById('nav-bag-btn').setAttribute('aria-label', `Shopping bag (${count} item${count > 1 ? 's' : ''})`);
    } else {
      bagCount.classList.remove('has-items');
      document.getElementById('nav-bag-btn').setAttribute('aria-label', 'Shopping bag (empty)');
    }
  }

  // Initialize at 0
  updateBagCount(0);


  /* ─────────────────────────────────────────────────
     5. SCROLL REVEAL ANIMATIONS
     IntersectionObserver to trigger standard entrance
     animations exactly once per element.
  ───────────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            // Element animated, stop observing to prevent running again
            observer.unobserve(entry.target);
            
            // Optional: after animation duration completes, remove will-change 
            // for performance cleanup (0.7s duration + max 0.45s stagger delay)
            setTimeout(() => {
              entry.target.style.willChange = 'auto';
            }, 1200);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.15, // Trigger when 15% visible
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  }


  /* ─────────────────────────────────────────────────
     6. SCROLL PROGRESS INDICATOR
  ───────────────────────────────────────────────── */
  const scrollProgress = document.getElementById('scroll-progress');
  
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);
      const scrollPercentRounded = Math.round(scrollPercent * 100);
      scrollProgress.style.width = scrollPercentRounded + '%';
    });
  }


  /* ─────────────────────────────────────────────────
     7. FOOTER MOBILE ACCORDION (Phase 17)
  ───────────────────────────────────────────────── */
  const footerToggles = document.querySelectorAll('.footer__col-toggle');
  footerToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      // Only execute if on mobile (screen width <= 768px)
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const parentCol = toggle.closest('.footer__col');
        const sublist = parentCol.querySelector('.footer__list');
        
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          toggle.setAttribute('aria-expanded', 'false');
          sublist.style.maxHeight = null;
        } else {
          toggle.setAttribute('aria-expanded', 'true');
          sublist.style.maxHeight = sublist.scrollHeight + "px";
        }
      }
    });
  });

  // Reset max-height if window resizes back to desktop to prevent breaking layout
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      document.querySelectorAll('.footer__col.is-accordion .footer__list').forEach(list => {
        list.style.maxHeight = null;
      });
      footerToggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });


  /* ─────────────────────────────────────────────────
     8. PARALLAX EFFECTS (Phase 19)
  ───────────────────────────────────────────────── */
  const pBanner = document.getElementById('collection-banner');
  const pBannerImg = document.querySelector('.banner__img');
  
  let parallaxTicking = false;
  let bannerInView = false;
  let parallaxScrollY = window.scrollY;

  // Utilize IntersectionObserver to cap banner calculation overhead
  if (pBanner) {
    const bannerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        bannerInView = entry.isIntersecting;
      });
    }, { rootMargin: "200px 0px" });
    bannerObserver.observe(pBanner);
  }

  function updateParallax() {
    // Only apply on non-mobile interfaces explicitly
    if (window.innerWidth > 768) {
      // 1. Hero Parallax (Rate: 0.3)
      if (heroImg) {
        // Stop tracking if scrolling past the component to save perf
        if (parallaxScrollY <= window.innerHeight + 100) {
          heroImg.style.transform = `translate3d(0, ${parallaxScrollY * 0.3}px, 0)`;
        }
      }
      
      // 2. Banner Parallax (Rate: 0.2)
      if (pBannerImg && bannerInView && pBanner) {
        // Track offset strictly relative to the bottom of the viewport entering the banner space
        const bannerRect = pBanner.getBoundingClientRect();
        const offset = window.innerHeight - bannerRect.top;
        pBannerImg.style.transform = `translate3d(0, ${offset * 0.2}px, 0)`;
      }
    } else {
      // Hard reset on mobile breakpoints completely unsetting transforms mapped by JS
      if (heroImg) heroImg.style.transform = '';
      if (pBannerImg) pBannerImg.style.transform = '';
    }
    parallaxTicking = false;
  }

  // Bind to passive scroll
  window.addEventListener('scroll', () => {
    parallaxScrollY = window.scrollY;
    if (!parallaxTicking) {
      window.requestAnimationFrame(updateParallax);
      parallaxTicking = true;
    }
  }, { passive: true });

  /* ─────────────────────────────────────────────────
     9. DEBUG — Log initialized
  ───────────────────────────────────────────────── */
  console.log('%cRADICAL · Phase 1 initialized', 'font-family:serif; font-size:14px; color:#1A1A1A; font-weight:bold;');

})();
