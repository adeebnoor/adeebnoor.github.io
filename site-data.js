(() => {
  const root = document.documentElement.dataset.base || '';
  fetch(root + 'data/site_identity.json', {cache:'no-store'})
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return;
      document.querySelectorAll('[data-site="experience"]').forEach(el => el.textContent = data.experience_label);
      document.querySelectorAll('[data-site="institutional-email"]').forEach(el => {
        el.textContent = data.institutional_email;
        if (el.tagName === 'A') el.href = 'mailto:' + data.institutional_email;
      });
    }).catch(() => {});
})();