// Native details remains functional without JavaScript.
(() => {
  const menu = document.querySelector('.mobile-nav');
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
  matchMedia('(min-width: 1001px)').addEventListener('change', () => { menu.open = false; });
})();
