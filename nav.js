// Shared navigation. All links remain available without JavaScript.
(() => {
  const nav = document.querySelector('.top .nav');
  const menu = nav?.querySelector('.menu');
  if (!nav || !menu) return;
  const button = document.createElement('button');
  button.className = 'menu-toggle';
  button.type = 'button';
  button.textContent = '☰ Menu';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'primary-menu');
  button.setAttribute('aria-label', 'Open navigation menu');
  menu.id = 'primary-menu';
  nav.insertBefore(button, menu);
  nav.classList.add('nav-enhanced');
  const close = (restoreFocus = false) => {
    nav.classList.remove('menu-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation menu');
    if (restoreFocus) button.focus();
  };
  button.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('click', event => { if (!nav.contains(event.target)) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('menu-open')) close(true);
  });
  matchMedia('(min-width: 1001px)').addEventListener('change', () => close());
  const current = location.pathname.replace(/index\.html$/, '');
  menu.querySelectorAll('a').forEach(link => {
    if (new URL(link.href).pathname.replace(/index\.html$/, '') === current) link.setAttribute('aria-current', 'page');
  });
})();
