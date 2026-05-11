/**
 * RADICAL — Men's Jewellery
 * about.js · Philosophy page (Odd Ritual DNA)
 */

(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* ─────────────────────────────────────────────────
     1. HERO ENTRANCE (Odd Ritual style)
  ───────────────────────────────────────────────── */
  const initAboutHero = () => {
    const heroContent = document.getElementById('about-hero-content');
    if (!heroContent) return;

    const label = heroContent.querySelector('.about-hero__label');
    const headline = heroContent.querySelector('.about-hero__headline');
    const sub = heroContent.querySelector('.about-hero__sub');

    const tl = gsap.timeline({ delay: 0.3 });

    if (label) tl.fromTo(label,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
    if (headline) tl.fromTo(headline,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' },
      '-=0.5'
    );
    if (sub) tl.fromTo(sub,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
      '-=0.7'
    );

    // Hero image parallax
    const heroImg = document.querySelector('.about-hero__img');
    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      });
    }
  };

  /* ─────────────────────────────────────────────────
     2. SCROLL REVEALS (Odd Ritual DNA)
  ───────────────────────────────────────────────── */
  const initAboutReveals = () => {
    // Text reveals
    document.querySelectorAll('.about-reveal').forEach(el => {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    });

    // Section headings
    document.querySelectorAll('.about-section__heading').forEach(heading => {
      gsap.fromTo(heading,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    });

    // Image parallax on about sections
    document.querySelectorAll('.about-section__img').forEach(img => {
      if (img.parentElement) img.parentElement.style.overflow = 'hidden';

      gsap.fromTo(img,
        { scale: 1.12, yPercent: -8 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: img.parentElement || img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        }
      );
    });
  };

  /* ─────────────────────────────────────────────────
     3. INIT
  ───────────────────────────────────────────────── */
  const init = () => {
    initAboutHero();
    initAboutReveals();
  };

  if (document.fonts) {
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load', init);
  }

  console.log('%cRADICAL · About page loaded', 'font-family:serif; font-size:13px; color:#1A1A1A;');
})();
