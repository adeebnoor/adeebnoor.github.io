"""Final portfolio UX pass.

Runs last in the generated-site pipeline so project maturity, contact intake,
mobile asset versions and social metadata cannot be overwritten by earlier
generators/localizers.
"""
from pathlib import Path
from html import escape
import re

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://adeebnoor.github.io"
VERSION = "20260922-ux-final"

def put_meta(source, attr, key, value):
    pattern = re.compile(r'<meta\s+' + re.escape(attr) + r'="' + re.escape(key) + r'"\s+content="[^"]*"\s*/?>', re.I)
    tag = f'<meta {attr}="{key}" content="{escape(value, quote=True)}">'
    source, count = pattern.subn(tag, source, count=1)
    if not count:
        source = source.replace('</head>', tag + '\n</head>', 1)
    return source

def page_title(source):
    m = re.search(r'<title>(.*?)</title>', source, re.S | re.I)
    return re.sub(r'<[^>]+>', '', m.group(1)).replace('&amp;', '&').strip() if m else ''

def social_meta(source, *, description, image, locale, twitter_title=None):
    title = page_title(source)
    values = [
        ('name','description',description),
        ('property','og:title',title),
        ('property','og:description',description),
        ('property','og:image',image),
        ('property','og:image:alt',title),
        ('property','og:image:width','1200'),
        ('property','og:image:height','630'),
        ('property','og:site_name','أديب نور' if locale == 'ar_SA' else 'Adeeb Noor'),
        ('property','og:locale',locale),
        ('name','twitter:card','summary_large_image'),
        ('name','twitter:title',twitter_title or title),
        ('name','twitter:description',description),
        ('name','twitter:image',image),
    ]
    for attr,key,value in values:
        source = put_meta(source,attr,key,value)
    return source

def bump_assets(source):
    source = re.sub(r'/portfolio\.css(?:\?v=[^"\s>]+)?', f'/portfolio.css?v={VERSION}', source)
    source = re.sub(r'/inner\.css(?:\?v=[^"\s>]+)?', f'/inner.css?v={VERSION}', source)
    source = re.sub(r'/site-nav\.css(?:\?v=[^"\s>]+)?', f'/site-nav.css?v={VERSION}', source)
    source = re.sub(r'/site-nav\.js(?:\?v=[^"\s>]+)?', f'/site-nav.js?v={VERSION}', source)
    return source

def normalize_home(source, arabic=False):
    if arabic:
        mapping = {
            'مباشر':'Live',
            'نموذج أولي':'Prototype',
            'نسخة تجريبية عامة':'Public Beta',
            'بحث مفتوح':'Prototype',
            'قيد التطوير':'In Development',
            'نظام تعليمي مباشر':'Live',
            'تجربة ريادية':'Prototype',
        }
        for old,new in mapping.items():
            source = source.replace(f'<span class="project-state">{old}</span>', f'<span class="project-state" lang="en">{new}</span>')
        source = source.replace('<span class="project-updated">سجل عام 2019</span>','<span class="project-updated">محدّث 2019</span>')
        source = source.replace('<span class="project-updated">سجل عام 2017</span>','<span class="project-updated">محدّث 2017</span>')
        for state in ('Live','Public Beta','Prototype','In Development'):
            source = source.replace(f'<span class="project-state">{state}</span>', f'<span class="project-state" lang="en">{state}</span>')
    else:
        mapping = {'Open Research':'Prototype','Live Teaching System':'Live','Venture Experience':'Prototype'}
        for old,new in mapping.items():
            source = source.replace(f'<span class="project-state">{old}</span>',f'<span class="project-state">{new}</span>')
        source = source.replace('<span class="project-updated">Public record 2019</span>','<span class="project-updated">Updated 2019</span>')
        source = source.replace('<span class="project-updated">Public record 2017</span>','<span class="project-updated">Updated 2017</span>')
    return source

PROJECTS = {
    'miyar': ('Live','2026',
        'My role: co-developer of the bilingual position-management workspace.',
        'دوري: مطوّر مشارك لمساحة العمل الثنائية اللغة لإدارة المناصب.'),
    'kinetic-hr': ('Prototype','2026',
        'My role: product concept, decision logic and workforce-intelligence direction.',
        'دوري: مفهوم المنتج ومنطق القرار وتوجيه ذكاء القوى العاملة.'),
    'sultan': ('Public Beta','2026',
        'My role: strategy architecture and product direction.',
        'دوري: هندسة الاستراتيجية وتوجيه المنتج.'),
    'ridi-system': ('Prototype','2026',
        'My role: research lead and audit-toolkit architecture.',
        'دوري: قيادة البحث وهندسة أداة التدقيق.'),
    'imam': ('In Development','2026',
        'My role: Founder & Lead Architect.',
        'دوري: المؤسس والمعماري الرئيسي.'),
    'shifaa': ('Live','2019',
        'My role: founder and technology leadership during hospital digital modernization.',
        'دوري: التأسيس والقيادة التقنية خلال التحديث الرقمي للمستشفى.'),
    'iscarb-project': ('Live','2026',
        'My role: method creator and course lead.',
        'دوري: مطوّر المنهجية وقائد المقرر.'),
    'healthx': ('In Development','2026',
        'My role: platform concept and clinical-innovation architecture.',
        'دوري: مفهوم المنصة وهندسة الابتكار السريري.'),
    'genomefit': ('Prototype','2017',
        'My role: co-founder.',
        'دوري: مؤسس مشارك.'),
    'ledd': ('Prototype','2026',
        'My role: IT Director at King Abdulaziz University Hospital and member of the LEDD project team.',
        'دوري: مدير تقنية المعلومات في مستشفى جامعة الملك عبدالعزيز وعضو فريق مشروع LEDD.'),
}

def project_block(source, project_id, state, year, role, arabic):
    pattern = re.compile(r'(<article\b[^>]*\bid="' + re.escape(project_id) + r'"[^>]*>)(.*?)(</article>)', re.S | re.I)
    m = pattern.search(source)
    if not m:
        raise ValueError(f'Missing project card: {project_id}')
    body = m.group(2)
    body = re.sub(r'<div class="project-meta">.*?</div>', '', body, flags=re.S, count=1)
    body = re.sub(r'<p class="project-role">.*?</p>', '', body, flags=re.S, count=1)
    state_html = f'<span class="project-state" lang="en">{escape(state)}</span>' if arabic else f'<span class="project-state">{escape(state)}</span>'
    updated = ('محدّث ' if arabic else 'Updated ') + year
    meta = f'<div class="project-meta">{state_html}<span class="project-updated">{updated}</span></div><p class="project-role">{escape(role)}</p>'
    mini = re.search(r'<div class="mini">.*?</div>', body, re.S)
    if mini:
        body = body[:mini.end()] + meta + body[mini.end():]
    else:
        h2 = re.search(r'<h2>.*?</h2>', body, re.S)
        if not h2:
            raise ValueError(f'Missing project heading: {project_id}')
        body = body[:h2.end()] + meta + body[h2.end():]
    return source[:m.start()] + m.group(1) + body + m.group(3) + source[m.end():]

def normalize_ventures(source, arabic=False):
    for project_id,(state,year,en_role,ar_role) in PROJECTS.items():
        source = project_block(source, project_id, state, year, ar_role if arabic else en_role, arabic)
    return source

def engagement_field(arabic=False):
    if arabic:
        return '<div class="audit-field"><label for="inquiry-engagement">ما نوع الطلب؟</label><select id="inquiry-engagement" name="engagement" required><option value="">اختر نوع الطلب</option><option value="advisory">استشارة</option><option value="venture">تمويل / استثمار</option><option value="other">إشراف</option><option value="speaking">محاضرة / كلمة / ورشة</option><option value="research">شراكة / تعاون</option></select></div>'
    return '<div class="audit-field"><label for="inquiry-engagement">What is this request about?</label><select id="inquiry-engagement" name="engagement" required><option value="">Please select</option><option value="advisory">Strategic advisory</option><option value="venture">Funding / investment</option><option value="other">Student supervision</option><option value="speaking">Lecture / keynote / workshop</option><option value="research">Partnership / collaboration</option></select></div>'

def normalize_contact(source, arabic=False):
    field_pattern = re.compile(r'<div class="audit-field"><label for="inquiry-engagement">.*?</label><select id="inquiry-engagement" name="engagement" required>.*?</select></div>', re.S)
    source, count = field_pattern.subn('', source, count=1)
    if count != 1:
        raise ValueError('Missing engagement field')
    form_pattern = re.compile(r'(<form\b[^>]*data-inquiry-form[^>]*data-kind="inquiry"[^>]*>)', re.I)
    source, count = form_pattern.subn(lambda m: m.group(1)+engagement_field(arabic), source, count=1)
    if count != 1:
        raise ValueError('Missing inquiry form')
    return source

HOME = {
    'en': {
        'path':'index.html',
        'description':'Prof. Adeeb Noor — Saudi professor and builder working across AI and decision intelligence, strategy and governance, workforce intelligence, digital health, research and institutional transformation.',
        'image':ORIGIN+'/assets/adeeb-noor-card-en.jpg',
        'locale':'en_US',
        'twitter':'Prof. Adeeb Noor — AI, Decisions & Institutional Transformation',
    },
    'ar': {
        'path':'ar/index.html',
        'description':'الأستاذ الدكتور أديب نور — أستاذ وباحث ومطوّر أنظمة يعمل عبر الذكاء الاصطناعي وذكاء القرار، الاستراتيجية والحوكمة، ذكاء القوى العاملة، الصحة الرقمية، والبحث والتحول المؤسسي.',
        'image':ORIGIN+'/assets/adeeb-noor-card-ar.jpg',
        'locale':'ar_SA',
        'twitter':'الأستاذ الدكتور أديب نور — الذكاء الاصطناعي والقرار والتحول المؤسسي',
    }
}
for lang,cfg in HOME.items():
    p=ROOT/cfg['path']; source=p.read_text()
    source=normalize_home(source,lang=='ar')
    source=social_meta(source,description=cfg['description'],image=cfg['image'],locale=cfg['locale'],twitter_title=cfg['twitter'])
    p.write_text(bump_assets(source))

VENTURES = {
    'en': ('ventures.html','Adeeb Noor’s project portfolio: live systems, public betas, prototypes and work in development across workforce intelligence, strategy, digital health, education, responsible AI and decision intelligence.',ORIGIN+'/assets/adeeb-noor-card-en.jpg','en_US'),
    'ar': ('ar/ventures.html','محفظة مشاريع الأستاذ الدكتور أديب نور: أنظمة مباشرة، نسخ تجريبية عامة، نماذج أولية وأعمال قيد التطوير عبر ذكاء القوى العاملة، الاستراتيجية، الصحة الرقمية، التعليم، والذكاء الاصطناعي وذكاء القرار.',ORIGIN+'/assets/adeeb-noor-card-ar.jpg','ar_SA'),
}
for lang,(path,description,image,locale) in VENTURES.items():
    p=ROOT/path; source=p.read_text()
    source=normalize_ventures(source,lang=='ar')
    source=social_meta(source,description=description,image=image,locale=locale)
    p.write_text(bump_assets(source))

CONTACT = {
    'en': ('contact.html','Contact Prof. Adeeb Noor for strategic advisory, funding and venture discussions, student supervision, lectures and workshops, research collaboration and institutional partnerships.',ORIGIN+'/assets/adeeb-noor-card-en.jpg','en_US'),
    'ar': ('ar/contact.html','تواصل مع الأستاذ الدكتور أديب نور بشأن الاستشارات الاستراتيجية، التمويل والاستثمار، الإشراف الطلابي، المحاضرات وورش العمل، التعاون البحثي والشراكات المؤسسية.',ORIGIN+'/assets/adeeb-noor-card-ar.jpg','ar_SA'),
}
for lang,(path,description,image,locale) in CONTACT.items():
    p=ROOT/path; source=p.read_text()
    source=normalize_contact(source,lang=='ar')
    source=social_meta(source,description=description,image=image,locale=locale)
    p.write_text(bump_assets(source))

print('Finalized project maturity, bilingual contact intake, mobile assets and social metadata.')
