"""Keep the featured project cards consistent in both languages."""
from pathlib import Path
import json
import re
from html import escape
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
projects = json.loads((ROOT/'data/featured-projects.json').read_text())
for lang, page in [('en','index.html'),('ar','ar/index.html')]:
    arabic = lang == 'ar'
    cards=[]
    for item in projects:
        copy=item[lang]
        details_url=('/ar'+item['url']) if arabic else item['url']
        destination=item.get('liveUrl', {})
        url=destination.get(lang, details_url)
        external=bool(urlsplit(url).netloc)
        link_attrs=' target="_blank" rel="noopener noreferrer"' if external else ''
        open_label=copy.get('liveCta',copy['cta'])
        accessible_label=open_label + (' — يفتح في علامة تبويب جديدة' if arabic else ' — opens in a new tab') if external else open_label
        image_class='project-image' + (' project-image-actual' if item.get('actualImage') else '')
        if item.get('image'):
            fallback=''
            if item.get('fallbackImage'):
                handler='this.onerror=null;this.src='+json.dumps(item['fallbackImage'])+';this.alt='+json.dumps(copy['fallbackAlt'],ensure_ascii=False)+';'
                fallback=' onerror="'+escape(handler,quote=True)+'"'
            image_src=item['image']
            if item.get('id')=='sultan' and image_src.endswith('.svg'):
                image_src=image_src[:-4]+'.webp'
            visual=f'<img class="{image_class}" src="{image_src}" alt="{escape(copy["alt"])}" width="{item.get("imageWidth",960)}" height="{item.get("imageHeight",640)}" loading="lazy" decoding="async"{fallback}>'
        else:
            visual=f'<svg class="project-image" preserveAspectRatio="xMidYMid slice" viewBox="{item["viewBox"]}" role="img" aria-label="{escape(copy["alt"])}"><image width="1122" height="1402" href="/assets/portfolio-art.webp"/></svg>'
        visual=f'<a class="project-visual-link" href="{url}" aria-label="{escape(accessible_label)}"{link_attrs}>{visual}<span class="project-open" aria-hidden="true">{"↗" if external else "←" if arabic else "→"}</span></a>'
        secondary=''
        if destination and not item.get('hideSecondary'):
            secondary=f'<a class="project-context" href="{details_url}">{"دوري وخلفية المشروع" if arabic else "My role & project background"}</a>'
        if item.get('reviewUrl'):
            secondary=f'<a class="project-context" href="{escape(item["reviewUrl"],quote=True)}">{escape(copy["reviewCta"])}</a>'
        if item.get('ideaUrl'):
            idea_url=('/ar' if arabic else '')+item['ideaUrl']
            secondary=f'<a class="project-context" href="{idea_url}">{escape(copy["ideaCta"])}</a>'
        state=item.get('state',{}).get(lang,copy['stage'])
        updated=item.get('updated',{}).get(lang,'')
        role=item.get('role',{}).get(lang,'')
        meta='<div class="project-meta"><span class="project-state">'+escape(state)+'</span>'+('<span class="project-updated">'+escape(updated)+'</span>' if updated else '')+'</div>'
        role_html='<p class="project-role">'+escape(role)+'</p>' if role else ''
        cards.append(f'<article class="card" data-project="{item["id"]}">{visual}<div class="card-copy">{meta}<div class="status">{escape(copy["stage"])}</div><h3>{escape(copy["name"])}</h3><div class="subtitle">{escape(copy["domain"])}</div><p>{escape(copy["description"])}</p>{role_html}<div class="project-actions"><a class="button primary" href="{url}" aria-label="{escape(accessible_label)}"{link_attrs}>{escape(open_label)} {"↗" if external else "←" if arabic else "→"}</a>{secondary}</div></div></article>')
    heading='بحث. ابتكار. أثر واقعي.' if arabic else 'Research. Innovation. Real-World Impact.'
    label='مشاريع مختارة' if arabic else 'Selected Projects'
    note='افتح صورة المشروع لاستكشافه، واطّلع على خلفيته للتعرّف إلى دوري ومرحلة العمل.' if arabic else 'Open a project image to explore the work, or read its background for my contribution and the project’s stage.'
    section=f'<section class="section" id="projects"><div class="wrap"><div class="label">{label}</div><h2>{heading}</h2><p class="project-intro">{note}</p><div class="cards project-grid">'+''.join(cards)+'</div></div></section>'
    p=ROOT/page
    source=p.read_text()
    source,n=re.subn(r'<section class="section" id="projects">.*?</section>',section,source,count=1,flags=re.S)
    if n!=1:raise ValueError(f'Missing project section in {page}')
    source=source.replace('portfolio.css?v=20260913-2','portfolio.css?v=20260913-ar1')
    source=source.replace('portfolio.css?v=20260913-ar1','portfolio.css?v=20260913-projects2')
    if arabic:
        source=source.replace('اطّلع على السيرة التنفيذية بالإنجليزية','اطّلع على السيرة التنفيذية').replace('content="Adeeb Noor portfolio artwork"','content="تصميم ملف أديب نور المهني"')
        source=source.replace('aria-label="أديب نور"','aria-label="أديب نور"').replace('aria-label="Adeeb Noor"','aria-label="أديب نور"')
    p.write_text(source)
print('Updated illustrated project cards in both languages.')
