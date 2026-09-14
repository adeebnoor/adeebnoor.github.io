/* Owner key is kept in memory only. Every read/write is authenticated by the API. */
(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('site-inquiry-config').textContent);
  const ar = document.documentElement.lang === 'ar';
  const say = (en, arabic) => ar ? arabic : en;
  const login = document.getElementById('inbox-login');
  const content = document.getElementById('inbox-content');
  const list = document.getElementById('inbox-list');
  const status = document.getElementById('inbox-status');
  const filter = document.getElementById('inbox-filter');
  let ownerKey = '', rows = [], generation = 0, timer;
  const labels = { new: say('New', 'جديد'), pending_confirmation: say('Awaiting email confirmation', 'بانتظار تأكيد البريد'), contacted: say('Contacted', 'تم التواصل'), closed: say('Closed', 'مغلق') };
  function node(tag, text, className = '') { const n = document.createElement(tag); n.textContent = text; n.className = className; return n; }
  async function api(method, body) {
    const response = await fetch(config.endpoint, { method, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', apikey: config.publicAnonKey, Authorization: 'Bearer ' + config.publicAnonKey, 'x-analytics-key': ownerKey },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(response.status === 401 ? 'unauthorized' : 'unavailable');
    return response.json();
  }
  function lock() { generation++; ownerKey = ''; rows = []; list.replaceChildren(); content.hidden = true; login.hidden = false; clearTimeout(timer); }
  function render() {
    list.replaceChildren();
    const selected = rows.filter(row => filter.value === 'all' || row.status === filter.value);
    status.textContent = say('Requests shown: ', 'الطلبات المعروضة: ') + selected.length + say(' (latest 100).', ' (آخر 100 طلب).');
    if (!selected.length) { list.append(node('p', say('No requests in this view.', 'لا توجد طلبات ضمن هذا العرض.'))); return; }
    selected.forEach(row => {
      const card = node('article', '', 'audit-inbox-card');
      card.append(node('h2', row.kind === 'updates' ? say('Essay update request', 'طلب متابعة المقالات') : row.name));
      card.append(node('p', row.email + ' · ' + new Date(row.created_at).toLocaleString(ar ? 'ar-SA-u-nu-latn' : 'en-GB', { timeZone: 'Asia/Riyadh' })));
      card.append(node('p', [row.organization, row.audience, row.engagement, row.timeline, row.authority].filter(Boolean).join(' · ')));
      if (row.problem) card.append(node('p', row.problem));
      card.append(node('p', say('Reference: ', 'المرجع: ') + row.request_id));
      const label = node('label', say('Status ', 'الحالة '));
      const select = document.createElement('select');
      Object.entries(labels).forEach(([value, text]) => { const option = node('option', text); option.value = value; select.append(option); });
      select.value = row.status;
      select.addEventListener('change', async () => {
        select.disabled = true;
        try { await api('PATCH', { request_id: row.request_id, status: select.value }); row.status = select.value; render(); }
        catch { select.value = row.status; status.textContent = say('Status was not saved. Please retry.', 'لم تُحفظ الحالة. أعد المحاولة.'); }
        finally { select.disabled = false; }
      });
      label.append(select); card.append(label);
      const reply = node('a', say('Reply by email', 'الرد بالبريد')); reply.className = 'audit-button'; reply.href = 'mailto:' + encodeURIComponent(row.email); reply.rel = 'noreferrer';
      card.append(document.createTextNode(' '), reply);
      const remove = node('button', say('Delete request', 'حذف الطلب'), 'audit-button'); remove.type = 'button';
      remove.addEventListener('click', async () => {
        if (!confirm(say('Permanently delete this request?', 'حذف هذا الطلب نهائيًا؟'))) return;
        try { await api('DELETE', { request_id: row.request_id }); rows = rows.filter(item => item.request_id !== row.request_id); render(); }
        catch { status.textContent = say('Deletion failed.', 'تعذّر الحذف.'); }
      });
      card.append(document.createTextNode(' '), remove); list.append(card);
    });
  }
  async function load() {
    const id = ++generation;
    status.textContent = say('Loading…', 'جارٍ التحميل…');
    try { const result = await api('GET'); if (id !== generation) return; rows = result.items; login.hidden = true; content.hidden = false; render(); }
    catch (error) { if (id !== generation) return; lock(); status.textContent = error.message === 'unauthorized' ? say('The owner key was not accepted.', 'لم يُقبل مفتاح المالك.') : say('The inbox is unavailable. Please retry.', 'تعذّر فتح الصندوق. أعد المحاولة.'); }
  }
  login.addEventListener('submit', event => { event.preventDefault(); if (!login.reportValidity()) return; ownerKey = document.getElementById('inbox-key').value.trim(); document.getElementById('inbox-key').value = ''; clearTimeout(timer); timer = setTimeout(lock, 30 * 60 * 1000); load(); });
  filter.addEventListener('change', render);
  document.getElementById('inbox-refresh').addEventListener('click', load);
  document.getElementById('inbox-lock').addEventListener('click', () => { lock(); status.textContent = say('Inbox locked.', 'أُغلق الصندوق.'); });
  addEventListener('pagehide', lock);
})();
