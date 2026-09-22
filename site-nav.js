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

  // Back-to-top control: unobtrusive until the page has meaningful scroll depth.
  const backTop = document.createElement('button');
  backTop.className = 'site-back-top';
  backTop.type = 'button';
  backTop.setAttribute('aria-label', document.documentElement.lang === 'ar' ? 'العودة إلى الأعلى' : 'Back to top');
  backTop.textContent = '↑';
  document.body.appendChild(backTop);
  const syncBackTop = () => { backTop.dataset.visible = scrollY > 650 ? 'true' : 'false'; };
  addEventListener('scroll', syncBackTop, { passive: true });
  syncBackTop();
  backTop.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));

  // Compact sticky quick links for the longest portfolio pages.
  const page = location.pathname.replace(/\/index\.html$/, '/');
  const ar = document.documentElement.lang === 'ar';
  const sets = {
    '/about.html': [['career-milestones','Career milestones','المحطات المهنية'],['recognition','Recognition','التكريم'],['open-source','Open work','العمل المفتوح']],
    '/research.html': [['ndi-lab','Research initiative','المبادرة البحثية'],['ai-ethics','AI ethics','أخلاقيات الذكاء الاصطناعي'],['open-source','Open work','العمل المفتوح']],
    '/ventures.html': [['miyar','MIYAR','MIYAR'],['kinetic-hr','Kinetic HR','Kinetic HR'],['additional-systems','More systems','أنظمة إضافية']],
    '/impact.html': [['national-workforce','National workforce','القوى العاملة الوطنية'],['hospital-modernization','Digital health','الصحة الرقمية'],['institutional-context','Institutional context','السياق المؤسسي']]
  };
  const base = page.startsWith('/ar/') ? page.slice(3) : page;
  const configured = sets[base] || [];
  const visible = configured.filter(([id]) => document.getElementById(id));
  if (visible.length >= 2) {
    const nav = document.createElement('nav');
    nav.className = 'site-quick-nav';
    nav.setAttribute('aria-label', ar ? 'روابط سريعة في الصفحة' : 'On this page');
    nav.innerHTML = '<b>' + (ar ? 'في هذه الصفحة' : 'On this page') + '</b>' +
      visible.map(([id,en,arabic]) => '<a href="#' + id + '">' + (ar ? arabic : en) + '</a>').join('');
    document.body.appendChild(nav);
  }
})();
