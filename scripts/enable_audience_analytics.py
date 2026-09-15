"""Attach the existing privacy-aware analytics client to the new audience pages.

The route inventory is derived from the canonical tracker, then extended only with
these bilingual landing pages so the generated build remains deterministic.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('funders.html', 'students.html', 'academic.html', 'press.html')

contact = (ROOT/'contact.html').read_text()
match = re.search(r'<script\b[^>]*id="portfolio-analytics"[^>]*></script>', contact)
if not match:
    raise SystemExit('Analytics client tag missing from contact.html')
tag = match.group(0)
routes_match = re.search(r'data-pages="([^"]+)"', tag)
if not routes_match:
    raise SystemExit('Analytics page inventory missing')
routes = json.loads(html.unescape(routes_match.group(1)))
for page in PAGES:
    for route in ('/'+page, '/ar/'+page):
        if route not in routes:
            routes.append(route)
encoded = html.escape(json.dumps(routes, separators=(',', ':')), quote=True)
tag = re.sub(r'data-pages="[^"]+"', 'data-pages="'+encoded+'"', tag, count=1)

for page in PAGES:
    for path in (ROOT/page, ROOT/'ar'/page):
        source = path.read_text()
        source = re.sub(r'<script\b[^>]*id="portfolio-analytics"[^>]*></script>', '', source)
        source = source.replace('</head>', tag+'</head>', 1)
        path.write_text(source)

print('Enabled analytics on eight new audience landing pages.')
