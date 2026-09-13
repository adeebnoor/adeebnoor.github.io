// Native menus work before this script runs and when JavaScript is disabled.
(() => {
  const header = document.querySelector('.site-header');
  const menu = header?.querySelector('.site-mobile');
  if (!menu) return;
  const summary = menu.querySelector('summary');
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) || event.target.closest('a')) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      summary.focus();
    }
  });
  matchMedia('(min-width: 1151px)').addEventListener('change', () => { menu.open = false; });
  // Every translated page retains the same section IDs as its English counterpart.
  const syncLanguageLinks = () => {
    header.querySelectorAll('.site-language').forEach(link => {
      const destination = new URL(link.href);
      destination.hash = location.hash;
      link.href = destination.href;
    });
  };
  syncLanguageLinks();
  addEventListener('hashchange', syncLanguageLinks);
})();
