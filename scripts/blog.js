/**
 * blog.js — Côte des voix
 * Full blog page: paginated posts, debounced live search, staggered card reveal.
 * All injected HTML uses the new design system classes.
 */
(function () {
  'use strict';

  const WP_BASE    = 'https://cotedesvoix.com/wp/wp-json/wp/v2/posts';
  const PER_PAGE   = 12;
  const DEBOUNCE   = 400; // ms

  let currentPage  = 1;
  let currentSearch = '';
  let debounceTimer = null;

  // ── HELPERS ──────────────────────────────────────────────
  function formatDate(str) {
    try {
      return new Date(str).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (_) { return ''; }
  }

  function getExcerpt(post, wordLimit) {
    wordLimit = wordLimit || 20;
    let raw = '';
    if (post.excerpt && post.excerpt.rendered) raw = post.excerpt.rendered;
    else if (post.content && post.content.rendered) raw = post.content.rendered;
    const div = document.createElement('div');
    div.innerHTML = raw;
    const text = (div.textContent || div.innerText || '').trim();
    const words = text.split(/\s+/).slice(0, wordLimit);
    return words.length ? words.join(' ') + '…' : '';
  }

  function getFeaturedImage(post) {
    try { return post._embedded['wp:featuredmedia'][0].source_url; }
    catch (_) { return 'Images/favicon.png'; }
  }

  function getCategory(post) {
    try { return post._embedded['wp:term'][0][0].name; }
    catch (_) { return ''; }
  }

  // ── CARD TEMPLATE ─────────────────────────────────────────
  function renderCard(post) {
    const img      = getFeaturedImage(post);
    const date     = formatDate(post.date);
    const excerpt  = getExcerpt(post);
    const title    = post.title.rendered;
    const link     = post.link;
    const category = getCategory(post);

    return `
      <article class="blog-card" data-reveal>
        <a href="${link}" target="_blank" rel="noopener" class="blog-card__link" aria-label="${title}">
          <div class="blog-card__img-wrap">
            <img src="${img}" alt="${title}" loading="lazy">
            <div class="blog-card__img-overlay"></div>
          </div>
          <div class="blog-card__body">
            ${category ? `<span class="blog-card__cat">${category}</span>` : ''}
            <h2 class="blog-card__title">${title}</h2>
            ${excerpt ? `<p class="blog-card__excerpt">${excerpt}</p>` : ''}
            <div class="blog-card__meta">
              <span class="blog-card__date">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${date}
              </span>
              <span class="blog-card__cta">
                Lire l'article
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </div>
          </div>
        </a>
      </article>`;
  }

  // ── PAGINATION ────────────────────────────────────────────
  function renderPagination(page, totalPages) {
    const paginationEl = document.querySelector('.pagination');
    if (!paginationEl) return;
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

    let html = '<div class="pagination-controls">';

    // Prev
    if (page > 1) {
      html += `<button class="pagination-btn pagination-btn--prev" data-page="${page - 1}" aria-label="Page précédente">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
        Précédent
      </button>`;
    }

    // Page numbers (show up to 5 around current)
    const start = Math.max(1, page - 2);
    const end   = Math.min(totalPages, page + 2);

    if (start > 1) html += `<button class="pagination-btn" data-page="1">1</button>`;
    if (start > 2) html += `<span class="pagination-ellipsis">…</span>`;

    for (let i = start; i <= end; i++) {
      html += `<button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}" ${i === page ? 'aria-current="page"' : ''}>${i}</button>`;
    }

    if (end < totalPages - 1) html += `<span class="pagination-ellipsis">…</span>`;
    if (end < totalPages)     html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;

    // Next
    if (page < totalPages) {
      html += `<button class="pagination-btn pagination-btn--next" data-page="${page + 1}" aria-label="Page suivante">
        Suivant
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
      </button>`;
    }

    html += `<span class="page-info">Page ${page} / ${totalPages}</span>`;
    html += '</div>';

    paginationEl.innerHTML = html;

    // Bind pagination buttons
    paginationEl.querySelectorAll('.pagination-btn[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const p = parseInt(btn.dataset.page);
        fetchPosts(p, currentSearch);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ── LOADING STATES ────────────────────────────────────────
  function showLoading() {
    const loading = document.getElementById('loading');
    const container = document.querySelector('.blog-container');
    if (loading)    loading.classList.remove('hidden');
    if (container)  container.innerHTML = '';
  }

  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');
  }

  function showError(container, msg) {
    container.innerHTML = `
      <div class="cdv-fetch-error">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>${msg || 'Erreur de chargement.'} <button onclick="window.__blogRetry()">Réessayer</button></p>
      </div>`;
  }

  function showEmpty(container, isSearch) {
    container.innerHTML = `
      <div class="cdv-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <p>${isSearch ? 'Aucun résultat pour cette recherche.' : 'Aucun article pour le moment.'}</p>
      </div>`;
  }

  // ── MAIN FETCH ────────────────────────────────────────────
  async function fetchPosts(page, search) {
    page   = page   || 1;
    search = search || '';
    currentPage   = page;
    currentSearch = search;

    const container = document.querySelector('.blog-container');
    if (!container) return;

    showLoading();

    try {
      let url = `${WP_BASE}?_embed&per_page=${PER_PAGE}&page=${page}&orderby=date&order=desc`;
      if (search.trim()) url += '&search=' + encodeURIComponent(search.trim());

      const res = await fetch(url);

      // WordPress returns 400 when search yields nothing
      if (res.status === 400) { hideLoading(); showEmpty(container, !!search.trim()); renderPagination(1, 1); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const posts      = await res.json();
      const totalPages = parseInt(res.headers.get('X-WP-TotalPages')) || 1;

      hideLoading();

      if (!posts.length) { showEmpty(container, !!search.trim()); renderPagination(1, 1); return; }

      // Render cards with stagger
      container.innerHTML = posts.map(renderCard).join('');

      // Staggered reveal
      container.querySelectorAll('.blog-card').forEach(function (card, i) {
        card.style.transitionDelay = (i * 0.07) + 's';
        requestAnimationFrame(function () { card.classList.add('is-visible'); });
      });

      renderPagination(page, totalPages);

    } catch (err) {
      console.error('[blog] fetch error:', err);
      hideLoading();
      showError(container, 'Erreur de chargement des articles.');
      renderPagination(1, 1);
    }
  }

  // ── SEARCH ────────────────────────────────────────────────
  function initSearch() {
    const input  = document.getElementById('search-input');
    const button = document.getElementById('search-button');
    if (!input) return;

    function triggerSearch() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        fetchPosts(1, input.value);
      }, DEBOUNCE);
    }

    input.addEventListener('input', triggerSearch);

    if (button) {
      button.addEventListener('click', function () {
        clearTimeout(debounceTimer);
        fetchPosts(1, input.value);
      });
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { clearTimeout(debounceTimer); fetchPosts(1, input.value); }
    });
  }

  // ── INIT ─────────────────────────────────────────────────
  window.__blogRetry = function () { fetchPosts(currentPage, currentSearch); };

  document.addEventListener('DOMContentLoaded', function () {
    initSearch();
    fetchPosts(1, '');
  });
})();