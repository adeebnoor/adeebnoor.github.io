// Deploy with verify_jwt=true. The browser sends the project's public anon JWT.
// This endpoint deliberately writes only the dedicated portfolio analytics RPC.
const ORIGIN = 'https://adeebnoor.github.io';
const SITE = 'adeebnoor.github.io';
const MAX_BYTES = 16 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES = new Set(['page_view', 'link_click', 'project_click', 'outbound_click', 'contact_click', 'language_switch', 'download_click', 'cv_print_request', 'demo_run']);
const BASE_PAGES = [
  '/', '/engagements.html', '/about.html', '/impact.html', '/research.html', '/publications.html',
  '/ventures.html', '/teaching.html', '/contact.html', '/academic-cv.html',
  '/executive-cv.html', '/master-cv.html', '/phd.html', '/speaking.html',
  '/funders.html', '/students.html', '/academic.html', '/press.html',
  '/writing/', '/writing/same-scores-different-decisions.html', '/healthx/',
  '/demo/', '/ideas/', '/ideas/position.html',
  '/ideas/capacity-is-a-policy-choice.html', '/ideas/define-the-position-before-filling-it.html',
  '/ideas/readiness-needs-evidence.html',
];
const PAGES = new Set([...BASE_PAGES.flatMap((p) => [p, '/ar' + p]), '/SulTaN/']);
// Informational/error/redirect pages may be link destinations without collecting
// visits on those pages. This also keeps privacy preferences outside analytics.
const TARGET_PAGES = new Set([
  ...PAGES, '/privacy.html', '/ar/privacy.html', '/404.html', '/ar/404.html',
  '/collaborate.html', '/ar/collaborate.html', '/feed.xml', '/ar/feed.xml',
]);
const ANCHORS = new Set([
  'content', 'main-content', 'projects', 'research', 'investors', 'organizations',
  'researchers', 'students', 'iscarb', 'philosophy', 'educator-scope', 'experience-basis',
  'platform-reach', 'evidence', 'beyond-the-average', 'imam', 'ridi', 'genomefit',
  'miyar', 'shifaa', 'healthx', 'leadership', 'metric-sources', 'work-and-ideas',
  'open-source', 'inquiry-form', 'inquiry-privacy', 'engagement-options', 'institutional-context', 'essay-updates',
  'national-workforce', 'hospital-modernization', 'genomefit-translation',
  'essays', 'capacity-is-a-choice', 'institutional-meaning', 'readiness-needs-evidence',
]);
const DESTINATIONS = new Set([
  'https://github.com/adeebnoor',
  'https://github.com/adeebnoor/ridi',
  'https://github.com/adeebnoor/Miyar',
  'https://github.com/adeebnoor/BioBenchShift',
  'https://github.com/adeebnoor/ANTI-DDI',
  'https://github.com/adeebnoor/CPIT',
  'https://adeebnoor.github.io/CPIT/',
  'https://adeebnoor.github.io/CPIT/iscarb.html',
  'https://adeebnoor.github.io/Miyar/',
  'https://cbrcconferences.kaust.edu.sa/speakers/2016-kaust-research-conference-speakers-adeeb-noor',
  'https://cemse.kaust.edu.sa/articles/2017/05/24/one-size-does-not-fit-all-innovative-analytical-tool-will-help-pave-way-tailor',
  'https://cemse.kaust.edu.sa/profiles/adeeb-noor',
  'https://cemse.kaust.edu.sa/topics/personalized-medicine',
  'https://home.cs.colorado.edu/~martin/_site/group/',
  'https://scholar.colorado.edu/concern/graduate_thesis_or_dissertations/cz30ps92j',
  'https://scholar.google.com/citations',
  'https://shifaa.kau.edu.sa/Default-ar.aspx',
  'https://shifaa.kau.edu.sa/default-en.aspx',
  'https://www.generalassemb.ly/instructors/dr-adeeb-noor/23954',
  'https://www.linkedin.com/in/adeeb-noor',
  'https://www.maastrichtuniversity.nl/mj-dumontier',
  'https://www.researchgate.net/profile/Adeeb-Noor-2',
]);

function headers(origin: string | null): Record<string, string> {
  const value: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', 'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin === ORIGIN) Object.assign(value, {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Max-Age': '600',
  });
  return value;
}

function canonicalPath(path: string): string {
  return path.endsWith('/index.html') ? path.slice(0, -10) : path;
}

function pagePath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 512) return null;
  try {
    const url = new URL(value, ORIGIN);
    const path = canonicalPath(url.pathname);
    return url.origin === ORIGIN && !url.username && !url.password && PAGES.has(path) ? path : null;
  } catch { return null; }
}

function linkTarget(value: unknown, page: string): string | null {
  if (typeof value !== 'string' || value.length > 2048 || !value) return null;
  try {
    const url = new URL(value, ORIGIN + page);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const path = canonicalPath(url.pathname);
    if (url.origin === ORIGIN && TARGET_PAGES.has(path)) {
      // Only pre-registered public anchors survive; all queries are discarded.
      const anchor = url.hash.slice(1);
      return path + (ANCHORS.has(anchor) ? '#' + anchor : '');
    }
    const destination = url.origin + path;
    return DESTINATIONS.has(destination) ? destination : null;
  } catch { return null; }
}

function referrerHost(value: unknown): string {
  if (typeof value !== 'string' || value.length > 253 || !value) return '';
  const host = value.toLowerCase().replace(/\.$/, '');
  // Do not accept URLs, email addresses, IP addresses, or user-entered text.
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) return '';
  return host;
}

async function boundedJSON(req: Request): Promise<unknown> {
  const length = req.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) throw new Error('body_limit');
  if (!req.body) throw new Error('invalid_body');
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error('body_limit'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

function normalizeEvent(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const event = value as Record<string, unknown>;
  if (typeof event.event_id !== 'string' || !UUID.test(event.event_id)) return null;
  if (typeof event.type !== 'string' || !TYPES.has(event.type)) return null;
  const page = pagePath(event.page);
  if (!page) return null;
  const language = page.startsWith('/ar/') ? 'ar' : 'en';
  if (event.language !== undefined && event.language !== language) return null;
  let target: string | null = null;
  if (event.type === 'page_view') target = '';
  else if (event.type === 'contact_click') target = ['email', 'phone'].includes(String(event.target)) ? String(event.target) : null;
  else if (event.type === 'cv_print_request') target = ['academic', 'executive'].includes(String(event.target)) ? String(event.target) : null;
  else if (event.type === 'demo_run') target = event.target === 'ridi' && ['/demo/', '/ar/demo/'].includes(page) ? 'ridi' : null;
  else target = linkTarget(event.target, page);
  if (target === null) return null;
  if (event.type === 'cv_print_request' && !page.endsWith('/' + target + '-cv.html')) return null;
  const device = ['mobile', 'tablet', 'desktop', 'unknown'].includes(String(event.device)) ? String(event.device) : 'unknown';
  return {
    event_id: event.event_id.toLowerCase(), type: event.type, page, target, language,
    referrer_host: referrerHost(event.referrer_host), device,
  };
}

export async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: headers(origin) });
  if (origin !== ORIGIN) return response(403, { error: 'origin_not_allowed' });
  if (req.method === 'OPTIONS') return response(200, { ok: true });
  if (req.method !== 'POST') return response(405, { error: 'method_not_allowed' });
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type') || '')) return response(415, { error: 'json_required' });
  let body: unknown;
  try { body = await boundedJSON(req); }
  catch (error) { return response(error instanceof Error && error.message === 'body_limit' ? 413 : 400, { error: 'invalid_request' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return response(400, { error: 'invalid_request' });
  const input = body as Record<string, unknown>;
  if (input.site !== SITE || typeof input.visitor_id !== 'string' || !UUID.test(input.visitor_id) || typeof input.session_id !== 'string' || !UUID.test(input.session_id)) return response(400, { error: 'invalid_request' });
  if (!Array.isArray(input.events) || input.events.length < 1 || input.events.length > 10) return response(400, { error: 'invalid_event_count' });
  const events = input.events.map(normalizeEvent);
  if (events.some((event) => event === null)) return response(400, { error: 'invalid_event' });
  const endpoint = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!endpoint || !serviceKey) return response(503, { error: 'collection_unavailable' });
  try {
    const result = await fetch(endpoint + '/rest/v1/rpc/portfolio_analytics_ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey },
      body: JSON.stringify({ p_visitor_id: input.visitor_id, p_session_id: input.session_id, p_events: events }),
      signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) return response(503, { error: 'collection_unavailable' });
    const receipt = await result.json();
    return response(200, { ok: true, accepted: receipt.accepted, limited: receipt.limited });
  } catch { return response(503, { error: 'collection_unavailable' }); }
}

Deno.serve(handler);
