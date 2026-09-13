// Deploy with verify_jwt=false: the private dashboard key is checked here.
// A public project anon key never authorizes reading analytics.
const ORIGIN = 'https://adeebnoor.github.io';
const KEY_FORMAT = /^[A-Za-z0-9_-]{43,128}$/;

function headers(origin: string | null): Record<string, string> {
  const value: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff',
  };
  if (origin === ORIGIN) Object.assign(value, {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'x-analytics-key, apikey, authorization, content-type',
    'Access-Control-Max-Age': '600',
  });
  return value;
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== 64 || right.length !== 64) return false;
  let difference = 0;
  for (let index = 0; index < 64; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: headers(origin) });
  if (origin && origin !== ORIGIN) return response(403, { error: 'origin_not_allowed' });
  if (req.method === 'OPTIONS') return response(200, { ok: true });
  if (req.method !== 'GET') return response(405, { error: 'method_not_allowed' });
  const url = new URL(req.url);
  // Credentials never belong in URLs, caches, referrers, or request logs.
  if ([...url.searchParams.keys()].some((name) => name !== 'days')) return response(400, { error: 'invalid_request' });
  const key = req.headers.get('x-analytics-key') || '';
  if (!KEY_FORMAT.test(key)) return response(401, { error: 'unauthorized' });
  const daysText = url.searchParams.get('days') || '30';
  if (!['1', '7', '30', '90'].includes(daysText)) return response(400, { error: 'invalid_period' });
  const endpoint = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!endpoint || !serviceKey) return response(503, { error: 'analytics_unavailable' });
  const serviceHeaders = { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' };
  try {
    // Read only the private hash first. No analytics RPC is called until auth passes.
    const settingsResponse = await fetch(endpoint + '/rest/v1/portfolio_analytics_settings?singleton=eq.true&select=admin_key_hash&limit=1', {
      headers: serviceHeaders, signal: AbortSignal.timeout(8000),
    });
    if (!settingsResponse.ok) return response(503, { error: 'analytics_unavailable' });
    const settings = await settingsResponse.json();
    if (!Array.isArray(settings) || settings.length !== 1 || typeof settings[0].admin_key_hash !== 'string') return response(503, { error: 'analytics_unavailable' });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (!constantTimeEqual(hash, settings[0].admin_key_hash)) return response(401, { error: 'unauthorized' });
    const statsResponse = await fetch(endpoint + '/rest/v1/rpc/portfolio_analytics_stats', {
      method: 'POST', headers: serviceHeaders,
      body: JSON.stringify({ p_days: Number(daysText) }), signal: AbortSignal.timeout(15000),
    });
    if (!statsResponse.ok) return response(503, { error: 'analytics_unavailable' });
    return response(200, await statsResponse.json());
  } catch { return response(503, { error: 'analytics_unavailable' }); }
}

Deno.serve(handler);
