/**
 * landing-translate.js — Côte des voix
 * Bilingual FR ↔ EN toggle for the homepage.
 * Updates all [data-i18n] elements and the <html lang> attribute.
 */
(function () {
  'use strict';

  var TRANSLATIONS = {
    fr: {
      'nav-accueil':      'Accueil',
      'nav-blog':         'Blog',
      'nav-boutique':     'Boutique',
      'nav-contact':      'Contact',
      'hero-desc':        'Histoires, podcast, blog et services linguistiques professionnels — traduction, interprétation et plus. <span class="highlight-text">100% Français, 100% Kenyan.</span> Rejoignez la communauté !',
      'hero-podcast':     'Écouter le Podcast',
      'hero-blog':        'Lire le Blog',
      'hero-interpretation': 'Services linguistiques',
      'section-articles': 'Derniers Articles',
      'see-all-articles': 'Voir tous les articles',
      'section-podcasts': 'Derniers Podcasts',
      'contact-title':    'Contactez-Nous',
      'footer-rights':    'Tous droits réservés. Créé par'
    },
    en: {
      'nav-accueil':      'Home',
      'nav-blog':         'Blog',
      'nav-boutique':     'Shop',
      'nav-contact':      'Contact',
      'hero-desc':        'Stories, podcast, blog and professional language services — translation, interpretation and more. <span class="highlight-text">100% French, 100% Kenyan.</span> Join the community!',
      'hero-podcast':     'Listen to the Podcast',
      'hero-blog':        'Read the Blog',
      'hero-interpretation': 'Language Services',
      'section-articles': 'Latest Articles',
      'see-all-articles': 'See all articles',
      'section-podcasts': 'Latest Podcasts',
      'contact-title':    'Contact Us',
      'footer-rights':    'All rights reserved. Created by'
    }
  };

  var currentLang = 'fr';

  function applyLang(lang) {
    var map = TRANSLATIONS[lang];
    if (!map) return;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key  = el.getAttribute('data-i18n');
      var text = map[key];
      if (text == null) return;

      // hero-desc contains HTML spans — use innerHTML
      if (key === 'hero-desc') {
        el.innerHTML = text;
      } else {
        el.textContent = text;
      }
    });

    // Update <html lang>
    document.documentElement.lang = (lang === 'en') ? 'en' : 'fr';

    // Update button
    var btn = document.getElementById('nav-translate');
    if (btn) {
      btn.textContent = (lang === 'en') ? 'FR' : 'EN';
      btn.setAttribute('title',      (lang === 'en') ? 'Passer en français' : 'Switch to English');
      btn.setAttribute('aria-label', (lang === 'en') ? 'Passer en français' : 'Switch to English');
    }

    // Persist choice
    try { sessionStorage.setItem('cdv_lang', lang); } catch (_) {}

    currentLang = lang;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('nav-translate');
    if (!btn) return;

    // Restore previous choice
    try {
      var saved = sessionStorage.getItem('cdv_lang');
      if (saved && TRANSLATIONS[saved]) { applyLang(saved); }
    } catch (_) {}

    btn.addEventListener('click', function () {
      applyLang(currentLang === 'fr' ? 'en' : 'fr');
    });
  });
})();