/**
 * RADICAL — Motion Config
 * Central animation constants. Import-equivalent: every other script
 * reads from window.RADICAL_MOTION — no duplication, no drift.
 *
 * Design language: calm, controlled, effortless.
 * Editorial-first. Deliberately understated.
 */

window.RADICAL_MOTION = (function () {

  /* ── Easing curves ───────────────────────────────────────────
     Named after their role, not their math.
  ─────────────────────────────────────────────────────────────── */
  const ease = {
    out_quad:       'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // standard reveals
    expo_out:       'cubic-bezier(0.16, 1, 0.3, 1)',          // section entrances
    in_out_standard:'cubic-bezier(0.4, 0, 0.2, 1)',           // transitions, swaps
  };

  /* ── Durations (ms) ─────────────────────────────────────────── */
  const duration = {
    fast:      200,   // hover states, color changes
    medium:    350,   // drawer opens, overlays
    slow:      700,   // section reveals, page loads
    very_slow: 900,   // preloader exit
  };

  /* ── GSAP ease strings (derived from curves above) ──────────── */
  const gsapEase = {
    out_quad:       ease.out_quad,
    expo_out:       ease.expo_out,
    in_out_standard:ease.in_out_standard,
  };

  /* ── GSAP duration (seconds, derived from ms above) ─────────── */
  const gsapDuration = {
    fast:      duration.fast      / 1000,
    medium:    duration.medium    / 1000,
    slow:      duration.slow      / 1000,
    very_slow: duration.very_slow / 1000,
  };

  /* ── Reveal defaults (used by scroll-triggered entrances) ────── */
  const reveal = {
    y:        40,     // vertical travel distance (px)
    opacity:  0,      // start opacity
    ease:     gsapEase.expo_out,
    duration: gsapDuration.slow,
    stagger:  0.08,   // between sibling elements
    start:    'top 88%',
  };

  /* ── Page transition ─────────────────────────────────────────── */
  const transition = {
    ease:     gsapEase.in_out_standard,
    duration: gsapDuration.slow,
  };

  /* ── Preloader ───────────────────────────────────────────────── */
  const preloader = {
    exit_ease:     gsapEase.in_out_standard,
    exit_duration: gsapDuration.very_slow,
    hold_delay:    0.55,  // seconds brand is visible before exit
  };

  return { ease, duration, gsapEase, gsapDuration, reveal, transition, preloader };

})();
