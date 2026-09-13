// Anonymous portfolio analytics. Failure must never interrupt the public site.
(() => {
  'use strict';

  const OWNER = 'adeebnoor.github.io';
  const VISITOR_KEY = 'adeeb_analytics_visitor';
  const SESSION_KEY = 'adeeb_analytics_session';
  const OPTOUT_KEY = 'adeeb_analytics_optout';
  const DAY = 86400000;
  const SESSION_LENGTH = 30 * 60 * 1000;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const EXCLUDED = /(?:^|\/)(?:404\.html|collaborate\.html|analytics(?:\.html)?|admin(?:\.html)?|owner(?:\.html)?)(?:\/|$)/i;
  const FILE = /\.(?:pdf|zip|docx?|pptx?|xlsx?|csv|json|txt|epub)(?:$)/i;
  const PROJECT = /^\/(?:Miyar|CPIT)(?:\/|$)/;
  const TARGET_ONLY = new Set(['/privacy.html', '/ar/privacy.html']);
  const queue = [];
  const retries = new Set();
  let timer;
  let preferenceEpoch = 0;
  let fallbackVisitor;
  let fallbackSession;

  function stored(storage, key) {
    try { return window[storage].getItem(key); } catch (_) { return null; }
  }

  function save(storage, key, value) {
    try { window[storage].setItem(key, JSON.stringify(value)); } catch (_) { /* Storage is optional. */ }
  }

  function permitted() {
    return location.hostname === OWNER && !navigator.webdriver &&
      !navigator.globalPrivacyControl && !document.prerendering &&
      !['1', 'yes'].includes(String(navigator.doNotTrack || window.doNotTrack || '').toLowerCase()) &&
      stored('localStorage', OPTOUT_KEY) !== '1';
  }

  function uuid() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function readObject(storage, key) {
    try { return JSON.parse(stored(storage, key) || 'null'); } catch (_) { return null; }
  }

  function visitor() {
    const now = Date.now();
    const existing = readObject('localStorage', VISITOR_KEY) || fallbackVisitor;
    if (existing && UUID.test(existing.id) && Number.isFinite(existing.expires_at) &&
        existing.expires_at > now && existing.expires_at <= now + 30 * DAY) return existing.id;
    fallbackVisitor = { id: uuid(), expires_at: now + 30 * DAY };
    save('localStorage', VISITOR_KEY, fallbackVisitor);
    return fallbackVisitor.id;
  }

  function session() {
    const now = Date.now();
    const existing = readObject('sessionStorage', SESSION_KEY) || fallbackSession;
    const valid = existing && UUID.test(existing.id) && Number.isFinite(existing.last_seen) &&
      existing.last_seen <= now && now - existing.last_seen < SESSION_LENGTH;
    fallbackSession = { id: valid ? existing.id : uuid(), last_seen: now };
    save('sessionStorage', SESSION_KEY, fallbackSession);
    return fallbackSession.id;
  }

  function canonical(path) {
    return path.replace(/\/index\.html$/, '/');
  }

  function safeDestination(url) {
    // Query strings, fragments and URL credentials never enter telemetry.
    let path = url.pathname;
    try {
      if (decodeURIComponent(path).includes('@')) path = '/';
    } catch (_) { path = '/'; }
    return url.origin + (path.length <= 400 ? canonical(path) : '/');
  }

  function referrerHost() {
    try {
      const url = new URL(document.referrer);
      return /^https?:$/.test(url.protocol) ? url.hostname.slice(0, 253) : '';
    } catch (_) { return ''; }
  }

  // Only this generated configuration and registered public routes can collect.
  const config = document.getElementById('portfolio-analytics');
  if (!config || !permitted()) return;
  let endpoint, key, pages, page, visitorId;
  try {
    endpoint = new URL(config.dataset.endpoint);
    key = config.dataset.key;
    const values = JSON.parse(config.dataset.pages);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
        typeof key !== 'string' || !key || key.length > 4096 || key.startsWith('sb_secret_') ||
        !Array.isArray(values)) return;
    // This browser credential must be the public legacy anon key, never a service key.
    const parts = key.split('.');
    if (parts.length !== 3) return;
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
    if (claims.role !== 'anon') return;
    pages = new Set(values.filter(value => typeof value === 'string' &&
      /^\/(?!\/)[^?#]*$/.test(value) && !EXCLUDED.test(value)).map(canonical));
    page = canonical(location.pathname);
    if (!pages.has(page) || EXCLUDED.test(page) || TARGET_ONLY.has(page)) return;
    visitorId = visitor();
  } catch (_) { return; }

  const language = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const device = window.innerWidth < 768 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop';
  const referrer = referrerHost();

  function discard() {
    queue.length = 0;
    clearTimeout(timer);
    timer = undefined;
    retries.forEach(id => clearTimeout(id));
    retries.clear();
    preferenceEpoch += 1;
  }

  function retry(payload, epoch) {
    if (epoch !== preferenceEpoch) return;
    if (!permitted()) { discard(); return; }
    const id = setTimeout(() => {
      retries.delete(id);
      send(payload, 1, epoch);
    }, 1200);
    retries.add(id);
  }

  function send(payload, attempt = 0, epoch = preferenceEpoch) {
    if (epoch !== preferenceEpoch) return;
    if (!permitted()) { discard(); return; }
    let request;
    try {
      request = fetch(endpoint.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, apikey: key },
        body: JSON.stringify(payload),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        keepalive: true
      });
    } catch (_) {
      if (attempt === 0) retry(payload, epoch);
      return;
    }
    Promise.resolve(request).then(response => {
      if (!response.ok && (response.status === 429 || response.status >= 500) && attempt === 0) {
        retry(payload, epoch);
      }
    }).catch(() => {
      if (attempt === 0) retry(payload, epoch);
    });
  }

  function flush() {
    clearTimeout(timer);
    timer = undefined;
    if (!permitted()) { discard(); return; }
    while (queue.length) {
      const sessionId = queue[0].sessionId;
      const events = [];
      while (queue.length && events.length < 10 && queue[0].sessionId === sessionId) {
        events.push(queue.shift().event);
      }
      send({ site: OWNER, visitor_id: visitorId, session_id: sessionId, events });
    }
  }

  function track(type, target = '', urgent = false) {
    if (!permitted()) { discard(); return; }
    try {
      const event = {
        event_id: uuid(), type, page, target, language,
        referrer_host: referrer, device
      };
      if (queue.length >= 50) queue.shift();
      queue.push({ sessionId: session(), event });
      if (urgent || queue.length >= 10) flush();
      else if (timer === undefined) timer = setTimeout(flush, 150);
    } catch (_) { /* An analytics problem never becomes a page problem. */ }
  }

  function classify(element) {
    if (element.closest('[data-analytics-ignore]') || element.classList.contains('site-skip')) return null;
    if (element.tagName === 'BUTTON') {
      const cv = page.match(/\/(academic|executive)-cv\.html$/);
      if (cv && /\bwindow\.print\s*\(/.test(element.getAttribute('onclick') || '')) {
        return ['cv_print_request', cv[1]];
      }
      if (/^\/(?:ar\/)?demo\/$/.test(page) && element.id === 'run' && !element.disabled) return ['demo_run', 'ridi'];
      return null;
    }
    const raw = element.getAttribute('href');
    if (!raw || raw === '#') return null;
    let url;
    try { url = new URL(raw, location.href); } catch (_) { return null; }
    if (url.protocol === 'mailto:') return ['contact_click', 'email'];
    if (url.protocol === 'tel:') return ['contact_click', 'phone'];
    if (!/^https?:$/.test(url.protocol)) return null;
    if (url.origin === location.origin && EXCLUDED.test(canonical(url.pathname))) return null;
    if (element.hasAttribute('download') || FILE.test(url.pathname)) return ['download_click', safeDestination(url)];
    const path = canonical(url.pathname);
    if (url.origin === location.origin) {
      if (EXCLUDED.test(path)) return null;
      if (PROJECT.test(path)) return ['project_click', safeDestination(url)];
      if (!pages.has(path) && !TARGET_ONLY.has(path)) return null;
      if (element.classList.contains('site-language')) return ['language_switch', path];
      if (path === page && url.hash) {
        let id;
        try { id = decodeURIComponent(url.hash.slice(1)); } catch (_) { return null; }
        if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(id) || !document.getElementById(id)) return null;
        return ['link_click', `${path}#${id}`];
      }
      return ['link_click', path];
    }
    return ['outbound_click', safeDestination(url)];
  }

  function activation(event) {
    if (!permitted()) { discard(); return; }
    // Ignore scripted activations, right-clicks and duplicate auxclick delivery.
    if (event.isTrusted === false || (event.type === 'auxclick' ? event.button !== 1 : event.button > 0)) return;
    try {
      const target = event.target?.closest ? event.target : event.target?.parentElement;
      const element = target?.closest('a[href], button');
      if (!element || (event.type === 'auxclick' && element.tagName !== 'A')) return;
      const result = classify(element);
      if (result) track(result[0], result[1], true);
    } catch (_) { /* Navigation and printing keep their native behavior. */ }
  }

  document.addEventListener('click', activation, true);
  document.addEventListener('auxclick', activation, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
  window.addEventListener('portfolio-analytics-preference-change', () => {
    if (!permitted()) discard();
  });
  window.addEventListener('storage', event => {
    if ((event.key === OPTOUT_KEY || event.key === null) && !permitted()) discard();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) track('page_view');
  });
  track('page_view');
})();
