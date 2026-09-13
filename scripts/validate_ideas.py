"""Verify the two peer navigation paths, complete essays and their evidence links."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import json
from localize_site import PAGES, public_path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT/'data/ideas-content.json').read_text())
IDENTITY = json.loads((ROOT/'data/site_identity.json').read_text())
NAV = json.loads((ROOT/'data/site-navigation.json').read_text())
errors = []


class Navigation(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.primary, self.active, self.links, self.link = False, False, [], None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'nav':
            self.primary = 'site-links' in attrs.get('class','').split()
        if tag == 'a' and self.primary and 'site-language' not in attrs.get('class','').split():
            self.link = {'href':attrs.get('href'), 'text':''}
            self.links.append(self.link)

    def handle_data(self, data):
        if self.link is not None:
            self.link['text'] += data

    def handle_endtag(self, tag):
        if tag == 'nav':
            self.primary = False
        if tag == 'a':
            self.link = None


if len(DATA['articles']) != 4 or len(DATA['theses']) != 4:
    errors.append('Expected four complete essays and four positions.')
for lang in ('en','ar'):
    prefix = 'ar/' if lang == 'ar' else ''
    for page in PAGES:
        if page == 'collaborate.html':
            continue
        doc = (ROOT/(prefix+page)).read_text()
        expected = [{'href':public_path(item['page'],lang=='ar'), 'text':IDENTITY[item['identity_label']][lang] if 'identity_label' in item else item[lang]} for item in NAV]
        if Navigation(doc).links != expected:
            errors.append(prefix+page+': primary navigation differs from the central source')
    for archive in ('ideas/index.html','writing/index.html'):
        doc = (ROOT/(prefix+archive)).read_text()
        for article in DATA['articles']:
            href = ('/ar' if lang == 'ar' else '')+article['path']
            if f'href="{href}"' not in doc:
                errors.append(prefix+archive+': an actual essay is absent')
        if 'Coming next' in doc or 'قريبًا' in doc:
            errors.append(prefix+archive+': placeholder in the real archive')
    for article in DATA['articles']:
        doc = (ROOT/(prefix+article['path'].lstrip('/'))).read_text()
        count = sum(len(s['paragraphs'][lang]) for s in article['sections'])
        if count < 6:
            errors.append(article['path']+': article is only a stub')
        for section in article['sections']:
            if len(section['paragraphs']['en']) != len(section['paragraphs']['ar']):
                errors.append(article['path']+': incomplete paragraph translation')
            for paragraph in section['paragraphs'][lang]:
                if '<p>'+escape(paragraph)+'</p>' not in doc:
                    errors.append(prefix+article['path']+': body diverges from bilingual source')
    position = (ROOT/(prefix+'ideas/position.html')).read_text()
    for thesis in DATA['theses']:
        if f'id="{thesis["id"]}"' not in position or escape(thesis['body'][lang]) not in position:
            errors.append(prefix+'ideas/position.html: a position is missing')
    home = (ROOT/(prefix+'index.html')).read_text()
    if home.count('id="work-and-ideas"') != 1 or home.index('id="work-and-ideas"') > home.index('id="projects"'):
        errors.append(prefix+'index.html: the two entry paths must precede projects')
    if f'href="/{prefix}ideas/position.html#beyond-the-average"' not in home:
        errors.append(prefix+'index.html: RIDI is disconnected from its argument')
if errors:
    raise SystemExit('\n'.join(errors))
print('Validated peer Executive/Ideas navigation, four real bilingual essays, stance/evidence connections and homepage entry paths.')
