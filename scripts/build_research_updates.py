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
    title=escape(item['title'])
    summary=escape(item['summary'][lang])
    kind=escape(item['kind'][lang])
    venue=escape(item['venue'])
    date=escape(label_date(item['date'],lang))
    source=escape(item['source'][lang])
    cta='افتح المصدر ←' if ar else 'Open source →'
    if compact:
        return (f'<article class="latest-row"><div class="latest-row-date"><time>{date}</time><span>{kind}</span></div>'
                f'<div class="latest-row-main"><h3>{title}</h3><p>{venue}</p></div>'
                f'<a class="latest-row-link" href="{escape(item["url"],quote=True)}" aria-label="{cta} {title}">↗</a></article>')
    return (f'<article class="latest-card"><div class="latest-meta"><span>{kind}</span><time>{date}</time></div>'
            f'<h3>{title}</h3><p class="latest-venue">{venue}</p><p>{summary}</p>'
            f'<a class="latest-source" href="{escape(item["url"],quote=True)}">{cta} <small>{source}</small></a></article>')

def home_section(lang):
    ar=lang=='ar'
    items=[x for x in DATA['items'] if x.get('featured')][:3]
    kicker='أحدث الأبحاث والظهور' if ar else 'Latest research & mentions'
    heading='ما نُشر عن عملي مؤخرًا.' if ar else 'What was published recently.'
    intro=('أحدث الأعمال البحثية والإشارات العامة الموثقة من الناشرين وقواعد البحث والمصادر العامة. '
           'للمتابعة المستمرة استخدم الروابط أدناه.') if ar else (
           'Recent research and public mentions verified against publisher, scholarly and public records. '
           'Use the follow links below for the live record.')
    all_label='كل الأبحاث والمنشورات ←' if ar else 'All research & publications →'
    pub='/ar/publications.html#latest-research' if ar else '/publications.html#latest-research'
    return START+f'<section class="section latest-updates" id="latest-research"><div class="wrap latest-home"><div class="latest-home-head"><div><div class="label">{kicker}</div><h2>{heading}</h2><p class="latest-intro">{intro}</p></div><a class="latest-all-link" href="{pub}">{all_label}</a></div><div class="latest-list">'+''.join(card(x,lang,True) for x in items)+f'</div>{follow_links(lang)}</div></section>'+END

def publications_section(lang):
    ar=lang=='ar'
    kicker='أحدث الأبحاث والظهور العام' if ar else 'Latest research & public mentions'
    heading='تحديثات موثقة، لا قائمة تلقائية غير مراجعة.' if ar else 'Verified updates, not an unreviewed automated list.'
    intro=('أضيف هنا أحدث الأعمال التي يمكن التحقق منها من الناشر أو قاعدة بحثية عامة. '
           'القائمة الكاملة والاستشهادات تبقى في Google Scholar وORCID.') if ar else (
           'This section surfaces recent work that can be verified at the publisher or a public scholarly record. '
           'Google Scholar and ORCID remain the live source for the complete record.')
    return START+f'<section class="section-intro latest-publications" id="latest-research"><div class="kicker">{kicker}</div><div><h2>{heading}</h2><p>{intro}</p>{follow_links(lang)}</div></section><section class="latest-grid latest-grid-wide">'+''.join(card(x,lang) for x in DATA['items'])+'</section>'+END

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
    desc=escape(item['summary']['en'])
    pub=''
    if re.fullmatch(r'\d{4}-\d{2}-\d{2}',item['date']):
        dt=datetime.fromisoformat(item['date']).replace(tzinfo=timezone.utc)
        pub=f'<pubDate>{format_datetime(dt)}</pubDate>'
    items.append(f'<item><title>{title}</title><link>{link}</link><guid>{link}</guid><description>{desc}</description>{pub}</item>')
rss='<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Adeeb Noor — Research Updates</title><link>https://adeebnoor.github.io/publications.html</link><description>Curated recent research and public scholarly updates by Adeeb Noor.</description><language>en</language>'+''.join(items)+'</channel></rss>'
(ROOT/'research-updates.xml').write_text(rss)
print(f'Built latest-research sections with {len(DATA["items"])} verified items and research-updates.xml.')
