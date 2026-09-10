(() => {
  const nav = document.querySelector('.top .nav');
  const menu = nav?.querySelector('.menu');
  if (!nav || !menu) return;

  // Shared identity facts: one source for values that appear across the site.
  fetch('data/site_identity.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).then(data => {
    if (!data) return;
    document.querySelectorAll('.metric b,.stat b').forEach(el => {
      if (/^17\+\s*Years$/i.test(el.textContent.trim())) el.textContent = data.experience_label;
    });
    document.querySelectorAll('[data-site="experience"]').forEach(el => el.textContent = data.experience_label);
    document.querySelectorAll('[data-site="institutional-email"]').forEach(el => {
      el.textContent = data.institutional_email;
      if (el.tagName === 'A') el.href = 'mailto:' + data.institutional_email;
    });
  }).catch(() => {});

  // Backward-compatible routing: the public destination is now consistently "Contact".
  document.querySelectorAll('a[href="collaborate.html"], a[href="./collaborate.html"]').forEach(a => {
    a.setAttribute('href', 'contact.html');
  });

  // Keep one predictable Contact entry in the primary navigation.
  const oldConnect = menu.querySelector('.connect')?.closest('.navitem');
  if (oldConnect) oldConnect.remove();
  const contactAnchor = [...menu.querySelectorAll(':scope > .navitem > a')].find(a =>
    /collaborate|contact/i.test(a.textContent) || /contact\.html$/.test(a.getAttribute('href') || '')
  );
  if (contactAnchor) {
    contactAnchor.textContent = 'Contact';
    contactAnchor.setAttribute('href', 'contact.html');
  } else {
    const item = document.createElement('div');
    item.className = 'navitem';
    item.innerHTML = '<a href="contact.html">Contact</a>';
    menu.appendChild(item);
  }

  // Add a simple language gateway without creating another navigation layer.
  if (!menu.querySelector('a[href="ar/"],a[href="../ar/"]')) {
    const item = document.createElement('div');
    item.className = 'navitem nav-lang';
    item.innerHTML = '<a href="ar/" lang="ar">العربية</a>';
    menu.appendChild(item);
  }

  // Keep the KAUST appointment consistent with the current public KAUST profile.
  document.querySelectorAll('.career-row,.cv-role').forEach(row => {
    const heading = row.querySelector('h3');
    if (!heading || !/KAUST|Computational Bioscience Research Center/i.test(heading.textContent)) return;
    const when = row.querySelector('.career-year,.cv-when');
    if (when && /2016.*Present/i.test(when.textContent)) when.textContent = '2016–2026';
    heading.textContent = heading.textContent
      .replace(/Visiting Professor \(Adjunct(?:, part-time)?\)/i, 'Visiting Professor (former)')
      .replace(/Visiting Professor \(Adjunct\)/i, 'Visiting Professor (former)');
  });

  // Mobile navigation.
  const button = document.createElement('button');
  button.className = 'menu-toggle';
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'primary-menu');
  button.setAttribute('aria-label', 'Open navigation menu');
  button.innerHTML = '<span></span><span></span><span></span><b>Menu</b>';
  menu.id = 'primary-menu';
  nav.insertBefore(button, menu);

  const close = () => {
    nav.classList.remove('menu-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation menu');
  };
  button.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  const mq = matchMedia('(min-width: 761px)');
  if (mq.addEventListener) mq.addEventListener('change', close);
})();