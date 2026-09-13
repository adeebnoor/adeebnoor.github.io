"""Regression checks for full-page translations and language-preserving navigation."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urljoin, parse_qsl
import re
import json
from localize_site import PAGES, public_path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://adeebnoor.github.io'


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.html, self.links, self.images, self.navs = {}, [], [], []
        self.header_count = 0
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html':
            self.html = attrs
        if tag == 'a':
            self.links.append(attrs)
        if tag in ('img', 'svg') and 'project-image' in attrs.get('class', '').split():
            self.images.append(attrs)
        if tag == 'nav':
            self.navs.append(attrs)
        if tag == 'header' and attrs.get('class') == 'site-header':
            self.header_count += 1


errors = []
projects = json.loads((ROOT/'data/featured-projects.json').read_text())
english_paths = {public_path(p) for p in PAGES} | {'/' + p for p in PAGES}
for page in PAGES:
    for arabic in (False, True):
        name = ('ar/' if arabic else '') + page
        path = ROOT / name
        if not path.is_file():
            errors.append(f'Missing counterpart: {name}')
            continue
        document = Page(path)
        if document.html.get('lang') != ('ar' if arabic else 'en'):
            errors.append(f'{name}: incorrect language')
        if arabic and document.html.get('dir') != 'rtl':
            errors.append(f'{name}: missing RTL direction')
        if page != 'collaborate.html':
            if document.header_count != 1 or len(document.navs) < 2:
                errors.append(f'{name}: missing shared desktop/mobile navigation')
            switches = [a for a in document.links if 'site-language' in a.get('class','').split()]
            if len(switches) != 2 or any(a.get('href') != public_path(page,not arabic) for a in switches):
                errors.append(f'{name}: language switch does not preserve the page')
        for link in document.links:
            href = link.get('href', '')
            if not arabic or not href or 'site-language' in link.get('class','').split():
                continue
            if href.startswith('mailto:'):
                for key, text in parse_qsl(urlsplit(href).query):
                    if key in ('subject', 'body') and not re.search(r'[\u0600-\u06ff]', text):
                        errors.append(f'{name}: untranslated email {key}')
            target = urlsplit(urljoin(ORIGIN + '/' + name, href))
            if target.netloc == 'adeebnoor.github.io' and target.path in english_paths:
                errors.append(f'{name}: Arabic navigation escapes to {href}')
        if page == 'index.html' and len(document.images) != 6:
            errors.append(f'{name}: expected six illustrated project cards')
        if page == 'index.html':
            image_links = [a for a in document.links if 'project-visual-link' in a.get('class','').split()]
            expected = [p.get('liveUrl',{}).get('ar' if arabic else 'en',('/ar' if arabic else '')+p['url']) for p in projects]
            if [a.get('href') for a in image_links] != expected:
                errors.append(f'{name}: project images must open the intended project destinations')
            for a in image_links:
                if urlsplit(a.get('href','')).netloc and (a.get('target')!='_blank' or 'noopener' not in a.get('rel','').split()):
                    errors.append(f'{name}: external project image needs safe new-tab behavior')

for image in ('project-miyar','project-iscarb','project-shifaa','miyar-actual'):
    file = ROOT / f'assets/{image}.webp'
    data = file.read_bytes()
    if data[:4] != b'RIFF' or data[8:12] != b'WEBP' or int.from_bytes(data[4:8], 'little') + 8 != len(data):
        errors.append(f'{file.name}: missing or incomplete illustration')

if errors:
    raise SystemExit('\n'.join(errors))
print(f'Validated {len(PAGES)} page pairs, same-page language switches, Arabic destinations and six illustrated cards.')
