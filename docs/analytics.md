# Personal-site analytics

The existing GitHub Pages site renders `/analytics/` and `/ar/analytics/` as private-dashboard shells. They contain no activity data or owner credentials. A random 32-byte owner key is supplied separately to the owner, never committed or passed in a URL. The dashboard sends it as `X-Analytics-Key` and offers per-tab retention for up to eight hours, with logout. The API stores only its SHA-256 digest.

## Components

- `data/analytics-config.json`: public configuration. The legacy anon JWT is intentionally public and authorizes collection only; never replace it with a service-role key.
- `analytics.js`: delegated, non-blocking collection on registered public pages, with bounded retries and event IDs for deduplication.
- `scripts/localize_site.py`: injects the same tracker/configuration and localized privacy links across both languages.
- `scripts/build_analytics.py`: renders both dashboards and privacy pages; `analytics/dashboard.js` renders authenticated API results using text nodes.
- `supabase/schema/portfolio-analytics.sql`: dedicated RLS-protected tables and service-only SQL functions. Apply through a migration, then initialize the settings row with the digest of the separately generated owner key.
- `supabase/functions/portfolio-collect/index.ts`: deploy as `portfolio-collect` with JWT verification enabled. The browser supplies the public anon JWT. Validates origin, registered paths and destinations, event schema and size before service-only ingest.
- `supabase/functions/portfolio-stats/index.ts`: deploy as `portfolio-stats` with gateway JWT verification disabled because the function itself authenticates `X-Analytics-Key` before running the statistics RPC. Responses use `Cache-Control: no-store`.

These components use the existing connected Supabase project. They do not change CPIT or research tables or functions. There is no Twitter integration.

## What counts mean

Visitors are approximate anonymous browser IDs, expiring after 30 days; they are not verified people. Sessions expire after 30 minutes of inactivity. Storage failure uses temporary per-page IDs. Multiple devices, deleted storage, blockers, preferences and automation affect coverage. DNT, GPC and the privacy-page opt-out are respected. Preview/local/automated contexts, the owner dashboards, privacy pages, errors and redirects do not emit page views.

`link_clicks` includes internal, external, project, contact, language-switch and download anchor clicks. The category cards are subsets and must not be added to this total. `cv_print_request` and `demo_run` are separate button actions. Download clicks and CV print/save requests do not confirm completion. Current CV pages provide browser print buttons, not downloadable PDF files. Clicking a project link records the exit, not activity inside another repository or external site.

No names, email recipients, form values, link text, full referrers or raw IP addresses are stored in the analytics tables. Link query strings and fragments other than known public anchors are removed; referrers are hostname-only. Hosting providers process normal network requests under their own policies.

The API reports the selected 1/7/30/90 calendar days in Asia/Riyadh, with zero-filled daily series. `1` means today. Recent activity is limited to 100 rows; totals include the whole selected period. Events older than 90 days are deleted during the next collection or owner dashboard request, checked once per day. No background deletion schedule is configured. Collection starts when activated; historical traffic cannot be reconstructed.

## Maintenance and verification

Run `python scripts/build_site.py`, all `scripts/validate_*.py` validators and `node --test scripts/test_analytics.mjs scripts/test_dashboard.mjs` with Node 24. The tests exercise preferences, retry deduplication, click/print classification, private dashboard states and every actual HTML destination against server normalization. When adding pages, external destinations or actual download assets, update the server route/destination inventory and rerun these tests before deploying the function and publishing the site.

Both analytics tables intentionally have RLS enabled with no browser policies, and table/RPC grants are revoked from `anon` and `authenticated`. Service-role access exists only inside server functions. The informational Supabase lint about RLS without policies reflects this deliberate deny-by-default design.

For key rotation, generate a new 32-byte random token, replace `admin_key_hash` on the single private settings row with its SHA-256 digest, and deliver the token privately. Existing dashboard sessions using the former key will fail authentication. Never commit keys or real activity exports to this public repository.
