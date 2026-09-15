"""Fail the build if shared public identity or evidence/navigation contracts drift."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit, urljoin
import json
import re

ROOT = Path(__file__).resolve().parents[1]


class IdentityPage(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.links, self.ids, self.metrics, self.guides = [], set(), {}, 0
        self.current_link = None
        self.current_metric = None
        self.metric_depth = 0
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if 'identity-cv-guide' in attrs.get('class', '').split():
            self.guides += 1
        if tag == 'div' and self.current_metric:
            self.metric_depth += 1
        if 'data-identity-metric' in attrs:
            self.current_metric = attrs['data-identity-metric']
            self.metric_depth = 1
            self.metrics[self.current_metric] = []
        if tag == 'a':
            self.current_link = {'href': attrs.get('href', ''), 'text': '', 'class': attrs.get('class', ''),
                                 'owner': attrs.get('data-contact-owner', ''), 'site': attrs.get('data-site', '')}
            self.links.append(self.current_link)
            if self.current_metric:
                self.metrics[self.current_metric].append(self.current_link)

    def handle_endtag(self, tag):
        if tag == 'a':
            self.current_link = None
        if tag == 'div' and self.current_metric:
            self.metric_depth -= 1
            if self.metric_depth == 0:
                self.current_metric = None

    def handle_data(self, data):
        if self.current_link is not None:
            self.current_link['text'] += data


def validate():
    from localize_site import PAGES, public_path
    identity = json.loads((ROOT / 'data/site_identity.json').read_text())
    errors, documents = [], {}
    official = identity['institutional_email']
    # The homepage intentionally uses compact CV links; the explanatory CV guide lives on About/CV pages.
    guide_pages = ('about.html', 'master-cv.html', 'executive-cv.html', 'academic-cv.html')
    for page in PAGES:
        for lang in ('en', 'ar'):
            name = ('ar/' if lang == 'ar' else '') + page
            source = (ROOT / name).read_text()
            doc = documents[name] = IdentityPage(source)
            for old in identity['legacy_emails']:
                if old.lower() in unquote(source).lower():
                    errors.append(f'{name}: legacy personal email remains')
            for link in doc.links:
                href = link['href']
                if href.startswith('mailto:') and link['owner'] != 'external' and urlsplit(href).path != official:
                    errors.append(f'{name}: unexpected public contact address {urlsplit(href).path}')
                if link['site'] == 'institutional-email' and re.sub(r'\s*[→←]\s*$', '', link['text'].strip()) != official:
                    errors.append(f'{name}: displayed email diverges from the canonical contact address')
                if 'site-contact' in link['class'].split():
                    if link['text'].strip() != identity['contact_label'][lang]:
                        errors.append(f'{name}: navigation Contact label diverges from canonical identity')
            if re.search(r'17\+\s+[Yy]ears|(?:أكثر من|تزيد على)\s+17\s+عام', source):
                errors.append(f'{name}: obsolete experience total remains')
            if page in ('index.html', 'about.html', 'impact.html') and identity['experience']['label'][lang] not in source:
                errors.append(f'{name}: canonical experience headline missing')
            if page in guide_pages and doc.guides != 1:
                errors.append(f'{name}: expected one visible explanation of the two CVs')
            if page in ('about.html', 'impact.html'):
                expected = {m['id']: m for m in identity['evidence']['metrics']}
                if set(doc.metrics) != set(expected):
                    errors.append(f'{name}: evidence-aware metric cards missing')
                for key, metric in expected.items():
                    links = doc.metrics.get(key, [])
                    destination = public_path(metric['source_page'], lang == 'ar')
                    if metric['source_anchor']:
                        destination += '#' + metric['source_anchor']
                    if not any(link['href'] == destination for link in links):
                        errors.append(f'{name}: {key} needs a visible link to its scope and source')
            if page == 'executive-cv.html':
                for anchor in ('metric-sources', 'experience-basis', 'educator-scope', 'platform-reach'):
                    if anchor not in doc.ids:
                        errors.append(f'{name}: source note #{anchor} missing')
                if identity['evidence']['owner_reported'][lang] not in source:
                    errors.append(f'{name}: provenance qualification must remain in the scope/source notes')
                if re.search(r'5 (?:AI )?Platforms|5 منصات', source):
                    errors.append(f'{name}: mixed-stage platform count is presented as a headline')
            if page == 'impact.html' and re.search(r'<b>SHIFAA</b><span>[^<]*1,000,000', source):
                errors.append(f'{name}: aggregated platform reach wrongly assigned entirely to SHIFAA')

    # Source links must resolve within the published language and to real notes.
    for name, doc in documents.items():
        for link in doc.links:
            if 'identity-source-link' not in link['class'].split():
                continue
            target = urlsplit(urljoin('https://adeebnoor.github.io/' + name, link['href']))
            dest = target.path.lstrip('/')
            if not dest or dest.endswith('/'):
                dest += 'index.html'
            if dest not in documents or (target.fragment and target.fragment not in documents[dest].ids):
                errors.append(f'{name}: broken identity evidence destination {link["href"]}')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Validated shared identity, CV guidance and metric provenance across {len(documents)} pages.')


if __name__ == '__main__':
    validate()
