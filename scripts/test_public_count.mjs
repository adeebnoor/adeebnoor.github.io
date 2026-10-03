// Offline tests: actual function code, mocked database HTTP, no live credentials.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source = stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/portfolio-public-count/index.ts', import.meta.url), 'utf8'), { mode: 'strip' })
  .replace('export async function handler', 'async function handler');
const origin = 'https://adeebnoor.github.io';
const url = 'https://example.supabase.co/functions/v1/portfolio-public-count';

function fixture(options = {}) {
  let now = 1800000000000;
  let handler;
  const requests = [], waiting = [];
  const state = { data: { visitors_90d: 17 }, status: 200, reject: false, ...options };
  const context = {
    URL, Request, Response, AbortSignal, Promise,
    Date: class extends Date { static now() { return now; } },
    Deno: {
      env: { get: key => state.noEnv ? undefined : key === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'SERVER_ONLY_FIXTURE_KEY' },
      serve: fn => { handler = fn; },
    },
    fetch: (target, init) => {
      requests.push({ target, init });
      return new Promise((resolve, reject) => {
        const finish = () => state.reject ? reject(new Error('Upstream error with PRIVATE_DETAIL'))
          : resolve({ ok: state.status >= 200 && state.status < 300, json: async () => state.data });
        if (state.defer) waiting.push(finish); else finish();
      });
    },
  };
  runInNewContext(source, context);
  return {
    requests, state,
    request: (requestUrl = url, init = {}) => handler(new Request(requestUrl, init)),
    advance: milliseconds => { now += milliseconds; },
    resolve: () => { for (const finish of waiting.splice(0)) finish(); },
  };
}

test('public response includes only the aggregate and calls only the narrow RPC', async () => {
  const env = fixture({ data: { visitors_90d: 17, visitor_id: 'PRIVATE_ID', recent_events: [{ target: 'PRIVATE_PATH' }] } });
  const response = await env.request(url, { headers: { Origin: origin } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { visitors_90d: 17 });
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=900');
  assert.equal(env.requests[0].target, 'https://example.supabase.co/rest/v1/rpc/portfolio_analytics_public_count');
  assert.equal(env.requests[0].init.body, '{}');
  assert.equal(env.requests[0].init.headers.Authorization, 'Bearer SERVER_ONLY_FIXTURE_KEY');
});

test('blocked origins, queries and methods never reach the database and are not cached', async () => {
  const env = fixture();
  for (const [target, init, expected] of [
    [url, { headers: { Origin: 'https://foreign.example' } }, 403],
    [url + '?owner_key=secret', {}, 400],
    [url, { method: 'POST' }, 405],
  ]) {
    const response = await env.request(target, init);
    assert.equal(response.status, expected);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  const preflight = await env.request(url, { method: 'OPTIONS', headers: { Origin: origin } });
  assert.equal(preflight.status, 200);
  assert.equal(preflight.headers.get('cache-control'), 'no-store');
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  assert.equal(env.requests.length, 0);
});

test('a successful cache hit avoids database work and reduces remaining browser freshness', async () => {
  const env = fixture();
  await env.request();
  env.state.data = { visitors_90d: 25 };
  env.advance(5000);
  const hit = await env.request(url, { headers: { Origin: origin } });
  assert.deepEqual(await hit.json(), { visitors_90d: 17 });
  assert.equal(hit.headers.get('cache-control'), 'public, max-age=895');
  assert.equal(hit.headers.get('access-control-allow-origin'), origin);
  assert.equal(env.requests.length, 1);
  env.advance(895001);
  const fresh = await env.request();
  assert.deepEqual(await fresh.json(), { visitors_90d: 25 });
  assert.equal(env.requests.length, 2);
});

test('concurrent cold requests share one upstream operation', async () => {
  const env = fixture({ defer: true });
  const pending = [env.request(), env.request(), env.request(url, { headers: { Origin: origin } })];
  assert.equal(env.requests.length, 1);
  env.resolve();
  const replies = await Promise.all(pending);
  for (const response of replies) {
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { visitors_90d: 17 });
  }
});

test('a failed coalesced read is not cached and the next request can recover', async () => {
  const env = fixture({ defer: true, status: 503 });
  const pending = [env.request(), env.request()];
  env.resolve();
  for (const response of await Promise.all(pending)) {
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'unavailable' });
  }
  env.state.status = 200; env.state.defer = false;
  const recovered = await env.request();
  assert.equal(recovered.status, 200);
  assert.equal(env.requests.length, 2);
});

test('missing environment, network errors and malformed counts fail closed without details', async () => {
  for (const options of [{ noEnv: true }, { reject: true },
    ...[null, undefined, '17', true, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1].map(visitors_90d => ({ data: { visitors_90d } }))]) {
    const env = fixture(options);
    const response = await env.request();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'unavailable' });
  }
  const zero = await fixture({ data: { visitors_90d: 0 } }).request();
  assert.equal(zero.status, 200);
  assert.deepEqual(await zero.json(), { visitors_90d: 0 });
});

test('expired cached data does not mask a backend failure or make it cacheable', async () => {
  const env = fixture(); await env.request(); env.advance(900001); env.state.reject = true;
  const response = await env.request();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('count SQL is read-only, service-only and preserves the existing Riyadh calendar window', () => {
  const sql = readFileSync(new URL('../supabase/schema/portfolio-public-count.sql', import.meta.url), 'utf8');
  const body = sql.split('as $$')[1].split('$$;')[0];
  assert.match(sql, /security invoker/i);
  assert.match(sql, /stable/i);
  assert.match(sql, /revoke all on function public\.portfolio_analytics_public_count\(\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.portfolio_analytics_public_count\(\) to service_role/i);
  assert.match(body, /count\(distinct visitor_id\)/i);
  assert.match(body, /make_interval\(days => 89\)/);
  assert.match(body, /occurred_at <= now\(\)/);
  assert.match(body, /Asia\/Riyadh/);
  assert.doesNotMatch(body, /portfolio_analytics_cleanup\s*\(|portfolio_analytics_settings|for update|\binsert\b|\bdelete\b|\bupdate\b/i);
});
