"""Keep audience contributions and evidence consistent across both homepages."""
from pathlib import Path
from html import escape
import json
import re

ROOT = Path(__file__).resolve().parents[1]
audiences = json.loads((ROOT/'data/homepage-audiences.json').read_text())
for lang, filename in [('en','index.html'),('ar','ar/index.html')]:
    arabic = lang == 'ar'
    prefix = '/ar' if arabic else ''
    arrow = '←' if arabic else '→'
    cards = []
    for item in audiences:
        copy = item[lang]
        cards.append(f'<article class="partner"><h3>{escape(copy["name"])}</h3><div class="partner-promise">{escape(copy["promise"])}</div><p>{escape(copy["contribution"])}</p><a class="partner-proof" href="{prefix+item["evidenceUrl"]}">{escape(copy["evidence"])}</a><a class="partner-cta" href="{prefix}/contact.html#{item["contact"]}">{escape(copy["cta"])} {arrow}</a></article>')
    label = 'فرص التعاون' if arabic else 'Work With Me'
    heading = 'ماذا يمكن أن ننجز معًا؟' if arabic else 'What can we accomplish together?'
    section = f'<section class="section" id="collaboration"><div class="wrap"><div class="label">{label}</div><h2>{heading}</h2><div class="partners">'+''.join(cards)+'</div></div></section>'
    path = ROOT/filename
    source = path.read_text()
    source,count = re.subn(r'<section class="section"(?: id="collaboration")?><div class="wrap"><div class="label">'+label+r'</div>.*?</section>',section,source,flags=re.S)
    if count != 1:
        raise ValueError(f'Missing audience section in {filename}')
    intro = 'أحوّل الأسئلة البحثية والتحديات المؤسسية إلى أدوات لدعم القرار وأنظمة قابلة للتطبيق، بخبرة في الذكاء الاصطناعي والحكومة والصحة الرقمية والتعليم.' if arabic else 'I turn research questions and institutional challenges into decision tools and practical systems, drawing on experience in AI, government, healthcare and education.'
    source = re.sub(r'<p class="intro">.*?</p>',f'<p class="intro">{intro}</p>',source,count=1,flags=re.S)
    cvs = [('executive-cv.html','السيرة التنفيذية','Executive CV'),('academic-cv.html','السيرة الأكاديمية','Academic CV')]
    actions = '<div class="actions">'+''.join(f'<a class="button'+(' primary' if index==0 else '')+f'" href="{prefix}/{page}">{ar if arabic else en} {arrow}</a>' for index,(page,ar,en) in enumerate(cvs))+f'<a class="button" href="#projects">{"استكشف المشاريع" if arabic else "Explore the Work"}</a></div>'
    source = re.sub(r'<div class="actions">.*?</div>',actions,source,count=1,flags=re.S)
    source = source.replace('<a class="button" href="/" lang="ar">النبذة العربية ←</a>','<a class="button" href="/about.html">About &amp; Career →</a>')
    path.write_text(source)
print('Updated the value statement, CV access and four audience paths in both languages.')
