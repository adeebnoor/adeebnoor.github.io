"""Build curated latest-research sections and a lightweight RSS feed."""
from pathlib import Path
from html import escape
from email.utils import format_datetime
from datetime import datetime, timezone
import json, re

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'data/latest-research.json').read_text())
START='<!-- latest-research:start -->'
END='<!-- latest-research:end -->'

def label_date(value,lang):
    months_en=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    months_ar=['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    parts=value.split('-')
    if len(parts)==3:
        y,m,d=map(int,parts)
        return f'{d} {months_ar[m]} {y}' if lang=='ar' else f'{d} {months_en[m]} {y}'
    if len(parts)==2:
        y,m=map(int,parts)
        return f'{months_ar[m]} {y}' if lang=='ar' else f'{months_en[m]} {y}'
    return value

def follow_links(lang):
    labels={'Google Scholar':'Google Scholar','ORCID':'ORCID','LinkedIn':'LinkedIn','X':'X'}
    links=''.join(f'<a href="{escape(item["url"],quote=True)}">{labels[item["label"]]}</a>' for item in DATA['follow'])
    rss_label='خلاصة RSS للأبحاث' if lang=='ar' else 'Research updates RSS'
    return f'<div class="latest-follow">{links}<a href="/research-updates.xml">{rss_label}</a></div>'

def card(item,lang,compact=False):
    ar=lang=='ar'
    title=escape(item.get(f'title_{lang}',item['title']))
    summary=escape(item['summary'][lang])
    kind=escape(item['kind'][lang])
    venue=escape(item.get(f'venue_{lang}',item['venue']))
    date=escape(label_date(item['date'],lang))
    source=escape(item['source'][lang])
    url=escape(item.get(f'url_{lang}',item['url']),quote=True)
    ongoing=item.get('record_type')=='work_in_progress'
    cta=('استكشف البحث ←' if ar else 'Explore research →') if ongoing else ('افتح المصدر ←' if ar else 'Open source →')
    if compact:
        return (f'<article class="latest-row"><div class="latest-row-date"><time>{date}</time><span>{kind}</span></div>'
                f'<div class="latest-row-main"><h3>{title}</h3><p>{venue}</p></div>'
                f'<a class="latest-row-link" href="{url}" aria-label="{cta} {title}">↗</a></article>')
    return (f'<article class="latest-card"><div class="latest-meta"><span>{kind}</span><time>{date}</time></div>'
            f'<h3>{title}</h3><p class="latest-venue">{venue}</p><p>{summary}</p>'
            f'<a class="latest-source" href="{url}">{cta} <small>{source}</small></a></article>')

def home_section(lang):
    ar=lang=='ar'
    items=[x for x in DATA['items'] if x.get('featured')][:3]
    kicker='البحث الحالي وأحدث المنشورات' if ar else 'Current research & publications'
    heading='أسئلة جديدة، وأعمال منشورة.' if ar else 'New questions. Published work.'
    intro=('تحديثات من البحث الجاري والنسخ الأولية والأعمال المنشورة، مع توضيح مرحلة كل عمل. '
           'تربط المنشورات بسجلاتها العامة، والبحث الجاري بوصف مساره.') if ar else (
           'Updates from ongoing research, preprints and published work, with each stage stated explicitly. '
           'Publications link to public records; work in progress links to the research program.')
    all_label='كل الأبحاث والمنشورات ←' if ar else 'All research & publications →'
    pub='/ar/publications.html#latest-research' if ar else '/publications.html#latest-research'
    return START+f'<section class="section latest-updates" id="latest-research"><div class="wrap latest-home"><div class="latest-home-head"><div><div class="label">{kicker}</div><h2>{heading}</h2><p class="latest-intro">{intro}</p></div><a class="latest-all-link" href="{pub}">{all_label}</a></div><div class="latest-list">'+''.join(card(x,lang,True) for x in items)+f'</div>{follow_links(lang)}</div></section>'+END

def publications_section(lang):
    ar=lang=='ar'
    kicker='أحدث الأبحاث والسجلات العامة' if ar else 'Latest research & public records'
    heading='منشورات ونسخ أولية بمراحل واضحة.' if ar else 'Publications and preprints, with clear status.'
    intro=('تربط الأعمال أدناه بسجلات الناشرين والمستودعات والمصادر العامة، مع تمييز النسخ الأولية عن المقالات المحكّمة. '
           'تبقى القائمة الكاملة والاستشهادات في Google Scholar وORCID.') if ar else (
           'The entries below link to publisher, repository and public records, distinguishing preprints from peer-reviewed articles. '
           'Google Scholar and ORCID remain the live source for the complete record.')
    public=[x for x in DATA['items'] if x.get('record_type')!='work_in_progress']
    ongoing=[x for x in DATA['items'] if x.get('record_type')=='work_in_progress']
    section=START+f'<section class="section-intro latest-publications" id="latest-research"><div class="kicker">{kicker}</div><div><h2>{heading}</h2><p>{intro}</p>{follow_links(lang)}</div></section><section class="latest-grid latest-grid-wide">'+''.join(card(x,lang) for x in public)+'</section>'
    if ongoing:
        heading='بحث جارٍ' if ar else 'Work in progress'
        kicker='المسار البحثي الحالي' if ar else 'Current research program'
        note='هذه الأعمال قيد التطوير؛ ولا يعني إدراجها قبولًا أو نشرًا في مجلة.' if ar else 'These projects are in development; inclusion does not imply journal acceptance or publication.'
        section+=f'<section class="section-intro latest-publications"><div class="kicker">{kicker}</div><div><h2>{heading}</h2><p>{note}</p></div></section><section class="latest-grid latest-grid-wide">'+''.join(card(x,lang) for x in ongoing)+'</section>'
    return section+END

def replace_block(text,section):
    text=re.sub(re.escape(START)+r'.*?'+re.escape(END),'',text,flags=re.S)
    return text,section

for path,lang in [(ROOT/'index.html','en'),(ROOT/'ar/index.html','ar')]:
    text=path.read_text()
    text,section=replace_block(text,home_section(lang))
    expertise=re.search(r'<!-- expertise-map:start -->.*?<!-- expertise-map:end -->',text,flags=re.S)
    if expertise:
        insert_at=expertise.end()
    else:
        m=re.search(r'(<section class="stats"[^>]*>.*?</section>)',text,flags=re.S)
        if not m: raise ValueError(f'{path}: stats section missing')
        insert_at=m.end()
    text=text[:insert_at]+section+text[insert_at:]
    path.write_text(text)

for path,lang in [(ROOT/'publications.html','en'),(ROOT/'ar/publications.html','ar')]:
    text=path.read_text()
    text,section=replace_block(text,publications_section(lang))
    m=re.search(r'(<main\b[^>]*>)',text)
    if not m: raise ValueError(f'{path}: main missing')
    text=text[:m.end()]+section+text[m.end():]
    path.write_text(text)

# Curated RSS: full dates receive pubDate; month-only records remain valid without one.
items=[]
for item in DATA['items']:
    title=escape(item['title'])
    link=escape(item['url'])
    desc=escape(f'{item["kind"]["en"]}. {item["summary"]["en"]}')
    pub=''
    if re.fullmatch(r'\d{4}-\d{2}-\d{2}',item['date']):
        dt=datetime.fromisoformat(item['date']).replace(tzinfo=timezone.utc)
        pub=f'<pubDate>{format_datetime(dt)}</pubDate>'
    items.append(f'<item><title>{title}</title><link>{link}</link><guid>{link}</guid><description>{desc}</description>{pub}</item>')
rss='<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Adeeb Noor — Research Updates</title><link>https://adeebnoor.github.io/publications.html</link><description>Curated recent research and public scholarly updates by Adeeb Noor.</description><language>en</language>'+''.join(items)+'</channel></rss>'
(ROOT/'research-updates.xml').write_text(rss)
print(f'Built latest-research sections with {len(DATA["items"])} status-labelled items and research-updates.xml.')
