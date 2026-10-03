// Public, aggregate-only visitor count for the site footer.
// Deploy with verify_jwt=false. It returns one number (approximate browsers in
// the last 90 days) and never exposes events, pages, referrers or identifiers.
const ORIGIN = 'https://adeebnoor.github.io';

function headers(origin: string | null): Record<string, string> {
  const value: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=900', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff',
  };
  if (origin === ORIGIN) Object.assign(value, {
    'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '600',
  });
  return value;
}

export async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: headers(origin) });
  if (origin && origin !== ORIGIN) return response(403, { error: 'origin_not_allowed' });
  if (req.method === 'OPTIONS') return response(200, { ok: true });
  if (req.method !== 'GET') return response(405, { error: 'method_not_allowed' });
  if (new URL(req.url).search) return response(400, { error: 'invalid_request' });
  const endpoint = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!endpoint || !serviceKey) return response(503, { error: 'unavailable' });
  try {
    const stats = await fetch(endpoint + '/rest/v1/rpc/portfolio_analytics_stats', {
      method: 'POST',
      headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_days: 90 }), signal: AbortSignal.timeout(15000),
    });
    if (!stats.ok) return response(503, { error: 'unavailable' });
    const visitors = Number((await stats.json())?.totals?.visitors);
    if (!Number.isFinite(visitors) || visitors < 0) return response(503, { error: 'unavailable' });
    return response(200, { visitors_90d: Math.floor(visitors) });
  } catch { return response(503, { error: 'unavailable' }); }
}

Deno.serve(handler);
