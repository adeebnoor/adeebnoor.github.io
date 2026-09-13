// Run the real UI scripts against the generated HTML structure in a small DOM.
// This verifies interaction and state, not layout or a live browser session.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const base = new URL('../', import.meta.url);
const ownerKey = 'test_owner_key_0123456789abcdefghijklmnopqrstuvwxyz';
const storedKey = 'adeeb_analytics_owner_session';
const fixtures = JSON.parse(execFileSync('python', ['-c', `
import json
from pathlib import Path
from html.parser import HTMLParser
class Tree(HTMLParser):
 def __init__(self): super().__init__();self.root={'tag':'document','attrs':{},'children':[]};self.stack=[self.root]
 def handle_starttag(self,tag,attrs):
  node={'tag':tag,'attrs':dict(attrs),'children':[]};self.stack[-1]['children'].append(node)
  if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):self.stack.append(node)
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i]['tag']==tag:self.stack=self.stack[:i];break
 def handle_data(self,data):self.stack[-1]['children'].append(data)
result={}
for path in ('analytics/index.html','ar/analytics/index.html','privacy.html','ar/privacy.html'):
 tree=Tree();tree.feed(Path(path).read_text());result[path]=tree.root
print(json.dumps(result))
`], { cwd: base, encoding: 'utf8' }));

class Element {
  constructor(tag, attrs = {}, children = []) {
    this.tagName = tag.toUpperCase(); this.attrs = { ...attrs }; this.children = children;
    this.dataset = Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith('data-')).map(([k, v]) => [k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]));
    this.listeners = new Map(); this.style = {}; this.hidden = 'hidden' in attrs;
    this.disabled = 'disabled' in attrs; this.checked = 'checked' in attrs;
    this.value = attrs.value || ''; this.lang = attrs.lang || '';
    if (tag === 'select') this.value = this.querySelectorAll('option').find(n => 'selected' in n.attrs)?.value || this.querySelector('option')?.value || '';
  }
  get textContent() { return this.children.map(n => typeof n === 'string' ? n : n.textContent).join(''); }
  set textContent(value) { this.children = [String(value)]; }
  get id() { return this.attrs.id || ''; }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  removeAttribute(key) { delete this.attrs[key]; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  appendChild(node) { this.children.push(node); return node; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  focus() { this.focused = true; }
  querySelectorAll(selector) {
    const matches = node => selector.startsWith('[') ? Object.hasOwn(node.attrs, selector.slice(1, -1))
      : selector.startsWith('#') ? node.id === selector.slice(1) : node.tagName.toLowerCase() === selector;
    const result = [];
    const visit = node => { for (const child of node.children) if (typeof child !== 'string') { if (matches(child)) result.push(child); visit(child); } };
    visit(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, fn) { this.listeners.set(type, [...(this.listeners.get(type) || []), fn]); }
  dispatchEvent(event) { for (const fn of this.listeners.get(event.type) || []) fn(event); return true; }
}

function materialize(node) { return typeof node === 'string' ? node : new Element(node.tag, node.attrs, node.children.map(materialize)); }
function dataset(overrides = {}) {
  return { site: 'adeebnoor.github.io', generated_at: '2026-09-13T20:00:00Z', collection_started_at: '2026-09-13T19:00:00Z',
    period: { start: '2026-09-12T21:00:00Z', end: '2026-09-13T21:00:00Z', days: 1 },
    totals: { visitors: 0, sessions: 0, page_views: 0, link_clicks: 0, download_clicks: 0, print_requests: 0, total_events: 0 },
    daily: [], top_pages: [], top_destinations: [], recent_events: [], ...overrides };
}

function ui(options = {}) {
  const path = options.privacy ? options.ar ? 'ar/privacy.html' : 'privacy.html' : options.ar ? 'ar/analytics/index.html' : 'analytics/index.html';
  const document = materialize(fixtures[path]);
  document.documentElement = document.querySelector('html'); document.hidden = false;
  document.getElementById = id => document.querySelector('#' + id);
  document.createElement = tag => new Element(tag);
  const local = new Map(Object.entries(options.local || {}));
  const session = new Map(Object.entries(options.session || {}));
  const storage = values => ({
    getItem(key) { if (options.blockStorage) throw new Error('Storage unavailable'); return values.get(key) || null; },
    setItem(key, value) { if (options.blockStorage) throw new Error('Storage unavailable'); values.set(key, value); },
    removeItem(key) { if (options.blockStorage) throw new Error('Storage unavailable'); values.delete(key); }
  });
  const events = new Element('window'), timers = new Map(), requests = [], pending = [];
  let now = 1800000000000, counter = 0;
  const context = {
    document, navigator: { ...options.navigator }, localStorage: storage(local), sessionStorage: storage(session),
    URL, Intl, AbortController, Event, Promise,
    Date: class extends Date { static now() { return now; } },
    addEventListener: (...args) => events.addEventListener(...args), dispatchEvent: event => events.dispatchEvent(event),
    setTimeout(fn, delay = 0) { const id = ++counter; timers.set(id, { fn, time: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, init) {
      requests.push({ url, ...init });
      return new Promise((resolve, reject) => {
        const respond = (status = options.status || 200, data = options.data || dataset()) => resolve({ status, ok: status >= 200 && status < 300, json: async () => data });
        pending.push({ respond, reject });
        if (!options.defer) respond();
      });
    }
  };
  context.window = context;
  runInNewContext(readFileSync(new URL(options.privacy ? '../privacy.js' : '../analytics/dashboard.js', import.meta.url), 'utf8'), context);
  const get = id => document.getElementById((options.privacy ? 'privacy-' : 'analytics-') + id);
  function dispatch(id, type, extra = {}) { get(id).dispatchEvent({ type, preventDefault() {}, ...extra }); }
  function login(key = ownerKey, remember = false) { get('key').value = key; get('remember').checked = remember; dispatch('login-form', 'submit'); }
  async function settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
  async function advance(ms) { now += ms; for (const [id, item] of [...timers]) if (item.time <= now) { timers.delete(id); item.fn(); } await settle(); }
  return { document, get, login, dispatch, requests, pending, local, session, settle, advance, context };
}

test('dashboard stays locked without credentials; login sends the owner key only in its header', async () => {
  const env = ui();
  assert.equal(env.requests.length, 0); assert.equal(env.get('content').hidden, true);
  env.login('short'); await env.settle();
  assert.equal(env.requests.length, 0); assert.equal(env.get('status').dataset.error, 'true');
  env.login(); await env.settle();
  const request = env.requests[0];
  assert.equal(new URL(request.url).search, '?days=30');
  assert.equal(request.headers['X-Analytics-Key'], ownerKey);
  assert.ok(!request.url.includes(ownerKey));
  assert.equal(request.credentials, 'omit'); assert.equal(request.cache, 'no-store'); assert.equal(request.referrerPolicy, 'no-referrer');
  assert.equal(env.get('content').hidden, false); assert.equal(env.get('login').hidden, true);
  assert.equal(env.get('key').value, ''); assert.equal(env.session.has(storedKey), false);
});

test('credential inputs cannot enter native form URLs when dashboard JavaScript is unavailable', () => {
  for (const path of ['analytics/index.html', 'ar/analytics/index.html']) {
    const initial = materialize(fixtures[path]);
    const key = initial.querySelector('#analytics-key');
    const form = initial.querySelector('#analytics-login-form');
    assert.equal(key.getAttribute('name'), null);
    assert.equal(key.disabled, true);
    assert.equal(form.querySelector('button').disabled, true);
  }
  const booted = ui();
  assert.equal(booted.get('key').disabled, false);
  assert.equal(booted.get('login-form').querySelector('button').disabled, false);
});

test('empty records render honest empty states in both languages', async () => {
  for (const ar of [false, true]) {
    const env = ui({ ar }); env.login(); await env.settle();
    assert.equal(env.get('empty').hidden, false);
    assert.equal(env.get('daily-empty').hidden, false);
    assert.match(env.get('events').textContent, ar ? /لا يوجد نشاط/ : /No activity/);
    assert.equal(env.get('pages').children[0].children[0].colSpan, 3);
    assert.ok(env.document.querySelectorAll('[data-metric]').every(node => /^[0٠]$/.test(node.textContent)));
    assert.equal(env.get('status').dataset.error, 'false');
  }
});

test('recent events and destinations are rendered as text rather than injected markup', async () => {
  const hostile = '<img src=x onerror=alert(1)>';
  const env = ui({ data: dataset({ totals: { visitors: 1, sessions: 1, total_events: 1 },
    top_destinations: [{ target: hostile, type: 'outbound_click', clicks: 1 }],
    recent_events: [{ occurred_at: '2026-09-13T20:00:00Z', type: 'outbound_click', page: '/about.html', target: hostile, visitor_id: '12345678-1234-4123-8123-123456789012', session_id: '87654321-1234-4123-8123-123456789012', referrer_host: 'example.com', device: 'desktop' }] }) });
  env.login(); await env.settle();
  assert.equal(env.get('empty').hidden, true);
  assert.ok(env.get('events').textContent.includes(hostile));
  assert.equal(env.get('events').querySelectorAll('img').length, 0);
  assert.match(env.get('events').textContent, /Browser: 12345678…/);
});

test('unauthorized responses clear saved access and show the locked state', async () => {
  for (const status of [401, 403]) {
    const env = ui({ status }); env.login(ownerKey, true); await env.settle();
    assert.equal(env.get('login').hidden, false); assert.equal(env.get('content').hidden, true);
    assert.equal(env.session.has(storedKey), false); assert.equal(env.get('key').value, '');
    assert.match(env.get('status').textContent, /not accepted/);
    assert.equal(env.get('login-form').querySelector('button').disabled, false);
  }
});

test('logout clears rendered data, saved credentials and ignores a late response', async () => {
  const env = ui({ defer: true }); env.login(ownerKey, true);
  assert.equal(env.session.has(storedKey), true);
  env.dispatch('logout', 'click');
  assert.equal(env.requests[0].signal.aborted, true);
  env.pending[0].respond(200, dataset({ totals: { visitors: 100 } })); await env.settle();
  assert.equal(env.get('content').hidden, true); assert.equal(env.session.has(storedKey), false);
  assert.ok(env.document.querySelectorAll('[data-metric]').every(node => node.textContent === '—'));
  assert.equal(env.get('events').children.length, 0); assert.equal(env.get('key').focused, true);
});

test('changing the date range aborts old requests and only the new response can render', async () => {
  const env = ui({ defer: true }); env.login();
  env.get('range').value = '7'; env.dispatch('range', 'change');
  assert.equal(env.requests[0].signal.aborted, true);
  assert.equal(new URL(env.requests[1].url).searchParams.get('days'), '7');
  env.pending[1].respond(200, dataset({ totals: { visitors: 7 } })); await env.settle();
  env.pending[0].respond(200, dataset({ totals: { visitors: 99 } })); await env.settle();
  assert.equal(env.document.querySelectorAll('[data-metric]')[0].textContent, '7');
});

test('remembered access expires, and storage failures still allow memory-only owner login', async () => {
  const remembered = ui({ session: { [storedKey]: JSON.stringify({ key: ownerKey, expiresAt: 1800000000000 + 1000 }) } });
  await remembered.settle(); assert.equal(remembered.get('content').hidden, false);
  await remembered.advance(1100); assert.equal(remembered.get('content').hidden, true);
  assert.equal(remembered.session.has(storedKey), false);
  const memory = ui({ blockStorage: true }); memory.login(ownerKey, true); await memory.settle();
  assert.equal(memory.get('content').hidden, false); assert.equal(memory.get('status').dataset.error, 'false');
});

test('server and malformed response errors leave the owner able to retry', async () => {
  for (const options of [{ status: 503 }, { data: { site: 'wrong-site', totals: {} } }]) {
    const env = ui(options); env.login(); await env.settle();
    assert.equal(env.get('content').hidden, true); assert.equal(env.get('status').dataset.error, 'true');
    assert.equal(env.get('login-form').querySelector('button').disabled, false);
    assert.equal(env.get('refresh').disabled, false);
  }
});

test('privacy preference toggles local state and notifies the recorder without network requests', () => {
  for (const ar of [false, true]) {
    const env = ui({ privacy: true, ar }); let notified = 0;
    env.context.addEventListener('portfolio-analytics-preference-change', () => notified++);
    assert.equal(env.get('enable').disabled, true);
    env.dispatch('disable', 'click');
    assert.equal(env.local.get('adeeb_analytics_optout'), '1'); assert.equal(env.get('disable').disabled, true);
    env.dispatch('enable', 'click');
    assert.equal(env.local.has('adeeb_analytics_optout'), false); assert.equal(env.get('enable').disabled, true);
    assert.equal(notified, 2); assert.equal(env.requests.length, 0);
  }
});

test('privacy signals override local permission, consistently with the tracker', () => {
  for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: '1' }, { doNotTrack: 'yes' }]) {
    const env = ui({ privacy: true, navigator });
    assert.match(env.get('status').textContent, /privacy signal/);
    assert.equal(env.requests.length, 0);
  }
});

test('privacy storage failure accurately describes anonymous fallback and available browser controls', () => {
  const fallback = ui({ privacy: true, blockStorage: true });
  assert.match(fallback.get('status').textContent, /temporary anonymous identifiers/);
  assert.match(fallback.get('status').textContent, /Do Not Track/);
  assert.equal(fallback.get('disable').disabled, true);
  assert.equal(fallback.get('enable').disabled, true);
  const protectedBrowser = ui({ privacy: true, blockStorage: true, navigator: { doNotTrack: 'yes' } });
  assert.match(protectedBrowser.get('status').textContent, /Analytics are off/);
});
