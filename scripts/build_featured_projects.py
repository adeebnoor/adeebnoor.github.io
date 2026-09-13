"""Keep the six featured project cards consistent in both languages."""
from pathlib import Path
import json
import re
from html import escape

ROOT = Path(__file__).resolve().parents[1]
projects = json.loads((ROOT/'data/featured-projects.json').read_text())
for lang, page in [('en','index.html'),('ar','ar/index.html')]:
    arabic = lang == 'ar'
    cards=[]
    for item in projects:
        copy=item[lang]
        if item.get('image'):
            visual=f'<img class="project-image" src="{item["image"]}" alt="{escape(copy["alt"])}" width="960" height="640" loading="lazy" decoding="async">'
        else:
            visual=f'<svg class="project-image" preserveAspectRatio="xMidYMid slice" viewBox="{item["viewBox"]}" role="img" aria-label="{escape(copy["alt"])}"><image width="1122" height="1402" href="/assets/portfolio-art.webp"/></svg>'
        url=('/ar'+item['url']) if arabic else item['url']
        cards.append(f'<article class="card" data-project="{item["id"]}">{visual}<div class="card-copy"><div class="status">{escape(copy["stage"])}</div><h3>{escape(copy["name"])}</h3><div class="subtitle">{escape(copy["domain"])}</div><p>{escape(copy["description"])}</p><a class="button primary" href="{url}">{escape(copy["cta"])} {"←" if arabic else "→"}</a></div></article>')
    heading='بحث. ابتكار. أثر واقعي.' if arabic else 'Research. Innovation. Real-World Impact.'
    label='مشاريع مختارة' if arabic else 'Selected Projects'
    note='تجارب مؤسسية ومشاريع بحثية وتعليمية، مع توضيح مرحلة كل مشروع.' if arabic else 'Institutional experience, research and learning systems — with each project’s stage made clear.'
    section=f'<section class="section" id="projects"><div class="wrap"><div class="label">{label}</div><h2>{heading}</h2><p class="project-intro">{note}</p><div class="cards project-grid">'+''.join(cards)+'</div></div></section>'
    p=ROOT/page
    source=p.read_text()
    source,n=re.subn(r'<section class="section" id="projects">.*?</section>',section,source,count=1,flags=re.S)
    if n!=1:raise ValueError(f'Missing project section in {page}')
    source=source.replace('portfolio.css?v=20260913-2','portfolio.css?v=20260913-ar1')
    if arabic:
        source=source.replace('اطّلع على السيرة التنفيذية بالإنجليزية','اطّلع على السيرة التنفيذية').replace('content="Adeeb Noor portfolio artwork"','content="تصميم ملف أديب نور المهني"')
        source=source.replace('aria-label="أديب نور"','aria-label="أديب نور"').replace('aria-label="Adeeb Noor"','aria-label="أديب نور"')
    p.write_text(source)
print('Updated six illustrated cards in both languages.')
