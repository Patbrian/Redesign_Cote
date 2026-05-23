/**
 * home-blog.js — Côte des voix
 * Fetches the 3 latest WordPress posts and renders them
 * into #latest-posts on the homepage using the new design system.
 */
(function () {
  'use strict';

  const WP_API = 'https://cotedesvoix.com/wp/wp-json/wp/v2/posts?_embed&per_page=3&orderby=date&order=desc';

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (_) {
      return '';
    }
  }

  function getExcerpt(post, wordLimit) {
    wordLimit = wordLimit || 18;
    let raw = '';
    if (post.excerpt && post.excerpt.rendered) {
      raw = post.excerpt.rendered;
    } else if (post.content && post.content.rendered) {
      raw = post.content.rendered;
    }
    const div = document.createElement('div');
    div.innerHTML = raw;
    const text = (div.textContent || div.innerText || '').trim();
    const words = text.split(/\s+/).slice(0, wordLimit);
    return words.length ? words.join(' ') + '…' : '';
  }

  function getFeaturedImage(post) {
    try {
      return post._embedded['wp:featuredmedia'][0].source_url;
    } catch (_) {
      return 'Images/favicon.png';
    }
  }

  function renderCard(post) {
    const img     = getFeaturedImage(post);
    const date    = formatDate(post.date);
    const excerpt = getExcerpt(post);
    const title   = post.title.rendered;
    const link    = post.link;

    return `
      <article class="blog-card" data-reveal>
        <a href="${link}" target="_blank" rel="noopener" class="blog-card__link" aria-label="${title}">
          <div class="blog-card__img-wrap">
            <img src="${img}" alt="${title}" loading="lazy">
            <div class="blog-card__img-overlay"></div>
          </div>
          <div class="blog-card__body">
            <h3 class="blog-card__title">${title}</h3>
            ${excerpt ? `<p class="blog-card__excerpt">${excerpt}</p>` : ''}
            <div class="blog-card__meta">
              <span class="blog-card__date">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${date}
              </span>
              <span class="blog-card__cta">
                Lire
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </div>
          </div>
        </a>
      </article>`;
  }

  function renderError(container) {
    container.innerHTML = `
      <div class="cdv-fetch-error">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>Impossible de charger les articles. <button onclick="window.__homeReloadBlog()">Réessayer</button></p>
      </div>`;
  }

  async function fetchLatestPosts() {
    const loading   = document.getElementById('blog-loading');
    const container = document.getElementById('latest-posts');
    if (!container) return;

    try {
      if (loading) loading.style.display = 'flex';

      const res = await fetch(WP_API);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const posts = await res.json();

      if (!Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = '<p class="cdv-empty">Aucun article pour le moment.</p>';
        return;
      }

      // Remove loading, inject cards
      container.innerHTML = posts.map(renderCard).join('');

      // Hide loading element
      if (loading) loading.style.display = 'none';

      // Trigger scroll-reveal for injected cards
      if (window.__cdvReveal) window.__cdvReveal();

    } catch (err) {
      console.error('[home-blog] fetch error:', err);
      renderError(container);
      if (loading) loading.style.display = 'none';
    } finally {
      // Additional safety check
      if (loading && loading.style.display !== 'none') {
        loading.style.display = 'none';
      }
    }
  }

  // Expose retry globally
  window.__homeReloadBlog = fetchLatestPosts;

  document.addEventListener('DOMContentLoaded', fetchLatestPosts);
})();