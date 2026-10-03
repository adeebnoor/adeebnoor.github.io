// Footer visitor count. Reads one aggregate number; sends no identifiers and
// stays hidden if the count is unavailable.
(() => {
  'use strict';
  const node = document.querySelector('[data-visitor-count]');
  if (!node || !window.fetch) return;
  const ar = document.documentElement.lang === 'ar';
  fetch(node.dataset.endpoint, { credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((data) => {
      const count = Number(data && data.visitors_90d);
      if (!Number.isFinite(count) || count < 1) return;
      const value = new Intl.NumberFormat(ar ? 'ar-SA' : 'en-US').format(count);
      node.textContent = ar ? value + ' زائر خلال آخر 90 يومًا' : value + ' visitors in the last 90 days';
      node.hidden = false;
    })
    .catch(() => {});
})();
