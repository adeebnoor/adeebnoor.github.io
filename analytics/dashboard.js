/* Private owner interface. Access keys never enter URLs or public markup. */
(() => {
  'use strict';
  const root = document.querySelector('[data-analytics-dashboard]');
  if (!root) return;
  const ar = document.documentElement.lang === 'ar';
  const locale = ar ? 'ar-SA' : 'en-GB';
  const say = (en, arabic) => ar ? arabic : en;
  const get = id => document.getElementById('analytics-' + id);
  const status = get('status');
  const content = get('content');
  const login = get('login');
  const form = get('login-form');
  const keyInput = get('key');
  const range = get('range');
  const refresh = get('refresh');
  const storageKey = 'adeeb_analytics_owner_session';
  const maxSessionAge = 8 * 60 * 60 * 1000;
  let accessKey = '';
  let accessExpiresAt = 0;
  let expirationTimer;
  let activeRequest;
  let generation = 0;
  const types = {
    page_view: say('Page view', 'مشاهدة صفحة'),
    link_click: say('Internal link', 'رابط داخلي'),
    project_click: say('Project link', 'رابط مشروع'),
    outbound_click: say('External link', 'رابط خارجي'),
    contact_click: say('Contact link', 'رابط تواصل'),
    language_switch: say('Language switch', 'تغيير اللغة'),
    download_click: say('Download request', 'طلب تنزيل'),
    cv_print_request: say('CV print / PDF request', 'طلب طباعة السيرة أو حفظها'),
    demo_run: say('RIDI demo run', 'تشغيل عرض RIDI'),
  };
  function number(value) {
    const parsed = Number(value);
    return new Intl.NumberFormat(locale).format(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
  }
  function date(value, time = false) {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Riyadh', calendar: 'gregory', year: 'numeric', month: 'short', day: 'numeric',
      ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(parsed);
  }
  function message(text, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }
  function clearSaved() {
    try { sessionStorage.removeItem(storageKey); } catch (_) { /* Storage is optional. */ }
  }
  function lock(text = '', error = false) {
    generation += 1;
    if (activeRequest) activeRequest.abort();
    activeRequest = null;
    accessKey = '';
    accessExpiresAt = 0;
    clearTimeout(expirationTimer);
    clearSaved();
    keyInput.value = '';
    content.hidden = true;
    login.hidden = false;
    root.querySelectorAll('[data-metric]').forEach(node => { node.textContent = '—'; });
    ['pages', 'destinations', 'events', 'daily'].forEach(id => get(id).replaceChildren());
    get('period').textContent = '';
    get('retention').textContent = '';
    refresh.disabled = false;
    form.querySelector('button').disabled = false;
    root.removeAttribute('aria-busy');
    message(text, error);
  }
  function setExpiration() {
    clearTimeout(expirationTimer);
    expirationTimer = setTimeout(() => lock(say('Your access session expired. Enter the key again.', 'انتهت جلسة الدخول. أدخل المفتاح مرة أخرى.')), Math.max(0, accessExpiresAt - Date.now()));
  }
  function el(tag, text, cls) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (cls) node.className = cls;
    return node;
  }
  function cell(row, text, direction = false) {
    const td = el('td');
    if (direction) td.appendChild(el('bdi', text));
    else td.textContent = String(text);
    row.appendChild(td);
    return td;
  }
  function rows(id, items, columns, render) {
    const body = get(id);
    body.replaceChildren();
    if (!Array.isArray(items) || items.length === 0) {
      const row = el('tr');
      const empty = cell(row, say('No activity in this period.', 'لا يوجد نشاط في هذه الفترة.'));
      empty.colSpan = columns;
      empty.className = 'analytics-empty-cell';
      body.appendChild(row);
      return;
    }
    items.forEach(item => {
      const row = el('tr');
      render(row, item);
      body.appendChild(row);
    });
  }
  function target(value) {
    if (value === 'email') return say('Email', 'البريد الإلكتروني');
    if (value === 'phone') return say('Phone', 'الهاتف');
    if (value === 'academic') return say('Academic CV', 'السيرة الأكاديمية');
    if (value === 'executive') return say('Executive CV', 'السيرة التنفيذية');
    if (value === 'ridi') return say('RIDI demo', 'عرض RIDI');
    return value || '—';
  }
  function eventType(type) { return types[type] || say('Activity', 'نشاط'); }
  function identifier(value, label) {
    const whole = typeof value === 'string' ? value : '';
    const span = el('span', label + ': ' + (whole ? whole.slice(0, 8) + '…' : '—'), 'analytics-id');
    span.title = whole;
    span.setAttribute('aria-label', label + ': ' + whole);
    return span;
  }
  function renderDaily(items) {
    const chart = get('daily');
    chart.replaceChildren();
    const daily = Array.isArray(items) ? items.slice(-90) : [];
    get('daily-empty').hidden = daily.length > 0;
    if (!daily.length) return;
    const max = Math.max(1, ...daily.map(item => Math.max(0, Number(item.visitors) || 0)));
    for (const item of daily) {
      const count = Math.max(0, Number(item.visitors) || 0);
      const day = new Date(String(item.date).slice(0, 10) + 'T12:00:00Z');
      const shortDate = Number.isFinite(day.getTime()) ? new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Riyadh', calendar: 'gregory', month: 'numeric', day: 'numeric' }).format(day) : '—';
      const label = date(day) + ' · ' + number(count) + ' ' + say('approximate visitors', 'زوار تقريبيون') + ' · ' + number(item.page_views) + ' ' + say('page views', 'مشاهدات صفحات');
      const bar = el('div', undefined, 'analytics-bar');
      bar.setAttribute('role', 'listitem');
      bar.setAttribute('aria-label', label);
      bar.title = label;
      const value = el('span', number(count), 'analytics-bar-value');
      value.setAttribute('aria-hidden', 'true');
      const column = el('div', undefined, 'analytics-bar-column');
      column.setAttribute('aria-hidden', 'true');
      const fill = el('span', undefined, 'analytics-bar-fill');
      fill.style.height = (count / max * 100) + '%';
      if (count === 0) fill.style.opacity = '.2';
      column.appendChild(fill);
      const caption = el('span', shortDate);
      caption.setAttribute('aria-hidden', 'true');
      bar.append(value, column, caption);
      chart.appendChild(bar);
    }
  }
  function render(data) {
    const totals = data.totals;
    root.querySelectorAll('[data-metric]').forEach(node => { node.textContent = number(totals[node.dataset.metric]); });
    get('empty').hidden = Number(totals.total_events ?? (Number(totals.page_views || 0) + Number(totals.link_clicks || 0) + Number(totals.print_requests || 0) + Number(totals.demo_runs || 0))) > 0;
    const period = data.period || {};
    get('period').textContent = date(period.start) + ' — ' + date(period.end) + ' · ' + say('Riyadh time', 'بتوقيت الرياض') + ' · ' + say('Updated ', 'آخر تحديث: ') + date(data.generated_at, true);
    get('retention').textContent = say('Collection started: ', 'بداية التسجيل: ') + date(data.collection_started_at, true) + ' · ' + say('The dashboard shows the last 90 days. Older events are removed on recording or dashboard access, with a cleanup check at most once a day.', 'تعرض اللوحة آخر ٩٠ يومًا. تُحذف الأحداث الأقدم عند التسجيل أو فتح اللوحة، مع فحص التنظيف مرة واحدة يوميًا بحد أقصى.');
    renderDaily(data.daily);
    rows('pages', data.top_pages, 3, (row, item) => {
      cell(row, item.page || '/', true);
      cell(row, number(item.views));
      cell(row, number(item.visitors));
    });
    rows('destinations', data.top_destinations, 3, (row, item) => {
      cell(row, target(item.target), true);
      cell(row, eventType(item.type));
      cell(row, number(item.clicks));
    });
    rows('events', Array.isArray(data.recent_events) ? data.recent_events.slice(0, 100) : [], 5, (row, item) => {
      cell(row, date(item.occurred_at, true));
      cell(row, eventType(item.type));
      const location = cell(row, item.page || '/', true);
      if (item.target) location.appendChild(el('bdi', target(item.target), 'analytics-cell-detail'));
      const ids = cell(row, '');
      ids.appendChild(identifier(item.visitor_id, say('Browser', 'المتصفح')));
      ids.appendChild(identifier(item.session_id, say('Session', 'الجلسة')));
      const devices = { mobile: say('Mobile', 'جوال'), tablet: say('Tablet', 'جهاز لوحي'), desktop: say('Desktop', 'حاسوب'), unknown: say('Unknown device', 'جهاز غير معروف') };
      const device = cell(row, devices[item.device] || devices.unknown);
      device.appendChild(el('bdi', item.referrer_host || say('Direct / unavailable', 'مباشر / غير متاح'), 'analytics-cell-detail'));
    });
    login.hidden = true;
    content.hidden = false;
  }
  async function load() {
    if (!accessKey || accessExpiresAt <= Date.now()) {
      lock(say('Enter your private access key.', 'أدخل مفتاح الدخول الخاص.'));
      return;
    }
    if (activeRequest) activeRequest.abort();
    const requestGeneration = ++generation;
    const controller = new AbortController();
    activeRequest = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    refresh.disabled = true;
    form.querySelector('button').disabled = true;
    root.setAttribute('aria-busy', 'true');
    message(say('Loading recorded activity…', 'جارٍ تحميل النشاط المسجّل…'));
    try {
      const endpoint = new URL(root.dataset.endpoint);
      endpoint.searchParams.set('days', ['1', '7', '30', '90'].includes(range.value) ? range.value : '30');
      const response = await fetch(endpoint.toString(), {
        method: 'GET', headers: { 'X-Analytics-Key': accessKey, 'Accept': 'application/json' },
        credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal,
      });
      if (requestGeneration !== generation) return;
      if (response.status === 401 || response.status === 403) {
        lock(say('The access key was not accepted. Check the key and try again.', 'لم يُقبل مفتاح الدخول. تحقّق من المفتاح وأعد المحاولة.'), true);
        return;
      }
      if (!response.ok) throw new Error('request-failed');
      const data = await response.json();
      if (requestGeneration !== generation) return;
      if (!data || data.site !== 'adeebnoor.github.io' || !data.totals || typeof data.totals !== 'object') throw new Error('invalid-response');
      render(data);
      message(say('Recorded activity loaded.', 'تم تحميل النشاط المسجّل.'));
      keyInput.value = '';
    } catch (error) {
      if (requestGeneration !== generation) return;
      message(error.name === 'AbortError'
        ? say('The request timed out. Try refreshing the dashboard.', 'انتهت مهلة الطلب. جرّب تحديث اللوحة.')
        : say('The dashboard could not load. Check your connection, then try again.', 'تعذّر تحميل اللوحة. تحقّق من اتصالك ثم أعد المحاولة.'), true);
    } finally {
      clearTimeout(timeout);
      if (requestGeneration === generation) {
        activeRequest = null;
        refresh.disabled = false;
        form.querySelector('button').disabled = false;
        root.removeAttribute('aria-busy');
      }
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const entered = keyInput.value.trim();
    if (entered.length < 43 || entered.length > 256) {
      message(say('Enter the complete private key.', 'أدخل مفتاح الدخول الخاص كاملًا.'), true);
      return;
    }
    accessKey = entered;
    accessExpiresAt = Date.now() + maxSessionAge;
    clearSaved();
    if (get('remember').checked) {
      try { sessionStorage.setItem(storageKey, JSON.stringify({ key: accessKey, expiresAt: accessExpiresAt })); }
      catch (_) { /* Memory-only access still works. */ }
    }
    setExpiration();
    load();
  });
  range.addEventListener('change', load);
  refresh.addEventListener('click', load);
  get('logout').addEventListener('click', () => { lock(say('Dashboard locked.', 'تم قفل اللوحة.')); keyInput.focus(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && accessKey && Date.now() >= accessExpiresAt) lock(say('Your access session expired. Enter the key again.', 'انتهت جلسة الدخول. أدخل المفتاح مرة أخرى.'));
  });
  // Enable credential entry only after the JS-only submit handler is installed.
  keyInput.disabled = false;
  form.querySelector('button').disabled = false;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved.key === 'string' && saved.key.length >= 32 && saved.key.length <= 256 && Number.isFinite(saved.expiresAt) && saved.expiresAt > Date.now() && saved.expiresAt <= Date.now() + maxSessionAge) {
      accessKey = saved.key;
      accessExpiresAt = saved.expiresAt;
      get('remember').checked = true;
      setExpiration();
      load();
    } else clearSaved();
  } catch (_) { clearSaved(); }
})();
