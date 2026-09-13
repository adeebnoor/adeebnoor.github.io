"""Build static Arabic counterparts and consistent, language-aware navigation.

Run after editing English content and its exact-segment translations in i18n/ar.
The existing Arabic homepage is hand-authored; its internal links are localized too.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit, parse_qsl, urlencode, quote
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://adeebnoor.github.io/'
VERSION = '20260913-ideas1'
PAGES = ['index.html','about.html','impact.html','research.html','publications.html',
         'ventures.html','teaching.html','contact.html','academic-cv.html',
         'executive-cv.html','master-cv.html','phd.html','speaking.html',
         'writing/index.html','writing/same-scores-different-decisions.html',
         'healthx/index.html','demo/index.html','404.html','collaborate.html']
IDEAS_FILE = ROOT/'data/ideas-content.json'
IDEAS_CONTENT = json.loads(IDEAS_FILE.read_text()) if IDEAS_FILE.exists() else {}
MANAGED_PAGES = ['ideas/index.html','ideas/position.html','writing/index.html'] + [a['path'].lstrip('/') for a in IDEAS_CONTENT.get('articles', [])]
PAGES = list(dict.fromkeys(PAGES + MANAGED_PAGES))
TRANSLATIONS = {}
for file in (ROOT/'i18n/ar').glob('*.json'):
    TRANSLATIONS.update(json.loads(file.read_text()))

EMAIL_COPY = {
    'Speaking Invitation': 'دعوة لإلقاء محاضرة',
    'Research Inquiry': 'استفسار بحثي',
    'Student Research Inquiry': 'استفسار طالب عن البحث والإشراف',
    'Research Collaboration': 'تعاون بحثي',
    'Advisory Inquiry': 'استفسار عن تعاون استشاري',
    'Partnership Inquiry': 'استفسار عن شراكة',
    'HEALTHx Collaboration or Investment Inquiry': 'استفسار عن التعاون أو الاستثمار في HEALTHx',
    'Hello Professor Noor,\n\nI am interested in HEALTHx regarding: [investment / research / student project / clinical pilot / industry collaboration].\n\nBriefly: ': 'الأستاذ الدكتور أديب نور،\n\nأرغب في التعاون مع HEALTHx في مجال: [الاستثمار / البحث / مشروع طلابي / تجربة سريرية أولية / تعاون مع قطاع الأعمال].\n\nنبذة عن الفكرة: ',
}


def public_path(page, arabic=False):
    path = ('ar/' if arabic else '') + page
    if path.endswith('index.html'):
        path = path[:-10]
    return '/' + path


def local_url(value, source, arabic, navigation=False):
    if arabic and value.startswith('mailto:') and '?' in value:
        address, query = value.split('?', 1)
        return address + '?' + urlencode([(k, EMAIL_COPY.get(v, v)) for k,v in parse_qsl(query)], quote_via=quote)
    if not value or value.startswith(('#','mailto:','tel:','javascript:','data:')):
        return value
    absolute = urlsplit(urljoin(ORIGIN + source, value))
    if absolute.netloc != 'adeebnoor.github.io':
        return value
    path = absolute.path.lstrip('/')
    canonical = path[3:] if path.startswith('ar/') else path
    if not canonical or canonical.endswith('/'):
        canonical += 'index.html'
    if navigation and canonical in PAGES:
        path = public_path(canonical, arabic)
    elif navigation:
        # Separate GitHub project sites are external destinations, not local files.
        return urlunsplit((absolute.scheme, absolute.netloc, absolute.path, absolute.query, absolute.fragment))
    else:
        # Shared static assets stay in the root; project sites outside this repo stay intact.
        path = '/' + path
    if not navigation and arabic and path == '/writing/share.js':
        path = '/ar/writing/share.js'
    return urlunsplit(('', '', path, absolute.query, absolute.fragment))


def remove_header(source):
    source = source.replace('<div class="w" id="main-content">', '<div class="w">')
    source = re.sub(r'<header class="site-header".*?</header>', '', source, flags=re.S)
    source = re.sub(r'<header class="(?:header|top)".*?</header>', '', source, flags=re.S)
    source = re.sub(r'<div class="top">.*?</nav>\s*</div>\s*</div>', '', source, flags=re.S)
    source = re.sub(r'<a class="(?:skip|site-skip)".*?</a>', '', source, flags=re.S)
    # RIDI's old header lives inside its content wrapper.
    source = re.sub(r'(<div class="w">)<header>.*?</header>', r'\1', source, flags=re.S)
    return source


def clean_head(source):
    source = re.sub(r'<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>', '', source)
    source = re.sub(r'<link\b[^>]*href="[^\"]*(?:nav|portfolio|site-nav|arabic)\.css[^\"]*"[^>]*>',
                    lambda m: m[0] if 'portfolio.css' in m[0] else '', source)
    source = re.sub(r'<script\b[^>]*src="[^\"]*(?:nav|portfolio|site-nav)\.js[^\"]*"[^>]*></script>', '', source)
    return source


class Localizer(HTMLParser):
    def __init__(self, source_name, arabic, translations=None):
        super().__init__(convert_charrefs=True)
        self.source_name, self.arabic = source_name, arabic
        self.dictionary = translations or {}
        self.texts = dict(self.dictionary.get('text', {}))
        self.texts.update({'Contact':'تواصل','Contact →':'تواصل ←',
            'Research Translation':'تحويل البحث إلى تطبيق',
            'Research, prototypes and institutional systems, with each project’s stage stated separately':'أبحاث ونماذج أولية وأنظمة مؤسسية، مع بيان مرحلة كل مشروع على حدة',
            'Patient-facing digital platform created within hospital modernization.':'منصة رقمية موجهة للمرضى أُنشئت ضمن تحديث أنظمة المستشفى.'})
        self.attrs = self.dictionary.get('attrs', {})
        self.parts, self.raw, self.missing = [], 0, set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html':
            attrs['lang'] = 'ar' if self.arabic else 'en'
            if self.arabic:
                attrs['dir'] = 'rtl'
        for key, value in list(attrs.items()):
            if value is None:
                continue
            if self.arabic and key in ('alt','title','aria-label','placeholder','content'):
                value = self.attrs.get(value, self.texts.get(value, value))
            if key in ('href','src','poster'):
                value = local_url(value, self.source_name, self.arabic, tag == 'a')
            if key == 'content' and attrs.get('property') == 'og:url':
                english = self.source_name.removeprefix('ar/')
                value = ORIGIN.rstrip('/') + public_path(english, self.arabic)
            attrs[key] = value
        self.parts.append('<' + tag + ''.join(' ' + k + ('' if v is None else '="' + html.escape(v, quote=True) + '"') for k,v in attrs.items()) + '>')
        if tag in ('script','style'):
            self.raw += 1

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.parts[-1] = self.parts[-1][:-1] + '/>'

    def handle_endtag(self, tag):
        self.parts.append(f'</{tag}>')
        if tag in ('script','style'):
            self.raw -= 1

    def handle_data(self, data):
        if self.raw:
            self.parts.append(data)
            return
        key = data.strip()
        if self.arabic and self.dictionary and key:
            if key in self.texts:
                data = data.replace(key, self.texts[key], 1)
            elif re.search(r'[A-Za-z]{3,}', key):
                self.missing.add(key)
        self.parts.append(html.escape(data, quote=False))

    def handle_decl(self, decl):
        self.parts.append('<!' + decl + '>')

    def handle_comment(self, data):
        self.parts.append('<!--' + data + '-->')


def nav(page, arabic):
    identity = json.loads((ROOT/'data/site_identity.json').read_text())
    items = json.loads((ROOT/'data/site-navigation.json').read_text())
    choices = [(item['page'], *(identity[item['identity_label']][lang] if 'identity_label' in item else item[lang] for lang in ('en','ar'))) for item in items]
    selected = page
    if page in ('academic-cv.html','master-cv.html','speaking.html'):
        selected = 'about.html'
    if page == 'executive-cv.html':
        selected = 'impact.html'
    if page in ('phd.html','publications.html','demo/index.html'):
        selected = 'research.html'
    if page == 'healthx/index.html':
        selected = 'ventures.html'
    if page.startswith(('writing/','ideas/')):
        selected = 'ideas/index.html'
    links = ''.join(f'<a href="{public_path(p,arabic)}"'+(' class="site-contact"' if p=='contact.html' else '')+(' aria-current="page"' if selected==p else '')+f'>{ar if arabic else en}</a>' for p,en,ar in choices)
    language = f'<a class="site-language" href="{public_path(page,not arabic)}" lang="{"en" if arabic else "ar"}" hreflang="{"en" if arabic else "ar"}">{"English" if arabic else "العربية"}</a>'
    cvs = ''.join(f'<a href="{public_path(p,arabic)}">{ar if arabic else en}</a>' for p,en,ar in [('executive-cv.html','Executive CV','السيرة التنفيذية'),('academic-cv.html','Academic CV','السيرة الأكاديمية')])
    return f'''<header class="site-header"><div class="site-wrap"><a class="site-brand" href="{public_path('index.html',arabic)}" aria-label="{'أديب نور — الرئيسية' if arabic else 'Adeeb Noor — Home'}">ADEEB NOOR</a><nav class="site-links" aria-label="{'التنقل الرئيسي' if arabic else 'Primary navigation'}">{links}{language}</nav><details class="site-mobile"><summary>{'☰ القائمة' if arabic else '☰ Menu'}</summary><nav aria-label="{'قائمة الجوال' if arabic else 'Mobile navigation'}"><a href="{public_path('index.html',arabic)}">{'الرئيسية' if arabic else 'Home'}</a>{links}{cvs}{language}</nav></details></div></header>'''


def finish(source, page, arabic):
    extras = f'<link rel="canonical" href="{ORIGIN.rstrip("/") + public_path(page,arabic)}">'
    for language, enabled in [('en',False),('ar',True),('x-default',False)]:
        extras += f'<link rel="alternate" hreflang="{language}" href="{ORIGIN.rstrip("/") + public_path(page,enabled)}">'
    extras += f'<link rel="stylesheet" href="/site-nav.css?v={VERSION}"><script defer src="/site-nav.js?v={VERSION}"></script>'
    if arabic:
        extras += f'<link rel="stylesheet" href="/arabic.css?v={VERSION}">'
    source = source.replace('</head>', extras + '</head>')
    if page != 'collaborate.html':
        if '<main' in source:
            main = re.search(r'<main\b([^>]*)>',source)
            target = re.search(r'\bid="([^"]+)"',main[1])
            if target:
                target = target[1]
            else:
                target = 'main-content'
                source = source[:main.start()] + main[0][:-1] + ' id="main-content">' + source[main.end():]
        else:
            # Legacy project/article pages use sections rather than a main element.
            section = re.search(r'<(?:section|article)\b([^>]*)>',source)
            if not section:
                raise ValueError(f'{page}: no content target for skip navigation')
            target = re.search(r'\bid="([^"]+)"',section[1])
            if target:
                target = target[1]
            else:
                target = 'main-content'
                source = source[:section.start()] + section[0][:-1] + ' id="main-content">' + source[section.end():]
        skip=f'<a class="site-skip" href="#{target}">{"انتقل إلى المحتوى" if arabic else "Skip to content"}</a>'
        source = re.sub(r'(<body[^>]*>)', lambda m: m[0]+skip+nav(page,arabic), source, count=1)
    if page == '404.html':
        source = source.replace('body{margin:0;min-height:100vh;display:grid;place-items:center;', 'body{margin:0;min-height:100vh;display:block;')
        source = source.replace('<style>main.wrap{margin:70px auto} .site-header .site-wrap{text-align:start}</style>', '')
        source = source.replace('</head>', '<style>main.wrap{margin:70px auto} .site-header .site-wrap{text-align:start}</style></head>')
    if page == 'healthx/index.html' and arabic:
        # Center Arabic labels within the original SVG boxes without mirroring diagrams.
        source = source.replace('x="84"', 'x="144" text-anchor="middle"').replace('x="416"', 'x="476" text-anchor="middle"')
        source = source.replace('</head>', '<style>svg text{direction:rtl;unicode-bidi:plaintext}svg text:not([text-anchor]){text-anchor:middle}.hero-svg g[font-size="16"] text{font-size:14px}.hero-svg g[font-size="12"] text{font-size:11px}.hero h1{line-height:1.35;letter-spacing:0}</style></head>')
    if page == 'demo/index.html' and arabic:
        source = source.replace('</head>', '<style>.hero h1{line-height:1.4;letter-spacing:0}.slots,.metrics{direction:ltr}.same{font-size:16px} .decision strong{font-size:28px}</style></head>')
    return source


def build():
    from sync_identity import strip_generated
    missing = {}
    # Read all sources first; navigation transformations are idempotent on repeat runs.
    sources = {page:strip_generated((ROOT/page).read_text()) for page in PAGES if page not in MANAGED_PAGES}
    arabic_home = strip_generated((ROOT/'ar/index.html').read_text())
    sources = {page:re.sub(r'<!-- ideas-gateway:start -->.*?<!-- ideas-gateway:end -->','',text,flags=re.S) for page,text in sources.items()}
    sources = {page:re.sub(r'<!-- ideas-project:start -->.*?<!-- ideas-project:end -->','',text,flags=re.S) for page,text in sources.items()}
    arabic_home = re.sub(r'<!-- ideas-gateway:start -->.*?<!-- ideas-gateway:end -->','',arabic_home,flags=re.S)
    for page, original in sources.items():
        clean = clean_head(remove_header(original))
        en = Localizer(page,False)
        en.feed(clean)
        (ROOT/page).write_text(finish(''.join(en.parts),page,False))
        original_ar = clean_head(remove_header(arabic_home)) if page=='index.html' else clean
        dictionary = {} if page=='index.html' else TRANSLATIONS[page]
        ar = Localizer('ar/index.html' if page=='index.html' else page,True,dictionary)
        ar.feed(original_ar)
        translated = ''.join(ar.parts)
        for item in dictionary.get('replacements',[]):
            if item['old'] not in translated:
                raise ValueError(f'{page}: runtime replacement no longer matches: {item["old"]}')
            translated = translated.replace(item['old'],item['new'])
        if page=='collaborate.html':
            translated = translated.replace("location.replace('contact.html'", "location.replace('/ar/contact.html'").replace('url=contact.html','url=/ar/contact.html')
        if ar.missing:
            missing[page] = sorted(ar.missing)
        target = ROOT/'ar'/page
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(finish(translated,page,True))
    js = (ROOT/'writing/share.js').read_text()
    for item in TRANSLATIONS['writing/share.js']['replacements']:
        if item['old'] not in js:
            raise ValueError('Sharing localization no longer matches source')
        js = js.replace(item['old'],item['new'])
    (ROOT/'ar/writing/share.js').write_text(js)
    # Publish both language variants to crawlers.
    entries = []
    for page in PAGES:
        if page in ('404.html','collaborate.html'):
            continue
        for arabic in (False,True):
            links=''.join(f'<xhtml:link rel="alternate" hreflang="{lang}" href="{ORIGIN.rstrip("/")+public_path(page,ar)}"/>' for lang,ar in [('en',False),('ar',True)])
            entries.append(f'<url><loc>{ORIGIN.rstrip("/")+public_path(page,arabic)}</loc>{links}</url>')
    (ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+''.join(entries)+'</urlset>')
    print(f'Localized {len(sources)} existing page pairs; {len(MANAGED_PAGES)} Ideas pages are generated from bilingual content.')
    if missing:
        print('Retained names or terms requiring review:',json.dumps(missing,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    build()
