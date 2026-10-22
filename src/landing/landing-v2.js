// Landing v2 interactions - vanilla port of the React prototype (no framework).
(function () {
  var reduce = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function goTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce() ? 'auto' : 'smooth' });
    try { history.replaceState(null, '', '#' + id); } catch (_) { /* sandboxed */ }
    var h = el.querySelector('h2');
    if (h) { h.classList.add('flash'); setTimeout(function () { h.classList.remove('flash'); }, 1400); }
  }

  var hdr = document.querySelector('.hdr');
  var burger = document.getElementById('burger');
  function closeMenu() {
    if (!hdr.classList.contains('open')) return;
    hdr.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }
  document.querySelectorAll('[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); closeMenu(); goTo(a.getAttribute('data-scroll')); });
  });
  var onScroll = function () { hdr.classList.toggle('scrolled', window.scrollY > 24); };
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  burger.addEventListener('click', function () {
    var open = hdr.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  // Story: 5-stage switcher with arrows, tabs and touch swipe.
  var story = document.querySelector('.story');
  if (story) {
    var arts = Array.prototype.slice.call(story.querySelectorAll('.stage-art'));
    var copies = Array.prototype.slice.call(story.querySelectorAll('.st-copy'));
    var tabs = Array.prototype.slice.call(story.querySelectorAll('.stages button'));
    var prev = story.querySelector('.arrows .prev');
    var next = story.querySelector('.arrows .next');
    var count = story.querySelector('.arrows .n');
    var s = 0;
    var show = function (n) {
      s = Math.max(0, Math.min(arts.length - 1, n));
      arts.forEach(function (el, i) { el.hidden = i !== s; });
      copies.forEach(function (el, i) { el.hidden = i !== s; });
      tabs.forEach(function (b, i) {
        b.classList.toggle('on', i === s);
        if (i === s) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      prev.disabled = s === 0;
      next.disabled = s === arts.length - 1;
      count.textContent = (s + 1) + ' / ' + arts.length;
    };
    tabs.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });
    prev.addEventListener('click', function () { show(s - 1); });
    next.addEventListener('click', function () { show(s + 1); });
    var tx = 0, body = story.querySelector('.stage-body');
    body.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    body.addEventListener('touchend', function (e) {
      var d = e.changedTouches[0].clientX - tx;
      if (Math.abs(d) > 50) show(s + (d < 0 ? 1 : -1));
    }, { passive: true });
    show(0);
  }

  // Moments: card rail with steppers + per-occasion detail views.
  var moments = document.querySelector('.moments');
  var prArt = document.querySelector('.pr-art');
  var prZoomWrap = document.querySelector('.pr-zoom-wrap');
  function closeZoom() {
    if (!prZoomWrap || prZoomWrap.hidden) return;
    prZoomWrap.hidden = true;
    prArt.setAttribute('aria-pressed', 'false');
    prArt.setAttribute('aria-label', 'Enlarge image');
  }
  if (moments) {
    var grid = moments.querySelector('.mo-grid');
    var details = Array.prototype.slice.call(moments.querySelectorAll('.detail'));
    var rail = moments.querySelector('.rail');
    var cards = Array.prototype.slice.call(rail.querySelectorAll('.occ'));
    var dots = Array.prototype.slice.call(moments.querySelectorAll('.dots i'));
    var lb = moments.querySelector('.rail-btn.l');
    var rb = moments.querySelector('.rail-btn.r');
    var idx = 0;
    var step = function (d) {
      idx = Math.max(0, Math.min(cards.length - 1, idx + d));
      rail.scrollTo({ left: cards[idx].offsetLeft - 8, behavior: reduce() ? 'auto' : 'smooth' });
      cards.forEach(function (c, i) { c.classList.toggle('on', i === idx); });
      dots.forEach(function (dt, i) { dt.classList.toggle('on', i === idx); });
      lb.disabled = idx === 0;
      rb.disabled = idx === cards.length - 1;
    };
    lb.addEventListener('click', function () { step(-1); });
    rb.addEventListener('click', function () { step(1); });
    var closeDetail = function () { details.forEach(function (d) { d.hidden = true; }); grid.hidden = false; };
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        grid.hidden = true;
        details.forEach(function (d) { d.hidden = d.getAttribute('data-occ') !== c.getAttribute('data-occ'); });
      });
    });
    moments.querySelectorAll('.detail .back, .detail .close').forEach(function (b) { b.addEventListener('click', closeDetail); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDetail(); closeZoom(); closeMenu(); } });
  }

  // Promise: image zoom toggle.
  if (prArt && prZoomWrap) {
    prArt.addEventListener('click', function () {
      var showZoom = prZoomWrap.hidden;
      prZoomWrap.hidden = !showZoom;
      prArt.setAttribute('aria-pressed', String(showZoom));
      prArt.setAttribute('aria-label', showZoom ? 'Shrink image' : 'Enlarge image');
    });
    var prc = prZoomWrap.querySelector('.close');
    if (prc) prc.addEventListener('click', closeZoom);
  }
})();
