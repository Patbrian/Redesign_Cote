/**
 * home-podcast.js — Côte des voix
 * Fetches the 3 latest Spotify episodes and renders styled cards.
 * Clears all legacy cache keys on every load to prevent stale data.
 */
(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────
  var CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
  var CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  var SHOW_ID       = process.env.SPOTIFY_SHOW_ID;
  var LIMIT         = 3;

  // Bump this key any time you want to force a fresh fetch for all users
  var CACHE_KEY = 'cdv_podcast_v4';
  var CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  // ── PURGE ALL OLD CACHE KEYS ──────────────────────────────
  // Clears every legacy key so stale data never blocks fresh episodes
  ['cdv_spotify_cache_v2', 'cdv_podcast_v3', 'spotify_episodes_cache'].forEach(function (k) {
    try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch (_) {}
  });

  // ── CACHE ─────────────────────────────────────────────────
  function getCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
      return (Array.isArray(obj.data) && obj.data.length >= 1) ? obj.data : null;
    } catch (_) { return null; }
  }

  function setCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (_) {}
  }

  // ── SPOTIFY AUTH ──────────────────────────────────────────
  async function getToken() {
    var res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
      },
      body: 'grant_type=client_credentials'
    });
    if (!res.ok) throw new Error('Spotify auth failed: ' + res.status);
    var json = await res.json();
    if (!json.access_token) throw new Error('No token in response');
    return json.access_token;
  }

  // ── FETCH EPISODES ────────────────────────────────────────
  // No market filter — returns all available episodes globally
  async function fetchEpisodes(token) {
    var res = await fetch(
      'https://api.spotify.com/v1/shows/' + SHOW_ID + '/episodes?limit=' + LIMIT,
      { headers: { 'Authorization': 'Bearer ' + token } }
    );
    if (!res.ok) throw new Error('Episodes fetch failed: ' + res.status);
    var json = await res.json();
    var items = json.items || [];
    // Filter nulls (Spotify sometimes returns null items for unavailable episodes)
    return items.filter(function (ep) { return ep && ep.id && ep.name; });
  }

  // ── HELPERS ───────────────────────────────────────────────
  function formatDate(str) {
    try {
      return new Date(str).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (_) { return ''; }
  }

  function getDuration(ms) {
    if (!ms) return '';
    var total = Math.round(ms / 60000);
    var h = Math.floor(total / 60);
    var m = total % 60;
    return h > 0 ? h + 'h ' + m + 'min' : m + ' min';
  }

  function getImage(ep) {
    return (ep.images && ep.images[0] && ep.images[0].url)
      ? ep.images[0].url : 'Images/favicon.png';
  }

  function getUrl(ep) {
    return (ep.external_urls && ep.external_urls.spotify)
      ? ep.external_urls.spotify
      : 'https://open.spotify.com/episode/' + ep.id;
  }

  // ── RENDER SINGLE CARD ────────────────────────────────────
  function renderCard(ep) {
    var img      = getImage(ep);
    var title    = ep.name;
    var date     = formatDate(ep.release_date);
    var duration = getDuration(ep.duration_ms);
    var url      = getUrl(ep);

    return [
      '<div class="podcast-card" data-reveal data-episode-id="' + ep.id + '">',
        '<div class="podcast-card__img-wrap">',
          '<img src="' + img + '" alt="' + title + '" loading="lazy" onerror="this.src=\'Images/favicon.png\'">',
          '<button class="podcast-card__play-btn" aria-label="Lire ' + title + '" data-episode="' + ep.id + '">',
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">',
              '<polygon points="5 3 19 12 5 21 5 3"/>',
            '</svg>',
          '</button>',
        '</div>',
        '<div class="podcast-card__body">',
          '<h3 class="podcast-card__title">' + title + '</h3>',
          '<div class="podcast-card__meta">',
            date     ? '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + date + '</span>' : '',
            duration ? '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' + duration + '</span>' : '',
          '</div>',
          '<div class="podcast-card__player" id="player-' + ep.id + '" hidden>',
            '<iframe',
            ' src="https://open.spotify.com/embed/episode/' + ep.id + '?utm_source=generator&theme=0"',
            ' width="100%" height="152" frameborder="0"',
            ' allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"',
            ' loading="lazy" title="' + title + '">',
            '</iframe>',
          '</div>',
          '<a href="' + url + '" class="podcast-card__cta" target="_blank" rel="noopener">',
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">',
              '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0z"/>',
            '</svg>',
            'Écouter sur Spotify',
          '</a>',
        '</div>',
      '</div>'
    ].join('');
  }

  // ── FALLBACK: embed the show directly ─────────────────────
  function renderFallback(container) {
    container.innerHTML =
      '<div class="podcast-show-embed" style="grid-column:1/-1;padding:1rem 0">' +
        '<iframe style="border-radius:8px"' +
        ' src="https://open.spotify.com/embed/show/' + SHOW_ID + '?utm_source=generator&theme=0"' +
        ' width="100%" height="352" frameborder="0"' +
        ' allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"' +
        ' loading="lazy" title="Côte des voix — Podcast"></iframe>' +
      '</div>';
  }

  // ── PLAY BUTTON LOGIC ─────────────────────────────────────
  function initPlayers(container) {
    container.querySelectorAll('.podcast-card__play-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id     = btn.dataset.episode;
        var player = document.getElementById('player-' + id);
        if (!player) return;
        var wasHidden = player.hidden;

        // Close all first
        container.querySelectorAll('.podcast-card__player').forEach(function (p) { p.hidden = true; });
        container.querySelectorAll('.podcast-card__play-btn svg').forEach(function (svg) {
          svg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        });

        // Toggle clicked
        player.hidden = !wasHidden;
        if (!player.hidden) {
          btn.querySelector('svg').innerHTML =
            '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        }
      });
    });
  }

  // ── DISPLAY CARDS ─────────────────────────────────────────
  function displayCards(episodes, container) {
    var three = episodes.slice(0, 3);
    container.innerHTML = three.map(renderCard).join('');
    initPlayers(container);

    // Staggered reveal animation
    container.querySelectorAll('.podcast-card').forEach(function (card, i) {
      card.style.opacity          = '0';
      card.style.transform        = 'translateY(28px)';
      card.style.transition       = 'opacity .6s ease ' + (i * 0.12) + 's, transform .6s ease ' + (i * 0.12) + 's';
      requestAnimationFrame(function () {
        setTimeout(function () {
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
        }, 60);
      });
    });

    if (window.__cdvReveal) window.__cdvReveal();
  }

  // ── MAIN FETCH ────────────────────────────────────────────
  async function fetchLatestPodcasts() {
    var loading   = document.getElementById('podcast-loading');
    var container = document.getElementById('latest-podcasts');
    if (!container) return;

    // Try cache first (instant display)
    var cached = getCache();
    if (cached) {
      if (loading) loading.style.display = 'none';
      displayCards(cached, container);

      // Silent background refresh
      try {
        var token    = await getToken();
        var fresh    = await fetchEpisodes(token);
        if (fresh.length > 0 && JSON.stringify(fresh) !== JSON.stringify(cached)) {
          setCache(fresh);
          displayCards(fresh, container);
        }
      } catch (_) { /* keep showing cached */ }
      return;
    }

    // No cache — full fetch with loading indicator
    if (loading) loading.style.display = 'flex';

    try {
      var token    = await getToken();
      var episodes = await fetchEpisodes(token);

      if (!episodes.length) throw new Error('Zero valid episodes returned');

      setCache(episodes);
      if (loading) loading.style.display = 'none';
      displayCards(episodes, container);

    } catch (err) {
      console.warn('[home-podcast] Spotify fetch failed:', err.message);
      if (loading) loading.style.display = 'none';
      renderFallback(container);
    }
  }

  document.addEventListener('DOMContentLoaded', fetchLatestPodcasts);

})();