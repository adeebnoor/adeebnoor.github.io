"""Apply the public thought-leadership/SEO layer after all other site generators.

This keeps the generated Arabic pages deterministic while moving the homepage from
an execution-first portfolio to the site's recurring thesis: What the Score Hides.
"""
from pathlib import Path
from html import escape
import json
import re

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://adeebnoor.github.io'
TODAY = '2026-09-22'
PROFILE_BLOCK = re.compile(r'<!-- site-audit:person:start -->.*?<!-- site-audit:person:end -->', re.S)
STYLE_BLOCK = re.compile(r'<!-- thought-leadership:style:start -->.*?<!-- thought-leadership:style:end -->', re.S)


def put_meta(source, attr, key, value):
    pattern = re.compile(r'<meta\b([^>]*\b'+re.escape(attr)+r'="'+re.escape(key)+r'"[^>]*)>', re.I)
    def repl(match):
        tag = match.group(0)
        if re.search(r'\bcontent="[^"]*"', tag):
            return re.sub(r'\bcontent="[^"]*"', 'content="'+escape(value, quote=True)+'"', tag, count=1)
        return tag[:-1]+' content="'+escape(value, quote=True)+'">'
    source, count = pattern.subn(repl, source, count=1)
    if not count:
        source = source.replace('</head>', '<meta '+attr+'="'+escape(key,quote=True)+'" content="'+escape(value,quote=True)+'"></head>', 1)
    return source


def put_title(source, title):
    title_html = '<title>'+escape(title)+'</title>'
    if re.search(r'<title>.*?</title>', source, flags=re.S|re.I):
        return re.sub(r'<title>.*?</title>', title_html, source, count=1, flags=re.S|re.I)
    return source.replace('</head>', title_html+'</head>', 1)


def profile_schema(lang):
    ar = lang == 'ar'
    person = {
        '@type': 'Person',
        '@id': ORIGIN+'/#person',
        'name': 'أديب نور' if ar else 'Adeeb Noor',
        'alternateName': ['Adeeb Noor','د. أديب نور','Dr. Adeeb Noor','B. Adeeb Noor'] if ar else ['أديب نور','د. أديب نور','Dr. Adeeb Noor','B. Adeeb Noor'],
        'honorificPrefix': 'Prof.',
        'jobTitle': 'Professor of Data Science and Artificial Intelligence',
        'description': ('أستاذ سعودي يدرس ما يحدث عندما تتحول الدرجة إلى قرار يمس الناس في الذكاء الاصطناعي والصحة والتعليم والمؤسسات العامة.' if ar else 'Saudi professor studying what happens when a score becomes a decision about people — in AI, healthcare, education and public institutions.'),
        'url': ORIGIN+'/',
        'email': 'mailto:arnoor@kau.edu.sa',
        'nationality': {'@type':'Country','name':'Saudi Arabia'},
        'worksFor': {'@type':'CollegeOrUniversity','name':'King Abdulaziz University','url':'https://www.kau.edu.sa/'},
        'alumniOf': [
            {'@type':'CollegeOrUniversity','name':'University of Colorado Boulder'},
            {'@type':'CollegeOrUniversity','name':'Taibah University'}
        ],
        'knowsAbout': ['Decision intelligence','AI evaluation','AI ethics','Responsible AI','Biomedical informatics','Drug–drug interactions','Digital health','AI in education','Workforce planning','Research governance'],
        'sameAs': [
            'https://www.linkedin.com/in/adeeb-noor',
            'https://scholar.google.com/citations?user=XUQD1WAAAAAJ',
            'https://orcid.org/0000-0002-8251-1853',
            'https://www.researchgate.net/profile/Adeeb-Noor-2',
            'https://cemse.kaust.edu.sa/profiles/adeeb-noor',
            'https://github.com/adeebnoor',
            'https://x.com/AdeebnooR'
        ]
    }
    portrait = ROOT/'assets/adeeb-noor.jpg'
    if portrait.exists():
        person['image'] = ORIGIN+'/assets/adeeb-noor.jpg'
    data = {
        '@context':'https://schema.org',
        '@type':'ProfilePage',
        '@id': ORIGIN+('/ar/' if ar else '/')+'#profile',
        'url': ORIGIN+('/ar/' if ar else '/'),
        'inLanguage': lang,
        'dateModified': TODAY,
        'mainEntity': person,
    }
    return '<!-- site-audit:person:start --><script type="application/ld+json">'+json.dumps(data, ensure_ascii=False, separators=(',',':')).replace('<','\\u003c')+'</script><!-- site-audit:person:end -->'


def home_gateway(lang):
    ar = lang == 'ar'
    if ar:
        return '<!-- ideas-gateway:start --><section class="section" id="work-and-ideas"><div class="wrap"><h2>مساران للتعرّف على عملي</h2><div class="identity-paths"><article class="identity-path identity-path-primary"><div class="label">الأفكار والمواقف</div><h3>ما يخفيه الرقم</h3><p>الرقم ليس قرارًا. أبحث ما يحدث عندما تتحول الدرجة إلى قرار يمس الناس، وما الدليل الذي يجعل ذلك القرار قابلًا للمساءلة.</p><a href="/ar/ideas/position.html">اقرأ أطروحتي ←</a></article><article class="identity-path"><div class="label">القيادة والتنفيذ</div><h3>كيف أطبّق هذه الأسئلة في المؤسسات؟</h3><p>استعرض كيف تتحول أسئلة القرار والدليل والمساءلة إلى عمل في الحكومة والصحة والتعليم والبحث والابتكار.</p><a href="/ar/impact.html">القيادة والأثر ←</a></article></div></div></section><!-- ideas-gateway:end -->'
    return '<!-- ideas-gateway:start --><section class="section" id="work-and-ideas"><div class="wrap"><h2>Two ways into my work.</h2><div class="identity-paths"><article class="identity-path identity-path-primary"><div class="label">Ideas &amp; positions</div><h3>What the Score Hides</h3><p>A score is not a decision. I study what happens when a score becomes a decision about people, and what evidence makes that decision accountable.</p><a href="/ideas/position.html">Read my position →</a></article><article class="identity-path"><div class="label">Leadership &amp; implementation</div><h3>How I apply these questions in institutions.</h3><p>Explore how questions about decisions, evidence and accountability become practical work across government, healthcare, education, research and innovation.</p><a href="/impact.html">Executive work →</a></article></div></div></section><!-- ideas-gateway:end -->'


def home_copy(lang):
    ar = lang == 'ar'
    if ar:
        return ('<div class="hero-copy"><div class="eyebrow">ما يخفيه الرقم</div><h1><span>أديب</span> نور</h1>'
                '<p class="role">أستاذ علوم البيانات والذكاء الاصطناعي، جامعة الملك عبدالعزيز</p>'
                '<p class="intro">الرقم ليس قرارًا. أدرس ما يحدث حين تتحول الدرجة إلى قرار يمسّ الناس، في الذكاء الاصطناعي والصحة والتعليم والمؤسسات العامة، وأبني أدوات تجعل هذا القرار قابلًا للمساءلة.</p>'
                '<p class="location">جامعة الملك عبدالعزيز · جدة، المملكة العربية السعودية</p>'
                '<div class="actions"><a class="button primary" href="/ar/ideas/position.html">اقرأ أطروحتي ←</a><a class="button" href="/ar/contact.html#inquiry-form">اعمل معي ←</a></div>'
                '<p class="hero-cv-links"><a href="/ar/executive-cv.html">السيرة التنفيذية</a><span aria-hidden="true"> · </span><a href="/ar/academic-cv.html">السيرة الأكاديمية</a></p><p class="hero-trust-links"><a href="https://scholar.google.com/citations?user=XUQD1WAAAAAJ&hl=en">Google Scholar</a><span>·</span><a href="https://orcid.org/0000-0002-8251-1853">ORCID</a><span>·</span><a href="https://www.linkedin.com/in/adeeb-noor">LinkedIn</a><span>·</span><a href="https://github.com/adeebnoor">GitHub</a></p></div>')
    return ('<div class="hero-copy"><div class="eyebrow">What the Score Hides</div><h1><span>Adeeb</span> Noor</h1>'
            '<p class="role">Professor of Data Science &amp; AI, King Abdulaziz University</p>'
            '<p class="intro">A score is not a decision. I study what happens when a score becomes a decision about people — in AI, healthcare, education and public institutions — and build tools that make that decision accountable.</p>'
            '<p class="location">King Abdulaziz University · Jeddah, Saudi Arabia</p>'
            '<div class="actions"><a class="button primary" href="/ideas/position.html">Read my position →</a><a class="button" href="/contact.html#inquiry-form">Work with me →</a></div>'
            '<p class="hero-cv-links"><a href="/executive-cv.html">Executive CV</a><span aria-hidden="true"> · </span><a href="/academic-cv.html">Academic CV</a></p><p class="hero-trust-links"><a href="https://scholar.google.com/citations?user=XUQD1WAAAAAJ&hl=en">Google Scholar</a><span>·</span><a href="https://orcid.org/0000-0002-8251-1853">ORCID</a><span>·</span><a href="https://www.linkedin.com/in/adeeb-noor">LinkedIn</a><span>·</span><a href="https://github.com/adeebnoor">GitHub</a></p></div>')


def card(lang):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return None
    ar = lang == 'ar'
    image = Image.new('RGB', (1200,630), '#0a151a')
    draw = ImageDraw.Draw(image)
    draw.rectangle((72,72,82,558), fill='#c9a35a')
    candidates = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf']
    regulars = ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf']
    def font(paths,size):
        for p in paths:
            if Path(p).exists(): return ImageFont.truetype(p,size=size)
        return ImageFont.load_default()
    f_small, f_title, f_name, f_body = font(regulars,26), font(candidates,62), font(candidates,34), font(regulars,30)
    if ar:
        items=[('أديب نور',f_name,132),('ما يخفيه الرقم',f_title,210),('الرقم ليس قرارًا.',f_body,330),('الذكاء الاصطناعي · الصحة · التعليم · المؤسسات العامة',f_small,404),('adeebnoor.github.io',f_small,520)]
        for text,f,y in items:
            try: draw.text((1110,y),text,font=f,fill='white' if y!=404 else '#d8dee2',anchor='ra',direction='rtl',language='ar')
            except Exception: draw.text((1100,y),text,font=f,fill='white' if y!=404 else '#d8dee2',anchor='ra')
    else:
        draw.text((126,132),'ADEEB NOOR',font=f_name,fill='white')
        draw.text((126,210),'What the Score Hides',font=f_title,fill='white')
        draw.text((126,330),'A score is not a decision.',font=f_body,fill='white')
        draw.text((126,404),'AI · healthcare · education · public institutions',font=f_small,fill='#d8dee2')
        draw.text((126,520),'adeebnoor.github.io',font=f_small,fill='#d8dee2')
    out = ROOT/'assets'/('adeeb-noor-card-ar.jpg' if ar else 'adeeb-noor-card-en.jpg')
    image.save(out, format='JPEG', quality=92, optimize=False, progressive=False)
    return ORIGIN+'/assets/'+out.name


def apply_home(path, lang, image_url):
    source = path.read_text()
    source = STYLE_BLOCK.sub('', source)
    hero = home_copy(lang)
    source, count = re.subn(r'<div class="hero-copy">.*?</div><div class="portrait">', hero+'<div class="portrait">', source, count=1, flags=re.S)
    if count != 1:
        raise ValueError(f'{path}: homepage hero target missing')
    home_stats = ('<section class="stats" aria-label="الأرقام الرئيسية"><div class="wrap stat-grid">'
        '<div class="stat"><b>أكثر من 18 عامًا</b><p>خبرة تراكمية عبر الجامعة والحكومة والصحة والاستشارات</p><a href="/ar/executive-cv.html#experience-basis">النطاق والمصدر ←</a></div>'
        '<div class="stat"><b>540,000+</b><p>معلم ومعلمة ضمن نطاق البرامج الوطنية المبلّغ عنه</p><a href="/ar/executive-cv.html#educator-scope">النطاق والمصدر ←</a></div>'
        '<div class="stat"><b>49</b><p>إدارة تعليمية ضمن نطاق برامج تخطيط القوى العاملة 2021–2024</p><a href="/ar/executive-cv.html#educator-scope">النطاق والمصدر ←</a></div>'
        '<div class="stat"><b>1,000,000+</b><p>وصول للمنصات المؤسسية بحسب سجل السيرة الذاتية</p><a href="/ar/executive-cv.html#platform-reach">النطاق والمصدر ←</a></div>'
        '</div></section>') if lang=='ar' else ('<section class="stats" aria-label="Key numbers"><div class="wrap stat-grid">'
        '<div class="stat"><b>18+ Years</b><p>Cumulative experience across academia, government, healthcare and advisory work</p><a href="/executive-cv.html#experience-basis">Scope &amp; source →</a></div>'
        '<div class="stat"><b>540,000+</b><p>Educators within the reported scope of national programs</p><a href="/executive-cv.html#educator-scope">Scope &amp; source →</a></div>'
        '<div class="stat"><b>49</b><p>Education districts within the reported 2021–2024 workforce-planning scope</p><a href="/executive-cv.html#educator-scope">Scope &amp; source →</a></div>'
        '<div class="stat"><b>1,000,000+</b><p>Institutional platform reach as reported in the CV record</p><a href="/executive-cv.html#platform-reach">Scope &amp; source →</a></div>'
        '</div></section>')
    source, stats_count = re.subn(r'<section class="stats"[^>]*>.*?</section>', home_stats, source, count=1, flags=re.S)
    if stats_count != 1:
        raise ValueError(f'{path}: homepage stats target missing')
    quote = '«الرقم ليس قرارًا.»' if lang=='ar' else '“A score is not a decision.”'
    source = re.sub(r'(<section class="hero">.*?<blockquote>).*?(</blockquote>)', lambda m:m[1]+quote+m[2], source, count=1, flags=re.S)
    source, count = re.subn(r'<!-- ideas-gateway:start -->.*?<!-- ideas-gateway:end -->', home_gateway(lang), source, count=1, flags=re.S)
    if count != 1:
        raise ValueError(f'{path}: homepage ideas gateway target missing')
    if lang == 'ar':
        title='د. أديب نور | ما يخفيه الرقم — الذكاء الاصطناعي والقرار، جامعة الملك عبدالعزيز'
        desc='أديب نور، أستاذ علوم البيانات والذكاء الاصطناعي في جامعة الملك عبدالعزيز: ذكاء القرار، أخلاقيات الذكاء الاصطناعي، الذكاء الاصطناعي المسؤول، الصحة الرقمية والتحول المؤسسي.'
        locale='ar_SA'
    else:
        title='Prof. Adeeb Noor — What the Score Hides | AI & Decisions, King Abdulaziz University'
        desc='Prof. Adeeb Noor at King Abdulaziz University: decision intelligence, AI ethics, responsible AI, digital health, workforce strategy and institutional transformation.'
        locale='en_US'
    source=put_title(source,title)
    for attr,key,val in [('name','description',desc),('property','og:title',title),('property','og:description',desc),('property','og:locale',locale)]: source=put_meta(source,attr,key,val)
    if image_url:
        for attr,key,val in [('property','og:image',image_url),('property','og:image:width','1200'),('property','og:image:height','630'),('property','og:image:alt',title),('name','twitter:image',image_url),('name','twitter:card','summary_large_image')]: source=put_meta(source,attr,key,val)
    style='''<!-- thought-leadership:style:start --><style id="thought-leadership-home">.hero-thesis{font:700 18px/1.45 Arial,Tahoma,sans-serif;color:#f2d89c;margin:6px 0 10px;max-width:640px}.hero-cv-links{margin-top:12px;font-size:.9rem;opacity:.88}.hero-cv-links a{text-decoration:underline;text-underline-offset:3px}.hero-trust-links{display:flex;flex-wrap:wrap;gap:8px 11px;margin:10px 0 0;font:600 13px/1.5 Arial,Tahoma,sans-serif;color:#d7d0c2}.hero-trust-links a{text-decoration:underline;text-underline-offset:3px}.hero .actions .button{font-size:15px;min-height:50px;padding:13px 19px;font-weight:700}.hero .actions .button.primary{box-shadow:0 8px 20px rgba(201,163,90,.18)}.identity-path-primary{border-color:#c9a35a;box-shadow:0 12px 32px rgba(10,21,26,.08)}.identity-path-primary .label{color:#8a672b}@media(max-width:520px){.hero{padding-top:38px;padding-bottom:28px}.hero-grid{display:block}.hero-copy h1{font-size:clamp(2.35rem,13vw,3.25rem);margin-bottom:10px}.hero-copy .role{font-size:.95rem}.hero-copy .intro{font-size:1.02rem;line-height:1.52;margin-top:14px}.hero-copy .location{font-size:.82rem}.hero-copy .actions{margin-top:18px;gap:8px}.hero-copy .button{padding:12px 15px}.hero-thesis{font-size:16px}.hero-trust-links{font-size:12px;gap:6px 9px}.hero .portrait{display:block;margin:22px auto 0;max-width:330px}.hero .portrait .art{max-height:none}.hero .portrait blockquote{font-size:15px;margin-top:0}}</style><!-- thought-leadership:style:end -->'''
    source=source.replace('</head>',style+'</head>',1)
    source=PROFILE_BLOCK.sub(profile_schema(lang),source,count=1)
    path.write_text(source)


def first_hero_h1(source, value):
    return re.sub(r'(<section class="ideas-hero">.*?<h1>).*?(</h1>)', lambda m:m[1]+escape(value)+m[2], source, count=1, flags=re.S)


def apply_idea_page(path, lang, position=False, image_url=None):
    source=path.read_text()
    ar=lang=='ar'
    if position:
        title='ما يخفيه الرقم: أربعة أسئلة — د. أديب نور' if ar else 'What the Score Hides: Four Questions — Adeeb Noor'
        h1='ما يخفيه الرقم: أربعة أسئلة' if ar else 'What the Score Hides: Four Questions'
        desc='أربعة أسئلة عن مَن يتغيّر، ومَن يحدّد السعة، وماذا تعني الفئة، وما دليل الجاهزية.' if ar else 'Four questions about who changes, who sets capacity, what categories mean, and what counts as evidence of readiness.'
    else:
        title='ما يخفيه الرقم — د. أديب نور' if ar else 'What the Score Hides — Adeeb Noor'
        h1='ما يخفيه الرقم' if ar else 'What the Score Hides'
        desc='أفكار ومواقف حول ما يحدث عندما تتحول المقاييس إلى قرارات تمس الناس.' if ar else 'Ideas and positions on what happens when metrics become decisions about people.'
    source=put_title(source,title)
    source=first_hero_h1(source,h1)
    for attr,key,val in [('name','description',desc),('property','og:title',title),('property','og:description',desc),('property','og:locale','ar_SA' if ar else 'en_US')]: source=put_meta(source,attr,key,val)
    if image_url:
        for attr,key,val in [('property','og:image',image_url),('property','og:image:width','1200'),('property','og:image:height','630'),('property','og:image:alt',title),('name','twitter:image',image_url),('name','twitter:card','summary_large_image')]: source=put_meta(source,attr,key,val)
    path.write_text(source)


def cleanup_copy():
    replacements={
        'Professor · Researcher · Builder':'Professor of Data Science &amp; AI, King Abdulaziz University',
        'Professor · Researcher · Advisor':'Professor of Data Science &amp; AI, King Abdulaziz University',
        'Professor · Executive Advisor · Builder':'Professor of Data Science &amp; AI, King Abdulaziz University',
        'أستاذ دكتور · باحث · مستشار':'أستاذ علوم البيانات والذكاء الاصطناعي، جامعة الملك عبدالعزيز',
        'أستاذ دكتور · مستشار تنفيذي · مؤسس مشاريع':'أستاذ علوم البيانات والذكاء الاصطناعي، جامعة الملك عبدالعزيز',
        'أستاذ · باحث · مؤسس':'أستاذ علوم البيانات والذكاء الاصطناعي، جامعة الملك عبدالعزيز',
        'Define the question, the decision and the outcome you need. Scope, availability and fees are agreed after an initial review; no engagement or institutional endorsement is implied.':'Define the question, the decision and the outcome you need. Scope, availability and fees are agreed after a short first conversation.',
        'حدّد السؤال والقرار والنتيجة التي تحتاجها. يُتفق على النطاق والتفرغ والأتعاب بعد مراجعة أولية؛ ولا يُفهم من التواصل إقرار تعاون أو تأييد مؤسسي.':'حدّد السؤال والقرار والنتيجة التي تحتاجها. يُتفق على النطاق والتفرغ والأتعاب بعد محادثة أولية قصيرة.',
        'I offer these as arguments to test. I do not treat a working prototype, an attractive demonstration or my own conviction as sufficient evidence that an approach improves outcomes.':'Each position states its evidence — and what would change my mind.',
        'أطرح هذه المواقف للاختبار والنقاش. ولا أعدّ النموذج الأولي، أو العرض المقنع، أو قناعتي الشخصية دليلًا كافيًا على أن منهجًا ما يحسّن النتائج.':'كل موقف هنا يذكر دليله، وما الذي قد يغيّر رأيي فيه.',
        'I treat that case as a reason to examine the relationship between an audit and an action; it is not a universal estimate of harm or proof that every deployment behaves the same way.':'One documented case — a reason to look closer, not a general estimate.',
        'وأتعامل مع هذه الحالة بوصفها سببًا لفحص العلاقة بين التدقيق والفعل؛ ولا أعدّها تقديرًا عامًا للضرر أو دليلًا على أن جميع التطبيقات تتصرف بالطريقة نفسها.':'حالة موثقة واحدة — سبب للنظر عن قرب، لا تقدير عام.',
        'I aim to publish one substantial essay every two months and explain substantive revisions.':'I aim to publish one substantial essay every two weeks, alternating Arabic and English, and explain substantive revisions.',
        'أستهدف نشر مقال متعمّق كل شهرين مع توضيح التعديلات الجوهرية.':'أستهدف نشر مقال متعمّق كل أسبوعين بالتناوب بين العربية والإنجليزية، مع توضيح التعديلات الجوهرية.'
    }
    for path in ROOT.rglob('*.html'):
        if any(part in {'.git','node_modules','audit-artifacts'} for part in path.parts): continue
        source=path.read_text()
        original=source
        for old,new in replacements.items(): source=source.replace(old,new)
        if path.name in {'about.html','impact.html'}:
            source=re.sub(r'<p class="evidence-note">.*?</p>','',source,flags=re.S)
        if source!=original: path.write_text(source)


def fix_collaborate():
    for lang,path in [('en',ROOT/'collaborate.html'),('ar',ROOT/'ar/collaborate.html')]:
        if not path.exists(): continue
        source=path.read_text()
        canonical=ORIGIN+('/ar/contact.html' if lang=='ar' else '/contact.html')
        source=re.sub(r'<link rel="canonical" href="[^"]+">','<link rel="canonical" href="'+canonical+'">',source,count=1)
        if 'name="robots"' in source:
            source=re.sub(r'<meta name="robots" content="[^"]*">','<meta name="robots" content="noindex,follow">',source,count=1)
        else:
            source=source.replace('</head>','<meta name="robots" content="noindex,follow"></head>',1)
        path.write_text(source)


def main():
    images={lang:card(lang) for lang in ('en','ar')}
    apply_home(ROOT/'index.html','en',images['en'])
    apply_home(ROOT/'ar/index.html','ar',images['ar'])
    cleanup_copy()
    apply_idea_page(ROOT/'ideas/index.html','en',False,images['en'])
    apply_idea_page(ROOT/'ar/ideas/index.html','ar',False,images['ar'])
    apply_idea_page(ROOT/'ideas/position.html','en',True,images['en'])
    apply_idea_page(ROOT/'ar/ideas/position.html','ar',True,images['ar'])
    fix_collaborate()
    print('Applied thought-leadership identity, SEO, structured data, social cards and homepage hierarchy.')


if __name__=='__main__':
    main()
