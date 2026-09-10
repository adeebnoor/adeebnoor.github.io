(() => {
  const root = document.documentElement.dataset.base || '';

  // Hard-fix the homepage portrait so it renders even if GitHub Pages
  // serves a stale/missing relative asset. Use the repository raw file
  // as the canonical runtime source for both English and Arabic pages.
  const portrait = document.querySelector('.portrait-frame img');
  if (portrait) {
    const rawPortrait = 'https://raw.githubusercontent.com/adeebnoor/adeebnoor.github.io/main/assets/hero-right.webp?v=20260910-2';
    portrait.src = rawPortrait;
    portrait.width = 440;
    portrait.height = 335;
    portrait.style.display = 'block';
  }

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