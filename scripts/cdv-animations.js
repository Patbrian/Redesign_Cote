/**
 * cdv-animations.js — Côte des voix
 * Shared animation utilities for all pages.
 * - Nav scroll shadow + hide-on-mobile
 * - Hamburger toggle
 * - IntersectionObserver scroll-reveal for [data-reveal]
 * - Magnetic hover on primary CTAs (desktop)
 * - Exposes window.__cdvReveal() so dynamically injected cards can be revealed
 */
(function () {
  'use strict';

  // ── SCROLL REVEAL ─────────────────────────────────────────
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  function observeAll() {
    document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(function (el) {
      io.observe(el);
    });
  }

  // Expose so home-blog.js / home-podcast.js can call after injecting cards
  window.__cdvReveal = observeAll;

  // ── NAV SCROLL SHADOW ─────────────────────────────────────
  var nav       = document.querySelector('.main-nav');
  var lastScrollY = window.scrollY;

  window.addEventListener('scroll', function () {
    if (!nav) return;
    var currentY = window.scrollY;

    nav.classList.toggle('scrolled', currentY > 24);

    // Hide on scroll-down for mobile only
    if (window.innerWidth <= 900) {
      if (currentY > lastScrollY && currentY > 80) {
        nav.classList.add('nav--hidden');
      } else {
        nav.classList.remove('nav--hidden');
      }
    } else {
      nav.classList.remove('nav--hidden');
    }

    lastScrollY = currentY;
  }, { passive: true });

  // Hamburger is handled exclusively by nav.js — no duplicate here.

  // ── MAGNETIC HOVER (desktop only) ─────────────────────────
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.hero-btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left  - r.width  / 2) * 0.12;
        var y = (e.clientY - r.top   - r.height / 2) * 0.12;
        btn.style.transform = 'translate(' + x + 'px,' + y + 'px) translateY(-3px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // ── INIT (runs after DOM is ready) ────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeAll);
  } else {
    observeAll();
  }
})();