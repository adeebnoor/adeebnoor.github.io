// Contract tests use a VM and DOM stubs: no browser or live telemetry is involved.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../analytics.js', import.meta.url), 'utf8');
const publicKey = `header.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.signature`;
const registered = ['/', '/ar/', '/about.html', '/ar/about.html', '/academic-cv.html',
  '/ar/academic-cv.html', '/executive-cv.html', '/ar/executive-cv.html', '/demo/', '/ar/demo/',
  '/404.html', '/collaborate.html', '/analytics/'];

function environment(options = {}) {
  let now = 1800000000000;
  let timerId = 0;
  const requests = [], writes = [], handlers = new Map(), timers = new Map();
  const local = new Map(Object.entries(options.local || {}));
  const session = new Map(Object.entries(options.session || {}));
  const location = new URL(options.url || 'https://adeebnoor.github.io/about.html?private=value#ignored');
  const storage = (values, name) => ({
    getItem(key) { if (options.blockStorage) throw new Error('Storage unavailable'); return values.get(key) ?? null; },
    setItem(key, value) { if (options.blockStorage) throw new Error('Storage unavailable'); values.set(key, value); writes.push([name, key]); }
  });
  const addListener = (type, fn) => handlers.set(type, [...(handlers.get(type) || []), fn]);
  const script = { dataset: {
    endpoint: 'https://example.supabase.co/functions/v1/portfolio-collect',
    key: options.key || publicKey, pages: JSON.stringify(options.pages || registered)
  } };
  const document = {
    documentElement: { lang: location.pathname.startsWith('/ar/') ? 'ar' : 'en' },
    referrer: options.referrer || 'https://search.example/search?q=secret&email=visitor@example.com',
    visibilityState: 'visible',
    getElementById: id => id === 'portfolio-analytics' ? script : (options.ids || ['projects']).includes(id) ? {} : null,
    addEventListener: addListener
  };
  const navigator = { webdriver: false, ...options.navigator };
  const context = {
    URL, Set, Uint8Array, Promise, atob, crypto: { randomUUID }, document, navigator, location,
    innerWidth: options.width || 1280,
    localStorage: storage(local, 'local'), sessionStorage: storage(session, 'session'),
    addEventListener: addListener,
    Date: class extends Date { static now() { return now; } },
    setTimeout(fn, delay = 0) { const id = ++timerId; timers.set(id, { fn, time: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, init) {
      requests.push({ url, ...init, payload: JSON.parse(init.body) });
      if (options.fetchThrows) throw new Error('Network unavailable');
      if (options.fetchRejects) return Promise.reject(new Error('Network unavailable'));
      const status = options.status || 202;
      return Promise.resolve({ ok: status >= 200 && status < 300, status });
    }
  };
  context.window = context;
  runInNewContext(source, context);

  function dispatch(type, target, extra = {}) {
    const event = { type, target, isTrusted: true, button: 0, ...extra,
      preventDefault() { throw new Error('Analytics must not block navigation'); },
      stopPropagation() { throw new Error('Analytics must not stop events'); }
    };
    for (const handler of handlers.get(type) || []) handler(event);
  }
  async function advance(ms = 200) {
    now += ms;
    const due = [...timers].filter(([, item]) => item.time <= now);
    for (const [id, item] of due) { timers.delete(id); item.fn(); }
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  }
  return { requests, writes, local, session, document, navigator, dispatch, advance,
    events: () => requests.flatMap(request => request.payload.events) };
}

function element(tag, attrs = {}, classes = []) {
  const node = {
    tagName: tag.toUpperCase(), id: attrs.id || '', disabled: Boolean(attrs.disabled),
    getAttribute: key => attrs[key] ?? null,
    hasAttribute: key => Object.hasOwn(attrs, key),
    classList: { contains: name => classes.includes(name) },
    closest(selector) {
      if (selector === '[data-analytics-ignore]') return attrs.ignore ? node : null;
      if (selector === 'a[href], button') return node;
      return null;
    }
  };
  Object.defineProperty(node, 'textContent', { get() { throw new Error('Do not read visitor-facing text'); } });
  return node;
}

test('page views use registered canonical paths and coarse anonymous metadata', async () => {
  const env = environment({ url: 'https://adeebnoor.github.io/ar/index.html?email=secret@example.com', width: 390 });
  await env.advance();
  const request = env.requests[0];
  assert.equal(request.payload.site, 'adeebnoor.github.io');
  assert.match(request.payload.visitor_id, /^[a-f0-9-]{36}$/);
  assert.match(request.payload.session_id, /^[a-f0-9-]{36}$/);
  assert.deepEqual(request.payload.events.map(({ event_id, ...event }) => event), [{
    type: 'page_view', page: '/ar/', target: '', language: 'ar',
    referrer_host: 'search.example', device: 'mobile'
  }]);
  assert.equal(request.keepalive, true);
  assert.equal(request.credentials, 'omit');
  assert.equal(request.referrerPolicy, 'no-referrer');
  assert.equal(request.headers.Authorization, `Bearer ${publicKey}`);
  assert.equal(request.headers.apikey, publicKey);
  assert.ok(!JSON.stringify(request.payload).includes('secret'));
});

test('internal, project, language and outbound clicks classify without leaking queries or credentials', () => {
  const env = environment();
  const click = (href, classes = []) => env.dispatch('click', element('a', { href }, classes));
  click('/academic-cv.html?recipient=private@example.com');
  click('https://adeebnoor.github.io/Miyar/?review=od');
  click('https://adeebnoor.github.io/CPIT/iscarb.html?student=private');
  click('/ar/about.html', ['site-language']);
  click('https://user:password@example.org/paper?token=private#secret');
  click('#projects');
  click('/privacy.html');
  click('#private-email@example.com');
  click('/unregistered-private-path');
  click('/analytics/private-export.csv', []);
  click('javascript:alert(1)');
  click('#projects', ['site-skip']);
  assert.deepEqual(env.events().filter(event => event.type !== 'page_view').map(event => [event.type, event.target]), [
    ['link_click', '/academic-cv.html'],
    ['project_click', 'https://adeebnoor.github.io/Miyar/'],
    ['project_click', 'https://adeebnoor.github.io/CPIT/iscarb.html'],
    ['language_switch', '/ar/about.html'],
    ['outbound_click', 'https://example.org/paper'],
    ['link_click', '/about.html#projects'],
    ['link_click', '/privacy.html']
  ]);
  assert.ok(!JSON.stringify(env.requests.map(r => r.payload)).match(/private|password|token|recipient/));
});

test('contact actions do not collect recipients, messages, numbers or link text', () => {
  const env = environment();
  env.dispatch('click', element('a', { href: 'mailto:arnoor@kau.edu.sa?subject=My%20name&body=private' }));
  env.dispatch('click', element('a', { href: 'tel:+966512345678' }));
  assert.deepEqual(env.events().filter(e => e.type === 'contact_click').map(e => e.target), ['email', 'phone']);
  assert.ok(!JSON.stringify(env.requests.map(r => r.payload)).match(/arnoor|966512345678|private|subject/));
});

test('CV printing records a request, separate from actual file-link activation', () => {
  const env = environment({ url: 'https://adeebnoor.github.io/ar/executive-cv.html' });
  env.dispatch('click', element('button', { onclick: 'window.print()' }));
  env.dispatch('click', element('a', { href: '/assets/cv.pdf?name=private#page1', download: '' }));
  assert.deepEqual(env.events().filter(e => e.type !== 'page_view').map(e => [e.type, e.target]), [
    ['cv_print_request', 'executive'], ['download_click', 'https://adeebnoor.github.io/assets/cv.pdf']
  ]);
  assert.equal(env.events().filter(e => e.type === 'download_click').length, 1);
});

test('RIDI button, keyboard-style activation and middle-click retain native behavior', () => {
  const env = environment({ url: 'https://adeebnoor.github.io/demo/' });
  env.dispatch('click', element('button', { id: 'run' }));
  env.dispatch('click', element('button', { id: 'run', disabled: true }));
  env.dispatch('auxclick', element('a', { href: '/about.html' }), { button: 1 });
  env.dispatch('auxclick', element('a', { href: '/about.html' }), { button: 2 });
  env.dispatch('click', element('a', { href: '/about.html' }), { isTrusted: false });
  assert.deepEqual(env.events().filter(e => e.type !== 'page_view').map(e => e.type), ['demo_run', 'link_click']);
});

test('privacy signals, owner paths, robots and unrelated hosts do not collect or write IDs', async () => {
  const denied = [
    { navigator: { globalPrivacyControl: true } }, { navigator: { doNotTrack: '1' } },
    { navigator: { doNotTrack: 'yes' } }, { navigator: { webdriver: true } },
    { local: { adeeb_analytics_optout: '1' } },
    { url: 'https://adeebnoor.github.io/privacy.html', pages: [...registered, '/privacy.html'] },
    ...['http://localhost:8000/', 'https://preview.example/',
      'https://adeebnoor.github.io/404.html?private=secret',
      'https://adeebnoor.github.io/collaborate.html',
      'https://adeebnoor.github.io/analytics/',
      'https://adeebnoor.github.io/unknown-person@example.com'].map(url => ({ url }))
  ];
  for (const options of denied) {
    const env = environment(options);
    await env.advance();
    assert.equal(env.requests.length, 0, JSON.stringify(options));
    assert.equal(env.writes.length, 0, JSON.stringify(options));
  }
});

test('new opt-out is respected before queued events or retries are sent', async () => {
  const env = environment();
  env.local.set('adeeb_analytics_optout', '1');
  await env.advance();
  env.dispatch('click', element('a', { href: '/academic-cv.html' }));
  assert.equal(env.requests.length, 0);
  const retry = environment({ status: 503 });
  await retry.advance();
  retry.local.set('adeeb_analytics_optout', '1');
  await retry.advance(1300);
  assert.equal(retry.requests.length, 1);
});

test('opting out immediately discards pending events and retries, including quick re-enabling', async () => {
  for (const notification of ['portfolio-analytics-preference-change', 'storage']) {
    const queued = environment();
    queued.local.set('adeeb_analytics_optout', '1');
    queued.dispatch(notification, null, { key: 'adeeb_analytics_optout' });
    queued.local.delete('adeeb_analytics_optout');
    queued.dispatch('portfolio-analytics-preference-change', null);
    await queued.advance();
    assert.equal(queued.requests.length, 0);
    const retry = environment({ status: 503 });
    await retry.advance();
    retry.local.set('adeeb_analytics_optout', '1');
    retry.dispatch(notification, null, { key: 'adeeb_analytics_optout' });
    retry.local.delete('adeeb_analytics_optout');
    await retry.advance(1300);
    assert.equal(retry.requests.length, 1);
  }
});

test('restoring a page from the back-forward cache records one fresh view', async () => {
  const env = environment();
  await env.advance();
  env.dispatch('pageshow', null, { persisted: false });
  await env.advance();
  assert.equal(env.events().length, 1);
  env.dispatch('pageshow', null, { persisted: true });
  await env.advance();
  assert.equal(env.events().length, 2);
  assert.equal(env.requests[0].payload.visitor_id, env.requests[1].payload.visitor_id);
});

test('private-browser storage failures fall back to anonymous IDs without page errors', () => {
  const env = environment({ blockStorage: true });
  env.dispatch('click', element('a', { href: '/academic-cv.html' }));
  env.dispatch('click', element('a', { href: '/executive-cv.html' }));
  assert.equal(new Set(env.requests.map(r => r.payload.visitor_id)).size, 1);
  assert.equal(new Set(env.requests.map(r => r.payload.session_id)).size, 1);
  assert.equal(env.writes.length, 0);
});

test('expired visitor and inactive session are replaced; a current visitor survives navigation', async () => {
  const visitor = randomUUID(), session = randomUUID();
  const env = environment({ local: { adeeb_analytics_visitor: JSON.stringify({ id: visitor, expires_at: 1800000000000 + 1000 }) },
    session: { adeeb_analytics_session: JSON.stringify({ id: session, last_seen: 1800000000000 - 31 * 60000 }) } });
  await env.advance();
  assert.equal(env.requests[0].payload.visitor_id, visitor);
  assert.notEqual(env.requests[0].payload.session_id, session);
  const expired = environment({ local: { adeeb_analytics_visitor: JSON.stringify({ id: visitor, expires_at: 1800000000000 - 1 }) } });
  await expired.advance();
  assert.notEqual(expired.requests[0].payload.visitor_id, visitor);
});

test('network failures retry only once with the exact same event IDs', async () => {
  for (const options of [{ status: 503 }, { fetchRejects: true }, { fetchThrows: true }]) {
    const env = environment(options);
    await env.advance();
    await env.advance(1300);
    await env.advance(1300);
    assert.equal(env.requests.length, 2);
    assert.deepEqual(env.requests[0].payload, env.requests[1].payload);
  }
  const unauthorized = environment({ status: 401 });
  await unauthorized.advance(); await unauthorized.advance(2000);
  assert.equal(unauthorized.requests.length, 1);
});

test('service-role credentials and malformed route configuration are rejected', async () => {
  const serviceKey = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  for (const options of [{ key: serviceKey }, { pages: ['/unknown/'] }]) {
    const env = environment(options); await env.advance();
    assert.equal(env.requests.length, 0);
    assert.equal(env.writes.length, 0);
  }
});

test('every actual public-page link emitted by the tracker is accepted by the collector', { skip: !existsSync(new URL('../supabase/functions/portfolio-collect/index.ts', import.meta.url)) }, () => {
  // This catches a new file/link missing from the collector's strict inventory,
  // before its rejection could discard other valid events in the same batch.
  const root = new URL('../', import.meta.url);
  const inventory = JSON.parse(execFileSync('python', ['-c', `
import json
from pathlib import Path
from html.parser import HTMLParser
class Page(HTMLParser):
 def __init__(self): super().__init__(); self.links=[]; self.buttons=[]; self.ids=[]
 def handle_starttag(self, tag, attrs):
  attrs=dict(attrs)
  if tag=='a' and attrs.get('href'): self.links.append(attrs)
  if tag=='button': self.buttons.append(attrs)
  if attrs.get('id'): self.ids.append(attrs['id'])
result=[]
for path in Path('.').rglob('*.html'):
 if any(p in ('node_modules','.git') for p in path.parts): continue
 parser=Page(); parser.feed(path.read_text())
 name='/'+str(path)
 if name.endswith('/index.html'): name=name[:-10]
 result.append({'page':name,'links':parser.links,'buttons':parser.buttons,'ids':parser.ids})
print(json.dumps(result))
`], { cwd: root, encoding: 'utf8' }));
  const collectorFile = new URL('../supabase/functions/portfolio-collect/index.ts', import.meta.url);
  const collector = stripTypeScriptTypes(readFileSync(collectorFile, 'utf8'), { mode: 'strip' })
    .replace('export async function handler', 'async function handler');
  const server = { URL, Deno: { serve() {} } };
  runInNewContext(collector + '\nglobalThis.checkEvent = normalizeEvent;', server);
  const pages = inventory.map(item => item.page);
  let checked = 0;
  for (const item of inventory) {
    if (/^\/(?:ar\/)?(?:analytics\/|privacy\.html|404\.html|collaborate\.html)/.test(item.page)) continue;
    const env = environment({ url: 'https://adeebnoor.github.io' + item.page, pages, ids: item.ids });
    for (const link of item.links) env.dispatch('click', element('a', link, (link.class || '').split(/\s+/)));
    for (const button of item.buttons) env.dispatch('click', element('button', button, (button.class || '').split(/\s+/)));
    for (const event of env.events()) {
      const normalized = server.checkEvent(event);
      assert.ok(normalized, `Collector rejects ${item.page}: ${event.type} ${event.target}`);
      assert.equal(normalized.target, event.target, `Collector drops target detail: ${item.page} ${event.target}`);
      checked++;
    }
  }
  assert.ok(checked > 1000, `Expected to check the complete public inventory, received ${checked}`);
});
