/**
 * shop.js — Côte des voix
 * Product listing, cart, WhatsApp checkout.
 * Uses new design system classes and opens the cart as a slide-in panel.
 */
(function () {
  'use strict';

  // ── STATE ────────────────────────────────────────────────
  var products = [];
  var cart     = [];

  // ── DOM REFS ─────────────────────────────────────────────
  var listProductEl = document.querySelector('.listProduct');
  var listCartEl    = document.querySelector('.listCart');
  var cartTabEl     = document.querySelector('.cartTab');
  var iconCartEl    = document.querySelector('.icon-cart');
  var closeCartEl   = document.querySelector('.close');
  var checkoutEl    = document.querySelector('.checkOut');
  var cartCountEl   = document.querySelector('.cart-count');

  // ── CART OPEN / CLOSE ─────────────────────────────────────
  function openCart() {
    if (cartTabEl) cartTabEl.classList.add('active');
    document.body.classList.add('cart-open');
  }
  function closeCart() {
    if (cartTabEl) cartTabEl.classList.remove('active');
    document.body.classList.remove('cart-open');
  }

  if (iconCartEl) iconCartEl.addEventListener('click', openCart);
  if (closeCartEl) closeCartEl.addEventListener('click', closeCart);

  // Close on overlay click (overlay added by CSS/HTML)
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('cart-overlay')) closeCart();
  });

  // ── CART COUNT ────────────────────────────────────────────
  function updateCartCount() {
    var total = cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    // Update ALL .cart-count elements (there are two in shop.html)
    document.querySelectorAll('.cart-count').forEach(function (el) {
      el.textContent = total;
    });
  }

  // ── PERSIST ───────────────────────────────────────────────
  function saveCart() {
    try { localStorage.setItem('cdv_cart', JSON.stringify(cart)); } catch (_) {}
  }
  function loadCart() {
    try {
      var raw = localStorage.getItem('cdv_cart');
      if (raw) cart = JSON.parse(raw);
    } catch (_) { cart = []; }
  }

  // ── ADD TO CART ───────────────────────────────────────────
  function addToCart(productId) {
    var idx = cart.findIndex(function (i) { return i.product_id == productId; });
    if (idx < 0) {
      cart.push({ product_id: productId, quantity: 1 });
    } else {
      cart[idx].quantity += 1;
    }
    renderCart();
    saveCart();
    updateCartCount();
    // Brief flash of cart count
    var badge = document.querySelector('.cart-count');
    if (badge) {
      badge.classList.add('cart-count--bump');
      setTimeout(function () { badge.classList.remove('cart-count--bump'); }, 300);
    }
  }

  // ── CHANGE QUANTITY ───────────────────────────────────────
  function changeQty(productId, delta) {
    var idx = cart.findIndex(function (i) { return i.product_id == productId; });
    if (idx < 0) return;
    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    renderCart();
    saveCart();
    updateCartCount();
  }

  // ── RENDER PRODUCTS ───────────────────────────────────────
  function renderProducts() {
    if (!listProductEl) return;
    listProductEl.innerHTML = products.map(function (p) {
      return `
        <div class="item" data-id="${p.id}">
          <div class="item__img-wrap">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
          </div>
          <div class="item__body">
            <h3 class="item__name">${p.name}</h3>
            <div class="item__price">KES ${p.price.toLocaleString()}</div>
            <button class="addCart item__btn" data-id="${p.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Ajouter au panier
            </button>
          </div>
        </div>`;
    }).join('');

    // Stagger product card reveal
    listProductEl.querySelectorAll('.item').forEach(function (card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(24px)';
      card.style.transition = 'opacity .5s ease ' + (i * 0.07) + 's, transform .5s ease ' + (i * 0.07) + 's';
      requestAnimationFrame(function () {
        setTimeout(function () {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 60);
      });
    });
  }

  // ── RENDER CART ───────────────────────────────────────────
  function renderCart() {
    if (!listCartEl) return;

    if (!cart.length) {
      listCartEl.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <p>Votre panier est vide</p>
        </div>`;
      return;
    }

    var totalAmount = 0;
    var itemsHTML = cart.map(function (item) {
      var product = products.find(function (p) { return p.id == item.product_id; });
      if (!product) return '';
      var lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;
      return `
        <div class="cart-item" data-id="${item.product_id}">
          <div class="cart-item__img">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </div>
          <div class="cart-item__info">
            <span class="cart-item__name">${product.name}</span>
            <span class="cart-item__price">KES ${product.price.toLocaleString()}</span>
          </div>
          <div class="cart-item__qty">
            <button class="qty-btn minus" data-id="${item.product_id}" aria-label="Diminuer">−</button>
            <span class="qty-count">${item.quantity}</span>
            <button class="qty-btn plus"  data-id="${item.product_id}" aria-label="Augmenter">+</button>
          </div>
          <span class="cart-item__total">KES ${lineTotal.toLocaleString()}</span>
        </div>`;
    }).join('');

    listCartEl.innerHTML = itemsHTML + `
      <div class="cart-total">
        <span>Total</span>
        <strong>KES ${totalAmount.toLocaleString()}</strong>
      </div>`;

    // Qty button listeners
    listCartEl.querySelectorAll('.qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id    = btn.dataset.id;
        var delta = btn.classList.contains('plus') ? 1 : -1;
        changeQty(id, delta);
      });
    });
  }

  // ── PRODUCT LIST CLICK DELEGATION ────────────────────────
  if (listProductEl) {
    listProductEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.addCart');
      if (btn) addToCart(btn.dataset.id);
    });
  }

  // ── CHECKOUT MODAL ────────────────────────────────────────
  function showCheckoutModal() {
    var existing = document.querySelector('.cdv-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'cdv-modal-overlay';
    overlay.innerHTML = `
      <div class="cdv-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="cdv-modal__close" aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <h2 id="modal-title" class="cdv-modal__title">Finaliser votre commande</h2>
        <p class="cdv-modal__sub">Entrez vos coordonnées — votre commande sera envoyée par WhatsApp.</p>
        <div class="cdv-modal__fields">
          <label>
            <span>Votre nom</span>
            <input type="text" id="cdv-order-name" placeholder="ex. Jean Dupont" autocomplete="name">
          </label>
          <label>
            <span>Numéro de téléphone</span>
            <input type="tel" id="cdv-order-phone" placeholder="ex. +254 700 000 000" autocomplete="tel">
          </label>
        </div>
        <div class="cdv-modal__actions">
          <button class="cdv-modal__cancel">Annuler</button>
          <button class="cdv-modal__submit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.376l-.36-.213-3.681.846.881-3.559-.234-.374A9.818 9.818 0 1 1 12 21.818z"/></svg>
            Envoyer via WhatsApp
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('.cdv-modal__close').addEventListener('click', function () { overlay.remove(); });
    overlay.querySelector('.cdv-modal__cancel').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    // Submit
    overlay.querySelector('.cdv-modal__submit').addEventListener('click', function () {
      submitOrder(overlay);
    });

    // Focus first input
    setTimeout(function () {
      var input = overlay.querySelector('#cdv-order-name');
      if (input) input.focus();
    }, 100);
  }

  function submitOrder(overlay) {
    var nameEl  = overlay.querySelector('#cdv-order-name');
    var phoneEl = overlay.querySelector('#cdv-order-phone');
    var name    = nameEl  ? nameEl.value.trim()  : '';
    var phone   = phoneEl ? phoneEl.value.trim() : '';

    // Validate
    var errors = [];
    if (!name)  { errors.push('Veuillez entrer votre nom.'); nameEl.focus(); }
    if (!phone) { errors.push('Veuillez entrer votre numéro de téléphone.'); }
    if (errors.length) { showModalError(overlay, errors[0]); return; }

    // Build order text
    var lines = cart.map(function (item) {
      var p = products.find(function (pr) { return pr.id == item.product_id; });
      if (!p) return '';
      return p.name + ' × ' + item.quantity + ' — KES ' + (p.price * item.quantity).toLocaleString();
    }).filter(Boolean);

    var total = cart.reduce(function (sum, item) {
      var p = products.find(function (pr) { return pr.id == item.product_id; });
      return sum + (p ? p.price * item.quantity : 0);
    }, 0);

    var message =
      '🛒 *Nouvelle commande — Côte des voix*\n\n' +
      lines.join('\n') + '\n\n' +
      '*Total : KES ' + total.toLocaleString() + '*\n\n' +
      '👤 Nom : ' + name + '\n' +
      '📞 Téléphone : ' + phone;

    var waNumber = '254703634966';
    window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(message), '_blank');

    // Clear cart
    cart = [];
    renderCart();
    saveCart();
    updateCartCount();
    closeCart();
    overlay.remove();

    // Success toast
    showToast('Merci ! Votre commande a été envoyée via WhatsApp.');
  }

  function showModalError(overlay, msg) {
    var existing = overlay.querySelector('.cdv-modal__error');
    if (existing) existing.remove();
    var err = document.createElement('p');
    err.className = 'cdv-modal__error';
    err.textContent = msg;
    overlay.querySelector('.cdv-modal__actions').before(err);
    setTimeout(function () { err.remove(); }, 4000);
  }

  function showToast(msg) {
    var toast = document.createElement('div');
    toast.className = 'cdv-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('cdv-toast--show');
      setTimeout(function () {
        toast.classList.remove('cdv-toast--show');
        setTimeout(function () { toast.remove(); }, 400);
      }, 4000);
    });
  }

  if (checkoutEl) {
    checkoutEl.addEventListener('click', function () {
      if (!cart.length) { showToast('Votre panier est vide !'); return; }
      showCheckoutModal();
    });
  }

  // ── INJECT STYLES (modal, toast, cart-item) ───────────────
  var styles = document.createElement('style');
  styles.textContent = `
    /* Cart slide open */
    body.cart-open { overflow: hidden; }
    body.cart-open .cart-overlay { display: block !important; }

    /* Cart items */
    .cart-item { display:flex; align-items:center; gap:1rem; padding:.9rem 0; border-bottom:1px solid rgba(22,15,7,.08); }
    .cart-item__img { width:56px; height:56px; flex-shrink:0; }
    .cart-item__img img { width:100%; height:100%; object-fit:cover; }
    .cart-item__info { flex:1; display:flex; flex-direction:column; gap:.2rem; }
    .cart-item__name { font-family:'Syne',sans-serif; font-size:.7rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#160F07; }
    .cart-item__price { font-size:.78rem; color:rgba(22,15,7,.5); }
    .cart-item__qty { display:flex; align-items:center; gap:.4rem; }
    .qty-btn { width:26px; height:26px; background:rgba(22,15,7,.06); border:1px solid rgba(22,15,7,.12); color:#160F07; font-size:1rem; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s; }
    .qty-btn:hover { background:#BF4E1E; color:#fff; border-color:#BF4E1E; }
    .qty-count { font-family:'Syne',sans-serif; font-size:.7rem; font-weight:700; min-width:1.2rem; text-align:center; }
    .cart-item__total { font-family:'Syne',sans-serif; font-size:.72rem; font-weight:700; color:#BF4E1E; }
    .cart-total { display:flex; justify-content:space-between; align-items:center; padding:1rem 0 0; margin-top:.5rem; border-top:2px solid rgba(22,15,7,.1); font-family:'Syne',sans-serif; font-size:.75rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
    .cart-total strong { color:#BF4E1E; font-size:.9rem; }
    .cart-empty { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:4rem 0; color:rgba(22,15,7,.3); }
    .cart-empty p { font-family:'Syne',sans-serif; font-size:.62rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase; }

    /* Cart count bump animation */
    .cart-count--bump { animation: aBump .3s ease; }
    @keyframes aBump { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }

    /* Product item overrides */
    .item { background:#FDFAF6; border:1px solid rgba(22,15,7,.1); overflow:hidden; cursor:default; }
    .item__img-wrap { overflow:hidden; aspect-ratio:1; }
    .item__img-wrap img { width:100%; height:100%; object-fit:cover; transition:transform .5s cubic-bezier(.22,1,.36,1); }
    .item:hover .item__img-wrap img { transform:scale(1.05); }
    .item__body { padding:1.1rem 1.1rem 1.4rem; }
    .item__name { font-family:'Fraunces',Georgia,serif; font-size:1.15rem; font-weight:400; color:#160F07; margin-bottom:.3rem; text-transform:capitalize; }
    .item__price { font-family:'Syne',sans-serif; font-size:.7rem; font-weight:700; color:#BF4E1E; letter-spacing:.04em; margin-bottom:1rem; }
    .item__btn { width:100%; font-family:'Syne',sans-serif; font-size:.55rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; padding:.7rem 1rem; background:#BF4E1E; color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem; transition:background .2s, transform .15s; }
    .item__btn:hover { background:#8A3512; transform:translateY(-1px); }

    /* Modal overlay */
    .cdv-modal-overlay { position:fixed; inset:0; background:rgba(22,15,7,.55); z-index:3000; display:flex; align-items:center; justify-content:center; padding:1.5rem; animation:aFadeIn .25s ease; }
    .cdv-modal { background:#FDFAF6; max-width:440px; width:100%; padding:2.5rem; position:relative; }
    .cdv-modal__close { position:absolute; top:1.25rem; right:1.25rem; background:none; border:none; cursor:pointer; color:rgba(22,15,7,.4); transition:color .2s; }
    .cdv-modal__close:hover { color:#BF4E1E; }
    .cdv-modal__title { font-family:'Fraunces',Georgia,serif; font-size:2rem; font-weight:200; color:#160F07; margin-bottom:.4rem; }
    .cdv-modal__sub { font-family:'Fraunces',Georgia,serif; font-size:.95rem; font-style:italic; color:rgba(22,15,7,.5); margin-bottom:1.75rem; line-height:1.55; }
    .cdv-modal__fields { display:flex; flex-direction:column; gap:1rem; margin-bottom:1.5rem; }
    .cdv-modal__fields label { display:flex; flex-direction:column; gap:.4rem; }
    .cdv-modal__fields span { font-family:'Syne',sans-serif; font-size:.52rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:rgba(22,15,7,.55); }
    .cdv-modal__fields input { border:1.5px solid rgba(22,15,7,.15); padding:.75rem 1rem; font-family:'DM Sans',sans-serif; font-size:.9rem; color:#160F07; background:#fff; outline:none; transition:border-color .2s, box-shadow .2s; }
    .cdv-modal__fields input:focus { border-color:#BF4E1E; box-shadow:0 0 0 3px rgba(191,78,30,.1); }
    .cdv-modal__actions { display:flex; gap:.75rem; }
    .cdv-modal__cancel { flex:1; font-family:'Syne',sans-serif; font-size:.56rem; font-weight:600; letter-spacing:.12em; text-transform:uppercase; padding:.85rem; background:rgba(22,15,7,.06); border:1.5px solid rgba(22,15,7,.12); color:#160F07; cursor:pointer; transition:border-color .2s, color .2s; }
    .cdv-modal__cancel:hover { border-color:#BF4E1E; color:#BF4E1E; }
    .cdv-modal__submit { flex:2; font-family:'Syne',sans-serif; font-size:.56rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; padding:.85rem; background:#25D366; color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem; transition:background .2s, transform .2s; }
    .cdv-modal__submit:hover { background:#1ea855; transform:translateY(-2px); }
    .cdv-modal__error { font-size:.82rem; color:#c0392b; margin-bottom:.75rem; padding:.6rem; background:rgba(192,57,43,.08); border-left:3px solid #c0392b; }

    /* Toast */
    .cdv-toast { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%) translateY(1rem); background:#160F07; color:#F2E0C0; font-family:'Syne',sans-serif; font-size:.6rem; font-weight:600; letter-spacing:.12em; text-transform:uppercase; padding:.85rem 2rem; z-index:9999; opacity:0; transition:opacity .35s, transform .35s; pointer-events:none; }
    .cdv-toast--show { opacity:1; transform:translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(styles);

  // ── INIT ─────────────────────────────────────────────────
  function init() {
    if (!listProductEl || !listCartEl) return;

    loadCart();
    updateCartCount();

    fetch('products.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        products = data;
        renderProducts();
        renderCart();
      })
      .catch(function (err) {
        console.error('[shop] Failed to load products.json:', err);
        if (listProductEl) {
          listProductEl.innerHTML = '<div class="cdv-fetch-error"><p>Impossible de charger les produits.</p></div>';
        }
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();