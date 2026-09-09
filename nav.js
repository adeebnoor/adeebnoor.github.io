(() => {
  const nav = document.querySelector('.top .nav');
  const menu = nav?.querySelector('.menu');
  if (!nav || !menu) return;
  const button = document.createElement('button');
  button.className = 'menu-toggle';
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'primary-menu');
  button.setAttribute('aria-label', 'Open navigation menu');
  button.innerHTML = '<span></span><span></span><span></span><b>Menu</b>';
  menu.id = 'primary-menu';
  nav.insertBefore(button, menu);
  const close = () => { nav.classList.remove('menu-open'); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', 'Open navigation menu'); };
  button.addEventListener('click', () => { const open = nav.classList.toggle('menu-open'); button.setAttribute('aria-expanded', String(open)); button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu'); });
  menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); button.focus(); } });
  matchMedia('(min-width: 761px)').addEventListener('change', close);
})();
