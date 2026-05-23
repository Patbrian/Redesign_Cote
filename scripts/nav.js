/**
 * nav.js — Côte des voix
 * Single source of truth for:
 *   - Hamburger open/close toggle
 *   - Nav scroll shadow
 *   - Hide-on-scroll-down (mobile)
 *   - Active link highlight
 */
(function () {
  'use strict';

  function init() {
    var nav       = document.querySelector('.main-nav');
    var hamburger = document.querySelector('.hamburger');
    var navLinks  = document.getElementById('nav-links');

    /* ── HAMBURGER ─────────────────────────────────────────── */
    if (hamburger && navLinks) {

      hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
      });

      /* Close when any nav link is tapped on mobile */
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });

      /* Close when tapping anywhere outside the nav */
      document.addEventListener('click', function (e) {
        if (!navLinks.classList.contains('open')) return;
        if (nav && nav.contains(e.target)) return;
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });

      /* Close on Escape key */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          hamburger.focus();
        }
      });
    }

    /* ── SCROLL SHADOW + HIDE ON MOBILE ──────────────────────── */
    if (nav) {
      var lastScrollY = window.scrollY;

      window.addEventListener('scroll', function () {
        var currentY = window.scrollY;

        /* Shadow on all breakpoints */
        nav.classList.toggle('scrolled', currentY > 24);

        /* Hide-on-scroll-down — mobile only */
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
    }

    /* ── ACTIVE LINK ─────────────────────────────────────────── */
    var currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = link.getAttribute('href');
      var isActive = href === currentFile ||
                     (currentFile === '' && href === 'index.html');
      link.classList.toggle('active', isActive);
    });
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();