"""Reader-visible regression checks for the specific follow-up findings."""
from pathlib import Path
from html.parser import HTMLParser
import json,re
ROOT=Path(__file__).resolve().parents[1]
IDEAS=json.loads((ROOT/'data/ideas-content.json').read_text())
DATES=json.loads((ROOT/'data/essay-dates.json').read_text())
PROJECTS=json.loads((ROOT/'data/featured-projects.json').read_text())
class DateCards(HTMLParser):
    def __init__(self,source):
        super().__init__();self.cards={};self.slug=None;self.feed(source)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='p' and 'data-essay-date' in attrs:
            self.slug=attrs['data-essay-date'];self.cards[self.slug]=[]
        if tag=='time' and self.slug:
            self.cards[self.slug].append(attrs.get('datetime'))
    def handle_endtag(self,tag):
        if tag=='p': self.slug=None
for lang in ('en','ar'):
    prefix='ar/' if lang=='ar' else ''
    for archive in ('ideas/index.html','writing/index.html'):
        source=(ROOT/(prefix+archive)).read_text()
        actual=DateCards(source).cards
        expected={a['slug']:[DATES[prefix+a['path'].lstrip('/')]['published']] for a in IDEAS['articles']}
        assert actual==expected,(prefix+archive,'Each essay card needs its real language-specific date')
        assert 'I will date new essays' not in source and 'سأؤرّخ المقالات الجديدة' not in source
    home=(ROOT/(prefix+'index.html')).read_text()
    assert home.count('id="work-and-ideas"')==1
    assert len(re.findall('data-project=',home))==len(PROJECTS)==7
    assert 'data-project="imam"' in home
    for item in PROJECTS:
        if item.get('reviewUrl'): assert 'href="'+item['reviewUrl']+'"' in home
        if item.get('ideaUrl'): assert 'href="'+('/ar' if lang=='ar' else '')+item['ideaUrl']+'"' in home
    contact=(ROOT/(prefix+'contact.html')).read_text()
    assert contact.index('id="inquiry-form"') < contact.index('id="engagement-options"')
    assert re.search(r'<div class="hero-actions"><a class="primary" href="#inquiry-form">',contact)
    assert contact.count('data-inquiry-form')==1
print('Follow-up passed: 16 dated archive cards; two matched gateways, seven-project grids and form-first Contact pages.')
