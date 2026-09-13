"""Render the Ideas hub, permanent position and real essay archive in EN/AR.

Content lives in one bilingual JSON file. Existing essay URLs are preserved.
No fabricated historical cadence, subscriber service or social account is used.
"""
from pathlib import Path
from html import escape
import json
import re
from localize_site import finish

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT/'data/ideas-content.json').read_text())
IDENTITY = json.loads((ROOT/'data/site_identity.json').read_text())
ORIGIN = 'https://adeebnoor.github.io'
EDITION = {'en': '13 September 2026', 'ar': '١٣ سبتمبر ٢٠٢٦'}


def t(value, lang):
    return escape(value[lang])


def url(path, lang):
    if not path.startswith('/') or path.startswith('//'):
        return path
    return ('/ar' if lang == 'ar' else '') + path


def link(path, label, lang, cls='ideas-link'):
    return f'<a class="{cls}" href="{escape(url(path,lang),quote=True)}">{escape(label)}</a>'


def subnav(lang):
    labels = [('My position','موقفي','/ideas/position.html'),
              ('Essays','المقالات','/writing/'),
              ('Ideas in practice','الأفكار قيد الاختبار','/ideas/#evidence')]
    return '<nav class="ideas-subnav" aria-label="'+('داخل قسم الأفكار' if lang=='ar' else 'Within Ideas')+'">'+''.join(link(path,ar if lang=='ar' else en,lang,'') for en,ar,path in labels)+'</nav>'


def page(path, title, description, body, lang):
    label = 'أديب نور' if lang == 'ar' else 'Adeeb Noor'
    canonical = ORIGIN + url('/'+path.removesuffix('index.html') if path.endswith('index.html') else '/'+path,lang)
    footer = '<footer class="ideas-footer"><div class="ideas-wrap"><span>© 2026 '+label+'</span><nav aria-label="'+('روابط ختامية' if lang=='ar' else 'Footer')+'">'+''.join([
        link('/ideas/','الأفكار' if lang=='ar' else 'Ideas',lang,''),
        link('/impact.html','القيادة والأثر' if lang=='ar' else 'Executive',lang,''),
        link('/contact.html',IDENTITY['contact_label'][lang],lang,'')])+'</nav></div></footer>'
    html = '<!doctype html><html lang="'+lang+'"'+(' dir="rtl"' if lang=='ar' else '')+'><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    html += f'<title>{escape(title)} — {label}</title><meta name="description" content="{escape(description,quote=True)}"><meta property="og:type" content="website"><meta property="og:title" content="{escape(title,quote=True)}"><meta property="og:description" content="{escape(description,quote=True)}"><meta property="og:url" content="{canonical}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/ideas.css?v=20260913-ideas1"></head><body>{body}{footer}</body></html>'
    # Preserve the existing article's social artwork; new pages need no new asset.
    if path == 'writing/same-scores-different-decisions.html':
        html = html.replace('</head>','<meta property="og:image" content="https://adeebnoor.github.io/assets/portfolio-art.webp"><meta name="twitter:card" content="summary_large_image"></head>')
    target = ROOT / (('ar/' if lang=='ar' else '') + path)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(finish(html,path,lang=='ar'))


def cards(lang):
    rows = []
    for article in DATA['articles']:
        rows.append('<article class="idea-card"><div class="idea-meta">'+t(article['theme'],lang)+'</div><h3>'+link(article['path'],article['title'][lang],lang,'')+'</h3><p>'+t(article['standfirst'],lang)+'</p>'+link(article['path'],'اقرأ المقال ←' if lang=='ar' else 'Read the essay →',lang)+'</article>')
    return '<div class="ideas-grid">'+''.join(rows)+'</div>'


def hero(title, description, lang):
    return '<section class="ideas-hero"><div class="ideas-wrap"><div class="ideas-kicker">'+('أفكار ومواقف · أديب نور' if lang=='ar' else 'Ideas & positions · Adeeb Noor')+'</div><h1>'+escape(title)+'</h1><p>'+escape(description)+'</p>'+subnav(lang)+'</div></section>'


def evidence_case(lang):
    case = DATA['evidenceBridge']
    return '<section class="ideas-section" id="evidence"><div class="ideas-case"><div><div class="ideas-kicker">'+('من الموقف إلى الاختبار' if lang=='ar' else 'From position to examination')+'</div><h2>'+t(case['title'],lang)+'</h2>'+''.join(link(x['path'],x['label'][lang],lang) for x in case['links'])+'</div><div><p>'+t(case['body'],lang)+'</p>'+link('/ventures.html','تنفيذ الأفكار ومراحل المشاريع ←' if lang=='ar' else 'Implementation & project stages →',lang)+'</div></div></section>'


def imam_position(lang):
    position = DATA['imamPosition']
    return '<section class="ideas-section" id="imam"><div class="ideas-kicker">'+('الهوية والسيادة في سياق التعليم' if lang=='ar' else 'Identity & sovereignty in education')+'</div><h2>'+t(position['title'],lang)+'</h2><p>'+t(position['body'],lang)+'</p>'+link('/ideas/readiness-needs-evidence.html','اقرأ الموقف التعليمي كاملًا ←' if lang=='ar' else 'Read the education argument →',lang)+'<br>'+link('/ventures.html#imam','IMAM: مسار التنفيذ والتطوير ←' if lang=='ar' else 'IMAM: implementation & development →',lang)+'</section>'


def render(lang):
    copy = DATA['pageCopy']
    archive = DATA['archive']
    body = hero(copy['title'][lang],DATA['intro'][lang],lang)
    body += '<main class="ideas-wrap" id="main-content"><section class="ideas-section ideas-pinned"><div><div class="ideas-kicker">'+('صفحة ثابتة · موقفي' if lang=='ar' else 'Permanent page · My position')+'</div><h2>'+link('/ideas/position.html',copy['stanceTitle'][lang],lang,'')+'</h2><p>'+t(copy['body'],lang)+'</p>'+link('/ideas/position.html','اقرأ موقفي الفكري ←' if lang=='ar' else 'Read my position →',lang)+'</div><aside><p>'+t(copy['stanceIntro'],lang)+'</p></aside></section>'
    body += '<section class="ideas-section" id="essays"><div class="ideas-kicker">'+('أرشيف المقالات' if lang=='ar' else 'Essay archive')+'</div><h2>'+t(archive['title'],lang)+'</h2><p>'+t(archive['intro'],lang)+'</p>'+cards(lang)+'</section>'
    body += evidence_case(lang)+imam_position(lang)+'<section class="ideas-section"><h2>'+t(archive['cadenceTitle'],lang)+'</h2><p class="ideas-cadence">'+t(DATA['cadence'],lang)+'</p></section></main>'
    page('ideas/index.html',copy['title'][lang],DATA['intro'][lang],body,lang)

    position = hero(copy['stanceTitle'][lang],copy['stanceIntro'][lang],lang)
    position += '<main class="ideas-wrap" id="main-content"><section class="ideas-section"><div class="ideas-theses">'
    for thesis in DATA['theses']:
        article = next(a for a in DATA['articles'] if a['slug']==thesis['essaySlug'])
        position += '<article class="idea-thesis" id="'+thesis['id']+'"><h2>'+t(thesis['title'],lang)+'</h2><p>'+t(thesis['body'],lang)+'</p>'+link(thesis['evidencePath'],thesis['evidenceLabel'][lang],lang)+'<br>'+link(article['path'],'اقرأ الحجة كاملة ←' if lang=='ar' else 'Read the full argument →',lang)+'</article>'
    position += '</div></section>'+imam_position(lang)+evidence_case(lang)+'</main>'
    page('ideas/position.html',copy['stanceTitle'][lang],copy['stanceIntro'][lang],position,lang)

    archive_body = hero(archive['title'][lang],archive['intro'][lang],lang)
    archive_body += '<main class="ideas-wrap" id="main-content"><section class="ideas-section">'+cards(lang)+'</section><section class="ideas-section"><h2>'+t(archive['cadenceTitle'],lang)+'</h2><p class="ideas-cadence">'+t(DATA['cadence'],lang)+'</p></section></main>'
    page('writing/index.html',archive['title'][lang],archive['intro'][lang],archive_body,lang)

    for article in DATA['articles']:
        label = 'أديب نور · مقال رأي · نسخة ' if lang=='ar' else 'Adeeb Noor · Perspective · Edition of '
        body = '<main class="ideas-article" id="main-content">'+link('/writing/','← أرشيف المقالات' if lang=='ar' else '← Essay archive',lang)+'<article><div class="ideas-kicker">'+t(article['theme'],lang)+'</div><h1>'+t(article['title'],lang)+'</h1><p class="idea-standfirst">'+t(article['standfirst'],lang)+'</p><div class="idea-byline">'+label+'<time datetime="2026-09-13">'+EDITION[lang]+'</time></div><div class="article-body">'
        for section in article['sections']:
            body += '<section><h2>'+t(section['heading'],lang)+'</h2>'+''.join('<p>'+escape(p)+'</p>' for p in section['paragraphs'][lang])+'</section>'
        body += '</div><aside class="ideas-evidence"><h2>'+('عمل مرتبط بالحجة' if lang=='ar' else 'Work connected to the argument')+'</h2><ul>'+''.join('<li>'+link(x['path'],x['label'][lang],lang,'')+'</li>' for x in article['evidence'])+'</ul></aside><nav class="ideas-related" aria-label="'+('متابعة القراءة' if lang=='ar' else 'Continue reading')+'">'+link('/ideas/position.html','ارجع إلى الموقف الفكري ←' if lang=='ar' else 'Return to my position →',lang)+'<br>'+link('/writing/','تصفّح المقالات الأربعة ←' if lang=='ar' else 'Browse all four essays →',lang)+'</nav></article></main>'
        page(article['path'].lstrip('/'),article['title'][lang],article['standfirst'][lang],body,lang)


def homepage_gateway(lang):
    ar = lang == 'ar'
    items = [
        ('القيادة والتنفيذ' if ar else 'Executive / Builder',
         'كيف أحوّل الاستراتيجية إلى عمل؟' if ar else 'How I turn strategy into practice.',
         'استعرض خبرتي في الحكومة والصحة والتعليم، ومراحل المشاريع، والسجل التنفيذي الذي يوضح نطاق مسؤوليتي.' if ar else 'Explore my work across government, healthcare and education, the stages of my projects and the scope of my executive responsibilities.',
         '/impact.html','القيادة والأثر ←' if ar else 'Executive work →'),
        ('الأفكار والمواقف' if ar else 'Thinker / Ideas',
         'ما الذي تخفيه المقاييس؟' if ar else 'What do the metrics leave out?',
         'أعتقد أن قيمة النظام تظهر في القرارات التي يغيّرها والأشخاص الذين تمسّهم. أعرض هنا حججي وما أستند إليه وما يمكن أن يغيّر رأيي.' if ar else 'I believe the value of a system lies in the decisions it changes and the people it affects. Here I set out my arguments, their evidence and what could change my mind.',
         '/ideas/','استكشف الأفكار ←' if ar else 'Explore my ideas →')]
    body = '<!-- ideas-gateway:start --><section class="section" id="work-and-ideas"><div class="wrap"><h2>'+('مساران للتعرّف على عملي' if ar else 'Two ways into my work.')+'</h2><div class="identity-paths">'
    for kicker,heading,description,path,label in items:
        body += '<article class="identity-path"><div class="label">'+escape(kicker)+'</div><h3>'+escape(heading)+'</h3><p>'+escape(description)+'</p><a href="'+url(path,lang)+'">'+escape(label)+'</a></article>'
    body += '</div></div></section><!-- ideas-gateway:end -->'
    target = ROOT/('ar/index.html' if ar else 'index.html')
    source = re.sub(r'<!-- ideas-gateway:start -->.*?<!-- ideas-gateway:end -->','',target.read_text(),flags=re.S)
    marker = '<section class="section" id="projects">'
    if source.count(marker) != 1:
        raise ValueError('Expected one homepage projects section')
    source = source.replace(marker,body+marker)
    source = re.sub(r'portfolio\.css\?v=[^"\s]+','portfolio.css?v=20260913-ideas1',source)
    target.write_text(source)


def project_bridge(lang):
    ar = lang == 'ar'
    name = 'ventures.html'
    target = ROOT/(('ar/' if ar else '')+name)
    source = re.sub(r'<!-- ideas-project:start -->.*?<!-- ideas-project:end -->','',target.read_text(),flags=re.S)
    description = ('منظومة تعلّم سعودية بالذكاء الاصطناعي التوليدي تربط الهوية المحلية وتصميم المناهج والجاهزية. يصف سجلي المهني دوري كمؤسس ومعماري رئيسي، مع مسار للتجريب والتطوير التجاري. أعرضها هنا كعمل قيد التطوير، دون ادعاء انتشار تجاري أو أثر تعليمي مثبت.' if ar else
        'A Saudi GenAI learning ecosystem connecting local identity, curriculum design and readiness. My professional record describes my role as founder and lead architect, with a pilot and commercialization pathway. I present it here as work in development, without claiming commercial adoption or demonstrated learning gains.')
    card = '<!-- ideas-project:start --><article class="venture-card" id="imam"><div class="venture-mark"><div class="vtype">'+('التعليم والذكاء الاصطناعي التوليدي' if ar else 'Education & generative AI')+'</div><h2>IMAM GenAI</h2></div><div class="venture-body"><div class="mini">'+('مسار تطوير وتجريب' if ar else 'Development & pilot pathway')+'</div><h3>'+('من الهوية المحلية إلى تصميم التعلّم' if ar else 'From local identity to learning design')+'</h3><p>'+description+'</p><p>'+link('/ideas/position.html#imam','الموقف الفكري: مَن يملك قرار التعلّم؟ ←' if ar else 'The position: who owns the purpose of learning? →',lang,'')+'</p><p>'+link('/executive-cv.html','دوري في السجل المهني ←' if ar else 'My role in the professional record →',lang,'')+' · '+link('/teaching.html#philosophy','السياق التعليمي ←' if ar else 'Educational context →',lang,'')+'</p></div></article><!-- ideas-project:end -->'
    marker = '<section class="venture-stack">'
    if source.count(marker) != 1:
        raise ValueError('Expected the venture stack in '+str(target))
    target.write_text(source.replace(marker,marker+card))


if __name__ == '__main__':
    for language in ('en','ar'):
        render(language)
        homepage_gateway(language)
        project_bridge(language)
    print('Built Ideas, a permanent position, a four-essay archive and paired homepage entries in both languages.')
