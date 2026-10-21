"""Final design pass: load polish.css everywhere and tune the homepage flow.

Runs last in build_site.py. Every change is marker-delimited and removed before
it is re-applied, so repeated builds converge on identical output.
"""
from pathlib import Path
import hashlib
import json
import re
from html import escape

ROOT = Path(__file__).resolve().parents[1]
SKIP = ('kinetic-hr/', 'SulTaN/')
DESIGN_SKIP = ('healthx/', 'ar/healthx/')
CSS_VERSION = hashlib.sha256((ROOT/'polish.css').read_bytes()).hexdigest()[:10]
THEME_VERSION = hashlib.sha256((ROOT/'theme.css').read_bytes()).hexdigest()[:10]
CSS_BLOCK = re.compile(r'<!-- polish:css:start -->.*?<!-- polish:css:end -->', re.S)
CTA_BLOCK = re.compile(r'<!-- polish:cta:start -->.*?<!-- polish:cta:end -->', re.S)
TESTIMONIALS = json.loads((ROOT/'data'/'testimonials.json').read_text(encoding='utf-8'))
QUOTES_BLOCK = re.compile(r'<!-- polish:testimonials:start -->.*?<!-- polish:testimonials:end -->', re.S)
GATEWAY = re.compile(r'(<!-- ideas-gateway:start -->)(.*?)(<!-- ideas-gateway:end -->)', re.S)
AUDIENCES = re.compile(r'<section class="section" id="collaboration">.*?</section>', re.S)
RESOURCES = re.compile(r'<section class="section partners-section"><div class="wrap">(?:(?!</section>).)*?<nav class="quick".*?</section>', re.S)
VISITORS_BLOCK = re.compile(r'<!-- polish:visitors:start -->.*?<!-- polish:visitors:end -->', re.S)
VISITORS_STYLE_BLOCK = re.compile(r'<!-- polish:visitors-style:start -->.*?<!-- polish:visitors-style:end -->', re.S)
VISITORS_STYLE = ('<!-- polish:visitors-style:start --><style>'
                  '.site-privacy .visitor-count:not([hidden]){display:inline-block;margin-inline:9px;font:inherit;color:inherit}'
                  '.site-privacy .visitor-count:not([hidden])::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#5fbf8a;margin-inline-end:8px;vertical-align:middle}'
                  '</style><!-- polish:visitors-style:end -->')
PRIVACY_END = re.compile(r'</div>(<!-- site-privacy:end -->)')
COUNT_ENDPOINT = 'https://xcirpzxpcpbxpowjbpiq.supabase.co/functions/v1/portfolio-public-count'
JS_VERSION = hashlib.sha256((ROOT/'visitor-count.js').read_bytes()).hexdigest()[:10]
SERVICES = re.compile(r'<!-- site-audit:home-services:start -->.*?<!-- site-audit:home-services:end -->', re.S)

CTA = {
    'en': ('Have a decision that deserves better evidence?',
           'Share the question, the decision it informs and your timeline. We will agree scope after a short first conversation.',
           ('/contact.html#inquiry-form', 'Start a conversation →'), ('/executive-cv.html', 'Executive CV')),
    'ar': ('هل لديك قرار يستحق أدلة أفضل؟',
           'شاركني السؤال والقرار الذي يخدمه والإطار الزمني. نتفق على النطاق بعد محادثة أولى قصيرة.',
           ('/ar/contact.html#inquiry-form', 'ابدأ محادثة ←'), ('/ar/executive-cv.html', 'السيرة التنفيذية')),
}


def cta(lang):
    title, text, primary, secondary = CTA[lang]
    return ('<!-- polish:cta:start --><section class="polish-cta" aria-labelledby="polish-cta-title"><div class="wrap"><div>'
            f'<h2 id="polish-cta-title">{title}</h2><p>{text}</p></div><div class="polish-cta-actions">'
            f'<a class="primary" href="{primary[0]}">{primary[1]}</a><a href="{secondary[0]}">{secondary[1]}</a>'
            '</div></div></section><!-- polish:cta:end -->')


TEXT = {
    'en': {'start': 'Start here', 'paths': 'Find the right way in.', 'who': 'Or start from who you are', 'res': 'Profiles and resources',
           'q_label': 'Recommendations', 'q_title': 'What colleagues say.', 'q_note': 'Public recommendations on LinkedIn. Excerpts are verbatim; omissions are marked “…”.', 'q_more': 'All recommendations on LinkedIn →'},
    'ar': {'start': 'ابدأ من هنا', 'paths': 'اختر مدخلك إلى عملي.', 'who': 'أو ابدأ بحسب صفتك', 'res': 'الملفات والمصادر',
           'q_label': 'توصيات', 'q_title': 'ماذا يقول الزملاء.', 'q_note': 'ترجمة لمقتطفات من توصيات منشورة بالإنجليزية على LinkedIn؛ علامة «…» تشير إلى حذف.', 'q_more': 'كل التوصيات على LinkedIn ←'},
}


def testimonials(lang):
    t = TEXT[lang]
    cards = ''.join(
        f'<figure class="polish-quote"><blockquote><p>{escape(item["quote"][lang])}</p></blockquote>'
        f'<figcaption><span class="polish-avatar" aria-hidden="true">{escape(item["initials"])}</span><span><b>{escape(item["name"])}</b>'
        f'<small>{escape(item["title"][lang])}</small><small>{escape(item["relation"][lang])}</small></span></figcaption></figure>'
        for item in TESTIMONIALS['items'])
    return ('<!-- polish:testimonials:start --><section class="section polish-quotes" id="recommendations" aria-labelledby="recommendations-title"><div class="wrap">'
            f'<div class="section-heading"><div><div class="label">{t["q_label"]}</div><h2 id="recommendations-title">{t["q_title"]}</h2></div>'
            f'<a href="{TESTIMONIALS["source"]}">{t["q_more"]}</a></div><div class="polish-quote-grid" role="region" tabindex="0" aria-label="{t["q_label"]}">{cards}</div>'
            f'<p class="polish-quote-note">{t["q_note"]}</p></div></section><!-- polish:testimonials:end -->')


MERGED = '<!-- polish:audiences-merged -->'
AUDIENCE_DATA = json.loads((ROOT/'data'/'homepage-audiences.json').read_text(encoding='utf-8'))
RESOURCE_LINKS = [
    ('/academic-cv.html', 'Academic CV', 'السيرة الأكاديمية'),
    ('/publications.html', 'Publications & profiles', 'المنشورات العلمية'),
    ('https://scholar.google.com/citations?user=XUQD1WAAAAAJ&hl=en', 'Google Scholar', 'Google Scholar'),
    ('https://cemse.kaust.edu.sa/profiles/adeeb-noor', 'KAUST profile', 'ملف KAUST'),
    ('/phd.html', 'Doctoral research', 'بحث الدكتوراه'),
    ('/writing/', 'Essays', 'المقالات'),
]


def merge_gateway(source, lang):
    # One "start here" section replaces three overlapping ones: the two paths,
    # the audience cards (condensed, from data/homepage-audiences.json) and the
    # profile/resource links.
    t, ar = TEXT[lang], lang == 'ar'
    prefix, arrow = ('/ar', '←') if ar else ('', '→')
    # Leave a marker where the audience section was so build_homepage_positioning.py knows it was folded in.
    source = AUDIENCES.sub(MERGED, source, count=1)
    source = RESOURCES.sub('', source, count=1)
    gateway = GATEWAY.search(source)
    if not gateway:
        return source
    cards = ''.join(
        f'<article class="partner polish-aud"><h3><a href="{prefix+item["evidenceUrl"]}">{escape(item[lang]["name"])}</a></h3>'
        f'<div class="partner-promise">{escape(item[lang]["promise"])}</div>'
        f'<a class="partner-cta" href="{prefix}/contact.html#{item["contact"]}">{escape(item[lang]["cta"])} {arrow}</a></article>'
        for item in AUDIENCE_DATA)
    links = ''.join(f'<a href="{escape((prefix + href) if href.startswith("/") else href, quote=True)}">{escape(ar_label if ar else en_label)}</a>'
                    for href, en_label, ar_label in RESOURCE_LINKS)
    body = re.sub(r'<h2>[^<]*</h2>', f'<div class="label">{t["start"]}</div><h2>{t["paths"]}</h2>', gateway[2], count=1)
    extra = (f'<h3 class="polish-sub">{t["who"]}</h3><div class="partners polish-aud-grid">{cards}</div>'
             f'<nav class="polish-resources" aria-label="{t["res"]}">{links}</nav>')
    body = body[:body.rindex('</div></section>')] + extra + '</div></section>'
    return GATEWAY.sub(lambda m: m[1] + body + m[3], source, count=1)


LINKEDIN = json.loads((ROOT/'data'/'linkedin-posts.json').read_text(encoding='utf-8'))
LINKEDIN_BLOCK = re.compile(r'<!-- polish:linkedin:start -->.*?<!-- polish:linkedin:end -->', re.S)
MONTHS = {'en': ['January','February','March','April','May','June','July','August','September','October','November','December'],
          'ar': ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']}


def excerpt(text, limit=240):
    text = ' '.join(text.split())
    return text if len(text) <= limit else text[:limit].rsplit(' ', 1)[0] + '…'


def linkedin(lang):
    posts = LINKEDIN['posts'][:3]
    if not posts:
        return ''
    ar = lang == 'ar'
    cards = ''
    for post in posts:
        y, m, d = (int(x) for x in post['date'].split('-'))
        date = f'{d} {MONTHS[lang][m-1]} {y}'
        direction = 'rtl' if post.get('lang') == 'ar' else 'ltr'
        cards += (f'<article class="t-post"><time datetime="{post["date"]}">{date}</time>'
                  f'<p lang="{escape(post.get("lang","en"))}" dir="{direction}">{escape(excerpt(post["text"]))}</p>'
                  f'<a href="{escape(post["url"], quote=True)}" target="_blank" rel="noopener noreferrer" data-analytics-ignore>'
                  f'{"اقرأ على LinkedIn" if ar else "Read on LinkedIn"} <span aria-hidden="true">↗</span></a></article>')
    head = ('<div class="section-heading"><div><div class="label">' + ('من LinkedIn' if ar else 'From LinkedIn') + '</div><h2>'
            + ('آخر ما كتبت.' if ar else 'Latest writing and updates.') + '</h2></div><a href="' + LINKEDIN['profile'] + '">'
            + ('تابعني على LinkedIn ←' if ar else 'Follow on LinkedIn →') + '</a></div>')
    return ('<!-- polish:linkedin:start --><section class="section t-linkedin" id="linkedin" aria-label="LinkedIn"><div class="wrap">'
            + head + '<div class="t-post-grid">' + cards + '</div></div></section><!-- polish:linkedin:end -->')


DOTS_BLOCK = re.compile(r'<!-- polish:dots:start -->.*?<!-- polish:dots:end -->', re.S)


def dots():
    # Original decorative motif: one continuous path with accent dots (green, lilac, sand).
    path = 'M0 70 C80 10 140 130 220 70 S360 10 440 70 S580 130 660 70 S800 10 880 70 S1020 130 1100 70 S1180 30 1220 60'
    marks = [(40, 44, '#005a36', 9), (180, 98, '#c88cff', 11), (300, 40, '#e2d1bf', 8), (420, 66, '#005a36', 7), (520, 104, '#c88cff', 9),
             (640, 66, '#e2d1bf', 11), (760, 34, '#005a36', 9), (880, 70, '#c88cff', 7), (1000, 104, '#e2d1bf', 9), (1120, 66, '#005a36', 11)]
    circles = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y, c, r in marks)
    return ('<!-- polish:dots:start --><div class="wrap" aria-hidden="true"><svg class="t-dots" viewBox="0 0 1220 140" focusable="false">'
            f'<path d="{path}" fill="none" stroke="#141414" stroke-width="1" opacity=".35"/>{circles}</svg></div><!-- polish:dots:end -->')


def polish_home(source, lang):
    source = CTA_BLOCK.sub('', source)
    source = DOTS_BLOCK.sub('', source)
    source = LINKEDIN_BLOCK.sub('', source)
    stats = re.search(r'<section class="stats".*?</section>', source, re.S)
    feed = linkedin(lang)
    if stats and feed:
        # News first: the latest LinkedIn posts follow the hero and key numbers.
        source = source[:stats.end()] + feed + source[stats.end():]
    hero = re.search(r'<section class="hero">.*?</section>', source, re.S)
    if hero:
        source = source[:hero.end()] + dots() + source[hero.end():]
    source = QUOTES_BLOCK.sub('', source)
    source = merge_gateway(source, lang)
    leadership = re.search(r'<section class="section partners-section" id="leadership">.*?</section>', source, re.S)
    if leadership:
        source = source[:leadership.end()] + testimonials(lang) + source[leadership.end():]
    services = SERVICES.search(source)
    anchor = '<!-- expertise-map:end -->'
    if services and anchor in source:
        # Lead with how to engage, right after the four capabilities.
        source = source[:services.start()] + source[services.end():]
        source = source.replace(anchor, anchor + services[0], 1)
    source = source.replace('</main>', cta(lang) + '</main>', 1)
    # The hero portrait is the largest above-the-fold image: fetch it first.
    source = re.sub(r'<link rel="preload" as="image" href="/assets/portfolio-art.webp"[^>]*>', '', source)
    return source.replace('</head>', '<link rel="preload" as="image" href="/assets/portfolio-art.webp" fetchpriority="high"></head>', 1)


changed = 0
for path in sorted(ROOT.rglob('*.html')):
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith(SKIP) or rel.startswith('.git/'):
        continue
    original = path.read_text(encoding='utf-8')
    if 'site-nav.css' not in original or '</head>' not in original:
        continue
    source = VISITORS_STYLE_BLOCK.sub('', original)
    if rel.startswith(DESIGN_SKIP):
        # HEALTHx retains its own design; only the new footer count is styled.
        source = source.replace('</head>', VISITORS_STYLE + '</head>', 1)
    else:
        source = CSS_BLOCK.sub('', source)
        source = source.replace('</head>', f'<!-- polish:css:start --><link rel="stylesheet" href="/polish.css?v={CSS_VERSION}"><link rel="stylesheet" href="/theme.css?v={THEME_VERSION}"><!-- polish:css:end --></head>', 1)
    # Aggregate visitor count beside the privacy link (hidden until the public endpoint answers).
    source = VISITORS_BLOCK.sub('', source)
    source = PRIVACY_END.sub(lambda m: '<!-- polish:visitors:start --><span class="visitor-count" data-visitor-count data-endpoint="' + COUNT_ENDPOINT
                             + '" hidden></span><script defer src="/visitor-count.js?v=' + JS_VERSION + '"></script><!-- polish:visitors:end --></div>' + m[1], source, count=1)
    if rel in ('index.html', 'ar/index.html'):
        source = polish_home(source, 'ar' if rel.startswith('ar/') else 'en')
    if source != original:
        path.write_text(source, encoding='utf-8')
        changed += 1
print(f'Applied design polish to {changed} pages.')
