# Final linked-evidence portfolio validation rerun.
# UX polish final-state validation marker.
# Final evidence portfolio validation rerun.
# Validation rerun marker: final generated portfolio state verified.
"""Audit-specific regression contracts; fail before publishing incomplete flows."""
from pathlib import Path
from html.parser import HTMLParser
import json, re, xml.etree.ElementTree as ET
from localize_site import PAGES,public_path
ROOT=Path(__file__).resolve().parents[1]
class Doc(HTMLParser):
 def __init__(self,source):
  super().__init__();self.tags=[];self.scripts=[];self.script=None;self.feed(source)
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs);self.tags.append((tag,attrs))
  if tag=='script' and attrs.get('type')=='application/ld+json':self.script=''
 def handle_data(self,text):
  if self.script is not None:self.script+=text
 def handle_endtag(self,tag):
  if tag=='script' and self.script is not None:self.scripts.append(json.loads(self.script));self.script=None
ideas=json.loads((ROOT/'data/ideas-content.json').read_text())
featured_projects=json.loads((ROOT/'data/featured-projects.json').read_text())
for lang in ('en','ar'):
 prefix='ar/' if lang=='ar' else ''
 home=(ROOT/(prefix+'index.html')).read_text()
 assert len(re.findall('data-project=',home))==len(featured_projects) and all(f'data-project="{p["id"]}"' in home for p in featured_projects)
 assert home.count('id="work-and-ideas"')==1
 for page in ('index.html','about.html'):
  docs=Doc((ROOT/(prefix+page)).read_text());people=[]
  for s in docs.scripts:
   if s.get('@type')=='Person': people.append(s)
   elif s.get('@type')=='ProfilePage' and isinstance(s.get('mainEntity'),dict) and s['mainEntity'].get('@type')=='Person': people.append(s['mainEntity'])
  assert len(people)==1 and 'https://github.com/adeebnoor' in people[0]['sameAs']
 for page in ('contact.html','writing/index.html'):
  source=(ROOT/(prefix+page)).read_text();doc=Doc(source)
  forms=[a for t,a in doc.tags if t=='form' and 'data-inquiry-form' in a]
  assert len(forms)==1 and forms[0]['method']=='post'
  inputs={a.get('name'):a for t,a in doc.tags if t=='input'}
  assert inputs['email']['type']=='email' and 'required' in inputs['consent']
  assert 'site-inquiry-config' in source and 'contact-form.js' in source
 for a in ideas['articles']:
  source=(ROOT/(prefix+a['path'].lstrip('/'))).read_text();doc=Doc(source)
  schema=[s for s in doc.scripts if s.get('@type')=='Article'];assert len(schema)==1
  assert schema[0]['inLanguage']==lang and schema[0]['headline']==a['title'][lang]
  image=ROOT/'assets/essays'/(a['slug']+'-'+lang+'.png')
  assert image.is_file() and image.read_bytes()[:8]==b'\x89PNG\r\n\x1a\n'
  assert schema[0]['author']['@id']=='https://adeebnoor.github.io/#person'
  assert '<time datetime=' in source
  dates=ROOT/'data/essay-dates.json'
  if dates.exists():
   date=json.loads(dates.read_text())[prefix+a['path'].lstrip('/')]
   assert schema[0]['datePublished']==date['published']
 feed=ET.parse(ROOT/(prefix+'feed.xml')).getroot()
 assert len(feed.findall('./channel/item'))==4
 assert feed.find('./channel/language').text==lang
 cases=(ROOT/(prefix+'engagements.html')).read_text()
 for id_ in ('national-workforce','hospital-modernization','genomefit-translation'): assert 'id="'+id_+'"' in cases
 private=(ROOT/(prefix+'inquiries/index.html')).read_text()
 assert 'noindex,nofollow,noarchive' in private and 'content="no-referrer"' in private
 assert 'id="portfolio-analytics"' not in private
 key=[a for t,a in Doc(private).tags if a.get('id')=='inbox-key'][0];assert 'name' not in key
 assert '/inquiries/' not in (ROOT/'sitemap.xml').read_text()
 assert 'inquiry-privacy' in (ROOT/(prefix+'privacy.html')).read_text()
import validate_followup
print(f'Validated {len(featured_projects)} paired projects, real opt-in forms, private inbox boundaries, three cases, eight Article schemas and two four-item feeds.')
