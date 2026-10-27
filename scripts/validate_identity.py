"""Fail the build if shared public identity or evidence/navigation contracts drift."""
from html import unescape
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
                allowed = {official, identity.get('opportunities_email', official)}
                if href.startswith('mailto:') and link['owner'] != 'external' and urlsplit(href).path not in allowed:
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

    # The KAUST visiting professorship is current (2016–present). Do not let a
    # closed date or a "former" label return on the public pages or their sources.
    kaust_current = {
        'about.html': ('2016–Present', 'Visiting Professor — Bio-Ontology Research Group, KAUST'),
        'ar/about.html': ('2016–حتى الآن', 'أستاذ زائر — مجموعة أبحاث الأنطولوجيا الحيوية، كاوست'),
        'academic-cv.html': ('2016–Present', 'Visiting Professor — Bio-Ontology Research Group, KAUST', 'Visiting Professor · Bio-Ontology Research Group'),
        'ar/academic-cv.html': ('2016–حتى الآن', 'أستاذ زائر — مجموعة أبحاث الأنطولوجيا الحيوية، كاوست', 'أستاذ زائر · مجموعة أبحاث الأنطولوجيا الحيوية'),
        'executive-cv.html': ('2016–Present', 'Visiting Professor — Bio-Ontology Research Group, KAUST'),
        'ar/executive-cv.html': ('2016–حتى الآن', 'أستاذ زائر — مجموعة أبحاث الأنطولوجيا الحيوية، كاوست'),
        'advisory.html': ('Visiting Professor, KAUST (since 2016)',),
        'ar/advisory.html': ('أستاذ زائر في KAUST منذ 2016',),
    }
    kaust_forbidden = (
        'Former Visiting Professor',
        'Visiting Professor (former)',
        'former visiting professor',
        'Former visiting-professor',
        'أستاذ زائر سابق',
        'زائر سابقًا',
        'ملف الأستاذ الزائر السابق',
    )
    for name, phrases in kaust_current.items():
        source = (ROOT / name).read_text()
        for phrase in phrases:
            if phrase not in source:
                errors.append(f'{name}: KAUST visiting role must stay current ({phrase})')
    opportunities = json.loads((ROOT / 'data/opportunities.json').read_text())
    for phrase in ('Visiting Professor, KAUST (since 2016)', 'أستاذ زائر في KAUST منذ 2016'):
        if phrase not in json.dumps(opportunities, ensure_ascii=False):
            errors.append(f'data/opportunities.json: missing current KAUST role ({phrase})')
    master = json.loads((ROOT / 'data/master_cv.json').read_text())
    kaust_roles = [item for item in master['experience'] if 'Visiting Professor' in item.get('title', '')]
    if len(kaust_roles) != 1 or kaust_roles[0]['date'] != '2016–Present' or '(former)' in kaust_roles[0]['title'].lower():
        errors.append('data/master_cv.json: KAUST visiting professorship must be current (2016–Present)')
    scan_roots = [ROOT / 'data', ROOT / 'i18n', ROOT / 'docs']
    scan_files = [path for root in scan_roots for path in root.rglob('*') if path.suffix.lower() in ('.json', '.md', '.html')]
    scan_files.extend(path for path in ROOT.glob('*.html'))
    scan_files.extend(path for path in (ROOT / 'ar').rglob('*.html'))
    for path in scan_files:
        lowered = path.read_text(encoding='utf-8').lower()
        if any(phrase.lower() in lowered for phrase in kaust_forbidden):
            errors.append(f'{path.relative_to(ROOT)}: KAUST visiting role is described as former')

    # The KAU research-office advisory title and the HEALTHx founder line are canonical.
    kau_title = 'Chief Strategy Advisor, Office of the Vice President for Research & Innovation, King Abdulaziz University (2025–Present)'
    kau_ar = 'كبير مستشاري الاستراتيجية لوكيل الجامعة للبحث والابتكار'
    healthx_line = 'clinical innovation platform; invention disclosure under review'
    for name in ('executive-cv.html', 'about.html', 'advisory.html'):
        if kau_title not in unescape((ROOT / name).read_text()):
            errors.append(f'{name}: KAU advisory title must read exactly: {kau_title}')
    for name in ('ar/executive-cv.html', 'ar/about.html', 'ar/advisory.html'):
        if kau_ar not in (ROOT / name).read_text():
            errors.append(f'{name}: Arabic KAU advisory title missing')
    if kau_title not in json.dumps(master, ensure_ascii=False):
        errors.append('data/master_cv.json: KAU advisory title missing')
    opportunity_text = json.dumps(opportunities, ensure_ascii=False)
    if kau_title not in opportunity_text or kau_ar not in opportunity_text:
        errors.append('data/opportunities.json: KAU advisory title missing')
    if 'Founder, HEALTHx' not in unescape((ROOT / 'executive-cv.html').read_text()) or healthx_line not in unescape((ROOT / 'executive-cv.html').read_text()):
        errors.append('executive-cv.html: HEALTHx must be presented as Founder, HEALTHx with the modest platform line')
    healthx_record = next(item for item in master['ventures'] if 'HEALTHx' in item[0])
    if healthx_record != ['Founder, HEALTHx', healthx_line]:
        errors.append('data/master_cv.json: HEALTHx must stay Founder, HEALTHx — clinical innovation platform; invention disclosure under review')
    obsolete_titles = (
        'Senior Strategy Advisor',
        'Chief Transformation Advisor',
        'Chief Strategy Advisor —',
        'Chief Strategy Advisor -',
        'Office of the VP for Research',
        'كبير المستشارين الاستراتيجيين',
    )
    identity_files = [ROOT / 'data/master_cv.json', ROOT / 'data/opportunities.json', ROOT / 'executive-cv.html', ROOT / 'about.html', ROOT / 'advisory.html', ROOT / 'ar/executive-cv.html', ROOT / 'ar/about.html', ROOT / 'ar/advisory.html']
    for path in identity_files:
        text = path.read_text(encoding='utf-8')
        for phrase in obsolete_titles:
            if phrase in text:
                errors.append(f'{path.relative_to(ROOT)}: obsolete KAU advisory title remains ({phrase})')

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
