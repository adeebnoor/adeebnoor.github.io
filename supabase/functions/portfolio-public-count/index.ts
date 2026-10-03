// Public aggregate only. Deploy with verify_jwt=false.
// Requires the service-role-only portfolio_analytics_public_count() RPC.
// Cache and request coalescing are per Edge isolate, not a global rate limiter.
const ORIGIN = 'https://adeebnoor.github.io';
const CACHE_MS = 15 * 60 * 1000;
type Count = { visitors: number; expiresAt: number };
let cached: Count | null = null;
let inFlight: Promise<Count> | null = null;

function headers(origin: string | null, cacheSeconds?: number): Record<string, string> {
  const value: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheSeconds === undefined ? 'no-store' : `public, max-age=${cacheSeconds}`,
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin === ORIGIN) Object.assign(value, {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '600',
  });
  return value;
}

async function readCount(): Promise<Count> {
  const endpoint = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!endpoint || !serviceKey) throw new Error('unavailable');
  const response = await fetch(endpoint.replace(/\/+$/, '') + '/rest/v1/rpc/portfolio_analytics_public_count', {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
    },
    body: '{}',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('unavailable');
  const visitors = (await response.json())?.visitors_90d;
  // Reject malformed data instead of coercing null, strings or booleans to zero.
  if (typeof visitors !== 'number' || !Number.isSafeInteger(visitors) || visitors < 0) throw new Error('unavailable');
  return { visitors, expiresAt: Date.now() + CACHE_MS };
}

async function getCount(): Promise<Count> {
  if (cached && Date.now() < cached.expiresAt) return cached;
  if (!inFlight) {
    inFlight = readCount().then(value => {
      cached = value;
      return value;
    }).finally(() => { inFlight = null; });
  }
  return inFlight;
}

export async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const response = (status: number, body: unknown, cacheSeconds?: number) =>
    new Response(JSON.stringify(body), { status, headers: headers(origin, cacheSeconds) });
  if (origin && origin !== ORIGIN) return response(403, { error: 'origin_not_allowed' });
  if (req.method === 'OPTIONS') return response(200, { ok: true });
  if (req.method !== 'GET') return response(405, { error: 'method_not_allowed' });
  if (new URL(req.url).search) return response(400, { error: 'invalid_request' });
  try {
    const count = await getCount();
    // A browser cache must not extend the age of an already cached result.
    const cacheSeconds = Math.max(0, Math.floor((count.expiresAt - Date.now()) / 1000));
    return response(200, { visitors_90d: count.visitors }, cacheSeconds);
  } catch {
    // Failed reads are never cached and a later request can retry immediately.
    return response(503, { error: 'unavailable' });
  }
}

Deno.serve(handler);
