"""Keep public analytics configuration and private dashboard boundaries consistent."""
from html.parser import HTMLParser
from pathlib import Path
import base64
import json
from localize_site import PAGES, public_path

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT/'data/analytics-config.json').read_text())
excluded = {'analytics/index.html', 'privacy.html', '404.html', 'collaborate.html'}
routes = {public_path(page, arabic) for page in PAGES if page not in excluded for arabic in (False, True)}

class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.trackers, self.metas, self.links = [], {}, []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('id') == 'portfolio-analytics':
            self.trackers.append(attrs)
        if tag == 'meta':
            self.metas[attrs.get('name')] = attrs.get('content', '')
        if tag == 'a':
            self.links.append(attrs.get('href'))

payload = config['publicAnonKey'].split('.')[1]
claims = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))
assert claims['role'] == 'anon', 'Only the public anon key may be in browser configuration'
assert config['endpoint'].endswith('/functions/v1/portfolio-collect')
assert config['statsEndpoint'].endswith('/functions/v1/portfolio-stats')
assert config['retentionDays'] == 90
count = 0
for page in PAGES:
    for arabic in (False, True):
        path = ROOT/(('ar/' if arabic else '') + page)
        doc = Document(path.read_text())
        expected = int(bool(config['enabled']) and page not in excluded)
        assert len(doc.trackers) == expected, f'{path}: expected {expected} tracking scripts'
        if expected:
            tracker = doc.trackers[0]
            assert tracker['data-key'] == config['publicAnonKey']
            assert tracker['data-endpoint'] == config['endpoint']
            assert set(json.loads(tracker['data-pages'])) == routes
            assert ('/ar/privacy.html' if arabic else '/privacy.html') in doc.links
            count += 1
        if page == 'analytics/index.html':
            assert 'noindex' in doc.metas.get('robots', '')
            assert doc.metas.get('referrer') == 'no-referrer'
            assert 'portfolio-analytics' not in doc.trackers
assert '/analytics/' not in (ROOT/'sitemap.xml').read_text()
print(f'Validated analytics on {count} public pages; owner, privacy, error and redirect pages excluded.')
