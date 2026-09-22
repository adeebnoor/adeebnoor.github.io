# Clean homepage final-state validation.
# Strategy-human-capital-research final validation trigger.
# Post-generation hero thesis validation trigger.
# Final UX state validation trigger.
"""Check public HTML targets and assets before publishing this static portfolio."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.targets, self.duplicates = path, set(), [], []
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            if attrs['id'] in self.ids:
                self.duplicates.append(attrs['id'])
            self.ids.add(attrs['id'])
        for key in ('href', 'src', 'poster'):
            if attrs.get(key):
                self.targets.append((tag, attrs[key]))


pages = {p.resolve(): Page(p) for p in ROOT.rglob('*.html') if not any(x in p.parts for x in ('.git','node_modules','audit-artifacts'))}
errors = []
checked = 0
for path, page in pages.items():
    errors.extend(f'{path.relative_to(ROOT)}: duplicate id {id_}' for id_ in page.duplicates)
    for tag, href in page.targets:
        u = urlsplit(href)
        if u.scheme or u.netloc:
            continue
        target = (ROOT / u.path.lstrip('/') if u.path.startswith('/') else path.parent / unquote(u.path)) if u.path else path
        if target.is_dir() or u.path.endswith('/'):
            target /= 'index.html'
        target = target.resolve()
        checked += 1
        if not target.is_file():
            errors.append(f'{path.relative_to(ROOT)}: missing target {href}')
        elif tag == 'a' and u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
            errors.append(f'{path.relative_to(ROOT)}: missing anchor {href}')

for path in (ROOT / 'data').glob('*.json'):
    json.loads(path.read_text())
for path in (ROOT / 'portfolio.css', ROOT / 'nav.css'):
    for url in re.findall(r'url\([\"\']?([^\)\"\']+)', path.read_text()):
        if not urlsplit(url).scheme and not (path.parent / url).is_file():
            errors.append(f'{path.name}: missing CSS asset {url}')
art = (ROOT / 'assets/portfolio-art.webp').read_bytes()
if art[:4] != b'RIFF' or art[8:12] != b'WEBP' or int.from_bytes(art[4:8], 'little') + 8 != len(art):
    errors.append('Original portfolio artwork is missing or truncated.')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Validated {len(pages)} HTML pages, {checked} local references/anchors, JSON and original artwork.')
