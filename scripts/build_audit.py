"""Render the audit additions from shared bilingual data; preserve existing evidence.

All additions to legacy pages are delimited so localization never translates an
already-generated English block. Publication dates come from documented history,
not from the build clock. No testimonials, endorsements or business results are invented.
"""
from pathlib import Path
from html import escape as e
from email.utils import format_datetime
from datetime import datetime, timezone
import json
import re
import xml.etree.ElementTree as ET
from localize_site import PAGES, public_path, finish

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://adeebnoor.github.io'
DATA = json.loads((ROOT/'data/site-audit-content.json').read_text())
IDEAS = json.loads((ROOT/'data/ideas-content.json').read_text())
IDENTITY = json.loads((ROOT/'data/site_identity.json').read_text())
CONFIG = json.loads((ROOT/'data/analytics-config.json').read_text())
DATES_FILE = ROOT/'data/essay-dates.json'
DATES = json.loads(DATES_FILE.read_text()) if DATES_FILE.exists() else {}
VERSION = '20260914-audit2'
BLOCK = re.compile(r'<!-- site-audit:([\w-]+):start -->.*?<!-- site-audit:\1:end -->', re.S)


def text(en, ar, lang):
    return ar if lang == 'ar' else en


def value(copy, lang):
    return e(copy[lang])


def url(path, lang):
    return '/ar' + path if lang == 'ar' and path.startswith('/') and not path.startswith('//') else path


def link(path, label, lang, cls='', extra=''):
    href = url(path, lang)
    return f'<a href="{e(href, quote=True)}"'+(f' class="{cls}"' if cls else '')+(f' {extra}' if extra else '')+f'>{e(label)}</a>'


def block(name, html):
    return f'<!-- site-audit:{name}:start -->{html}<!-- site-audit:{name}:end -->'


def json_script(data, kind='application/ld+json', id_=''):
    return '<script type="'+kind+'"'+(f' id="{id_}"' if id_ else '')+'>'+json.dumps(data, ensure_ascii=False, separators=(',',':')).replace('<','\\u003c')+'</script>'


def services(lang):
    cards=[]
    for service in DATA['ways']:
        cards.append('<article class="audit-card"><h3>'+value(service['title'],lang)+'</h3><p>'+value(service['body'],lang)+'</p>'+link('/contact.html?engagement='+service['id']+'#inquiry-form',text('Discuss this engagement →','ناقش هذا التعاون ←',lang),lang,'',f'data-intake-engagement="{service["id"]}"')+'</article>')
    return '<section class="audit-section" id="engagement-options"><div class="audit-kicker">'+text('Ways to work together','مسارات التعاون',lang)+'</div><h2>'+text('A clear starting point for your next challenge.','بداية واضحة للتحدي الذي تعمل عليه.',lang)+'</h2><p>'+text('Define the question, the decision and the outcome you need. Scope, availability and fees are agreed after an initial review; no engagement or institutional endorsement is implied.','حدّد السؤال والقرار والنتيجة التي تحتاجها. يُتفق على النطاق والتفرغ والأتعاب بعد مراجعة أولية؛ ولا يُفهم من التواصل إقرار تعاون أو تأييد مؤسسي.',lang)+'</p><div class="audit-grid">'+''.join(cards)+'</div></section>'


def proof(lang):
    return '<section class="audit-section" id="institutional-context"><div class="audit-kicker">'+text('Institutional experience','خبرة مؤسسية',lang)+'</div><h2>'+text('Working across advisory and delivery teams.','العمل عبر فرق الاستشارة والتنفيذ.',lang)+'</h2><div class="audit-tags" aria-label="'+text('Organizations named in the professional record','جهات واردة في السجل المهني',lang)+'">'+''.join('<span dir="ltr">'+e(name)+'</span>' for name in DATA['partners'])+'</div><p class="audit-note">'+text('My CV records serving as the Ministry of Education’s institutional counterpart on commissioned work involving these firms. Their names describe that professional context—not personal clients, current partnerships or endorsements.','يسجّل ملفي المهني العمل ممثلًا مؤسسيًا لوزارة التعليم في أعمال مكلّفة شملت هذه الجهات. تُذكر أسماؤها لتوضيح السياق المهني، لا باعتبارها عملاء شخصيين أو شراكات حالية أو جهات مؤيّدة.',lang)+'</p><div class="audit-links">'+link('/engagements.html',text('Selected engagements →','نماذج من العمل ←',lang),lang)+link('/executive-cv.html',text('Executive record','السجل التنفيذي',lang),lang)+'</div></section>'


def repositories(lang):
    return '<section class="audit-section" id="open-source"><div class="audit-kicker">'+text('Open work','عمل مفتوح',lang)+'</div><h2>'+text('Explore the code and research resources.','استكشف الكود والموارد البحثية.',lang)+'</h2><div class="audit-grid">'+''.join('<article class="audit-card"><h3>'+link(item['url'],item['name'],lang)+'</h3><p>'+value(item['body'],lang)+'</p></article>' for item in DATA['repositories'])+'</div><p>'+link(DATA['github'],text('View my GitHub profile →','حسابي على GitHub ←',lang),lang)+'</p></section>'


def input_field(name, label, lang, type_='text', required=False, max_=160, autocomplete='off', full=False, min_=None):
    id_='inquiry-'+name
    attrs=f' id="{id_}" name="{name}" type="{type_}" maxlength="{max_}" autocomplete="{autocomplete}"'
    if required: attrs+=' required'
    if min_ is not None: attrs+=f' minlength="{min_}"'
    return '<div class="audit-field'+(' audit-full' if full else '')+'"><label for="'+id_+'">'+e(label)+('</label><input'+attrs+'>')+'</div>'


def select_field(name,label,options,lang,required=True):
    return '<div class="audit-field"><label for="inquiry-'+name+'">'+e(label)+'</label><select id="inquiry-'+name+'" name="'+name+'"'+(' required' if required else '')+'><option value="">'+text('Please select','اختر',lang)+'</option>'+''.join(f'<option value="{e(key)}">{e(text(en,ar,lang))}</option>' for key,en,ar in options)+'</select></div>'


def inquiry_form(lang, updates=False):
    kind='updates' if updates else 'inquiry'
    fields=input_field('name',text('Your name','الاسم',lang),lang,required=True,autocomplete='name',min_=2)
    fields+=input_field('email',text('Email address','البريد الإلكتروني',lang),lang,'email',True,254,'email')
    if not updates:
        fields+=input_field('organization',text('Organization / affiliation (optional)','الجهة أو الانتماء (اختياري)',lang),lang,autocomplete='organization')
        fields+=select_field('audience',text('I am contacting as','أتواصل بصفتي',lang),[
            ('institution','Institution / government','جهة مؤسسية أو حكومية'),('company','Company / investor','شركة أو مستثمر'),('researcher','Researcher / academic','باحث أو أكاديمي'),('student','Student','طالب')],lang)
        fields+=select_field('engagement',text('Type of engagement','نوع التعاون',lang),[(s['id'],s['title']['en'],s['title']['ar']) for s in DATA['ways']]+[('other','Other / not sure yet','أخرى أو لم يتضح بعد')],lang)
        fields+=select_field('timeline',text('Desired timeline','الإطار الزمني المطلوب',lang),[('soon','Within a month','خلال شهر'),('quarter','Within three months','خلال ثلاثة أشهر'),('later','Later / exploratory','لاحقًا أو استكشافي')],lang)
        fields+=select_field('authority',text('Your role in the decision','دورك في القرار',lang),[('decision_maker','Decision maker / sponsor','صاحب القرار أو الراعي'),('team','Project team / recommender','فريق المشروع أو مقدم التوصية'),('individual','Individual inquiry / student','تواصل فردي أو طالب')],lang)
        fields+='<div class="audit-field audit-full"><label for="inquiry-problem">'+text('What problem are you trying to solve? What outcome would be useful?','ما المشكلة التي تريد حلّها؟ وما النتيجة التي تحتاجها؟',lang)+'</label><textarea id="inquiry-problem" name="problem" minlength="20" maxlength="4000" required aria-describedby="inquiry-help"></textarea><p class="audit-help" id="inquiry-help">'+text('20–4,000 characters. Do not include patient information, passwords or confidential institutional material.','من 20 إلى 4,000 حرف. لا تُدرج بيانات مرضى أو كلمات مرور أو مواد مؤسسية سرية.',lang)+'</p></div>'
    fields+='<div class="audit-honeypot" aria-hidden="true"><label for="inquiry-website">Website</label><input id="inquiry-website" name="website" tabindex="-1" autocomplete="off"></div>'
    consent=text('I agree that Adeeb Noor may use these details to respond to this request.','أوافق على استخدام أديب نور لهذه البيانات للرد على هذا الطلب.',lang)
    if updates:
        consent=text('I request occasional essay updates and agree to being contacted to confirm my email before any subscription is activated.','أطلب تحديثات المقالات من حين لآخر، وأوافق على التواصل معي لتأكيد بريدي قبل تفعيل أي اشتراك.',lang)
    fields+='<label class="audit-check audit-full"><input type="checkbox" name="consent" required><span>'+consent+' '+link('/privacy.html#inquiry-privacy',text('Privacy details','تفاصيل الخصوصية',lang),lang)+'</span></label>'
    fields+='<div class="audit-full"><button class="audit-button" type="submit" disabled>'+text('Save update request' if updates else 'Send inquiry','احفظ طلب التحديثات' if updates else 'أرسل الطلب',lang)+'</button></div><p class="audit-status audit-full" data-form-status role="status" aria-live="polite" tabindex="-1"></p>'
    note=text('Requests are saved in a private inbox; an automatic email receipt is not sent.','تُحفظ الطلبات في صندوق خاص، ولا تُرسل رسالة تأكيد آلية إلى البريد.',lang)
    if updates: note=text('This is a request for email updates, not an active newsletter subscription. Requests require review and email confirmation. RSS is available immediately.','هذا طلب لتحديثات بريدية، وليس اشتراكًا مفعّلًا في نشرة. يحتاج الطلب إلى مراجعة وتأكيد البريد. أما RSS فمتاح فورًا.',lang)
    return '<section class="audit-section" id="'+('essay-updates' if updates else 'inquiry-form')+'"><div class="audit-kicker">'+text('Stay in touch' if updates else 'A focused conversation','ابقَ على تواصل' if updates else 'محادثة محددة الهدف',lang)+'</div><h2>'+text('Follow the essays.' if updates else 'Tell me what you are working on.','تابع المقالات.' if updates else 'أخبرني بما تعمل عليه.',lang)+'</h2><p>'+note+'</p><form method="post" class="audit-form" data-inquiry-form data-kind="'+kind+'">'+fields+'</form><noscript><p>'+text('JavaScript is needed for the form. Please use email instead.','يحتاج النموذج إلى JavaScript. استخدم البريد بدلًا منه.',lang)+'</p></noscript><div class="audit-links">'+link('mailto:'+IDENTITY['institutional_email'],IDENTITY['institutional_email'],lang)+ (link('/feed.xml',text('RSS feed','خلاصة RSS',lang),lang) if updates else '')+'</div></section>'


def footer(lang):
    return '<div class="audit-footer"><nav aria-label="'+text('Explore further','استكشف المزيد',lang)+'">'+''.join(link(path,text(en,ar,lang),lang) for path,en,ar in [('/ideas/','Ideas','الأفكار'),('/writing/','Essays','المقالات'),('/engagements.html','Selected engagements','نماذج من العمل'),('/speaking.html','Speaking & media','التحدث والإعلام'),(DATA['github'],'GitHub','GitHub'),('/feed.xml','RSS','RSS')])+'</nav></div>'


def common_head(lang, form=False):
    html='<link rel="stylesheet" href="/audit.css?v='+VERSION+'"><link rel="alternate" type="application/rss+xml" title="'+text('Adeeb Noor — Essays','أديب نور — المقالات',lang)+'" href="'+url('/feed.xml',lang)+'">'
    if form:
        html+=json_script({'endpoint':ORIGIN.replace('https://adeebnoor.github.io', 'https://xcirpzxpcpbxpowjbpiq.supabase.co')+'/functions/v1/portfolio-inquiries','publicAnonKey':CONFIG['publicAnonKey']},'application/json','site-inquiry-config')
        html+='<script defer src="/contact-form.js?v='+VERSION+'"></script>'
    return html


def standalone(path, title, description, body, lang, private=False):
    html='<!doctype html><html lang="'+lang+'"'+(' dir="rtl"' if lang=='ar' else '')+'><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+e(title)+' — '+text('Adeeb Noor','أديب نور',lang)+'</title><meta name="description" content="'+e(description,quote=True)+'"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/ideas.css?v=20260913-ideas1">'
    if private: html+='<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">'
    else: html+='<meta property="og:type" content="website"><meta property="og:title" content="'+e(title,quote=True)+'"><meta property="og:description" content="'+e(description,quote=True)+'"><meta property="og:url" content="'+ORIGIN+url('/'+path,lang)+'">'
    html+='</head><body>'+body+'</body></html>'
    return finish(html,path,lang=='ar')


def render_cases(lang):
    title=text('Selected engagements','نماذج من العمل',lang)
    body='<main class="ideas-wrap" id="main-content"><section class="ideas-hero"><div class="audit-kicker">'+text('Experience in context','الخبرة في سياقها',lang)+'</div><h1>'+title+'</h1><p>'+text('The situation, my contribution and the recorded outcome—alongside the limits of the available evidence.','التحدي وإسهامي والنتيجة المسجّلة، مع بيان حدود الأدلة المتاحة.',lang)+'</p></section><div class="audit-cases">'
    for case in DATA['cases']:
        body+='<article class="audit-case" id="'+case['id']+'"><div class="audit-kicker">'+value(case['context'],lang)+'</div><h2>'+value(case['title'],lang)+'</h2><dl>'
        for key,en,ar in [('situation','Situation','التحدي'),('action','My contribution','إسهامي'),('result','Recorded outcome','النتيجة المسجّلة')]: body+='<dt>'+text(en,ar,lang)+'</dt><dd>'+value(case[key],lang)+'</dd>'
        body+='</dl><p class="audit-note">'+value(case['caveat'],lang)+'</p><div class="audit-links">'+''.join(link((item.get('arUrl',item['url']) if lang=='ar' else item['url']),item['label'][lang],lang) for item in case['links'])+'</div></article>'
    body+='</div><section class="audit-section"><h2>'+text('Bring a problem worth solving.','لنبدأ بمشكلة تستحق الحل.',lang)+'</h2>'+link('/contact.html#inquiry-form',text('Discuss an engagement →','ناقش فرصة تعاون ←',lang),lang,'audit-button')+'</section></main>'
    return standalone('engagements.html',title,text('Selected leadership and research-translation work by Adeeb Noor.','نماذج من عمل أديب نور في القيادة وتحويل البحث إلى تطبيق.',lang),body,lang)


def render_inbox(lang):
    title=text('Private inquiry inbox','صندوق الطلبات الخاص',lang)
    body='<main class="ideas-wrap" id="main-content"><section class="ideas-hero"><h1>'+title+'</h1><p>'+text('Owner access only. Use your existing private analytics key. Requests are not sent to your email automatically.','لصاحب الموقع فقط. استخدم مفتاح الإحصاءات الخاص الحالي. لا تُرسل الطلبات إلى بريدك آليًا.',lang)+'</p></section><section class="audit-section"><form id="inbox-login" method="post"><label for="inbox-key">'+text('Private owner key','مفتاح صاحب الموقع الخاص',lang)+'</label><div class="audit-toolbar"><input class="audit-owner-input" id="inbox-key" type="password" autocomplete="off" required minlength="43" maxlength="128"><button class="audit-button" type="submit">'+text('Unlock inbox','افتح الصندوق',lang)+'</button></div><p class="audit-help">'+text('The key stays in this tab’s memory for up to 30 minutes. It is not saved in browser storage or included in links.','يبقى المفتاح في ذاكرة علامة التبويب لمدة تصل إلى 30 دقيقة. لا يُحفظ في تخزين المتصفح ولا يُدرج في الروابط.',lang)+'</p></form><p id="inbox-status" class="audit-status" role="status" aria-live="polite"></p><div id="inbox-content" hidden><div class="audit-toolbar"><label for="inbox-filter">'+text('Status','الحالة',lang)+'</label><select id="inbox-filter">'+''.join('<option value="'+key+'">'+text(en,ar,lang)+'</option>' for key,en,ar in [('all','All','الكل'),('new','New inquiries','طلبات جديدة'),('pending_confirmation','Update requests awaiting confirmation','تحديثات بانتظار تأكيد البريد'),('contacted','Contacted','تم التواصل'),('closed','Closed','مغلق')])+'</select><button id="inbox-refresh" type="button" class="audit-button">'+text('Refresh','تحديث',lang)+'</button><button id="inbox-lock" type="button" class="audit-button">'+text('Lock','إقفال',lang)+'</button></div><p class="audit-help">'+text('Shows the most recent 100 requests. Reply by email, update the status or delete a request. Confirm an update requester’s email before adding them to a future mailing list.','يعرض أحدث 100 طلب. يمكنك الرد بالبريد أو تحديث الحالة أو حذف الطلب. أكّد بريد طالب التحديثات قبل إضافته إلى أي قائمة بريدية مستقبلية.',lang)+'</p><div id="inbox-list" class="audit-inbox-list"></div></div></section>'+link('/analytics/',text('Visitor analytics','إحصاءات الزوار',lang),lang)+'</main>'
    source=standalone('inquiries/index.html',title,text('Private owner inbox.','صندوق خاص بصاحب الموقع.',lang),body,lang,True)
    config=json_script({'endpoint':'https://xcirpzxpcpbxpowjbpiq.supabase.co/functions/v1/portfolio-inquiries','publicAnonKey':CONFIG['publicAnonKey']},'application/json','site-inquiry-config')
    return source.replace('</head>',block('inbox-head',config+'<script defer src="/inquiries/inbox.js?v='+VERSION+'"></script>')+'</head>')


def person(lang):
    return {'@context':'https://schema.org','@type':'Person','@id':ORIGIN+'/#person','name':'Adeeb Noor','alternateName':['أديب نور','B. Adeeb Noor'],'url':ORIGIN+'/','jobTitle':'Professor','worksFor':{'@type':'CollegeOrUniversity','name':'King Abdulaziz University'},'sameAs':['https://www.linkedin.com/in/adeeb-noor','https://scholar.google.com/citations?user=XUQD1WAAAAAJ&hl=en','https://orcid.org/0000-0002-8251-1853',DATA['github']]}


def essay_meta(article,lang):
    target=(('ar/' if lang=='ar' else '')+article['path'].lstrip('/'))
    date=DATES.get(target,{})
    image=ORIGIN+'/assets/essays/'+article['slug']+'-'+lang+'.png'
    schema={'@context':'https://schema.org','@type':'Article','@id':ORIGIN+url(article['path'],lang)+'#article','headline':article['title'][lang],'description':article['standfirst'][lang],'author':{'@type':'Person','@id':ORIGIN+'/#person','name':'Adeeb Noor','url':ORIGIN+'/about.html'},'mainEntityOfPage':ORIGIN+url(article['path'],lang),'inLanguage':lang,'image':[image],'dateModified':'2026-09-13'}
    if date.get('published'): schema['datePublished']=date['published']
    meta=json_script(schema)+'<meta property="og:type" content="article"><meta property="og:image" content="'+image+'"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="'+e(article['title'][lang],quote=True)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="'+image+'"><meta property="article:modified_time" content="2026-09-13">'
    if date.get('published'): meta+='<meta property="article:published_time" content="'+e(date['published'],quote=True)+'">'
    return meta,date


def add_to_main(source, name, content, at_start=False):
    content=block(name,content)
    if at_start: return re.sub(r'(<main\b[^>]*>)',lambda m:m[1]+content,source,count=1)
    return source.replace('</main>',content+'</main>',1)


def feed(lang):
    ET.register_namespace('atom','http://www.w3.org/2005/Atom')
    rss=ET.Element('rss',version='2.0')
    channel=ET.SubElement(rss,'channel')
    for tag,val in [('title',text('Adeeb Noor — Essays','أديب نور — المقالات',lang)),('link',ORIGIN+url('/writing/',lang)),('description',text('Essays on AI, institutions and evidence.','مقالات عن الذكاء الاصطناعي والمؤسسات والأدلة.',lang)),('language',lang)]: ET.SubElement(channel,tag).text=val
    ET.SubElement(channel,'{http://www.w3.org/2005/Atom}link',href=ORIGIN+url('/feed.xml',lang),rel='self',type='application/rss+xml')
    for article in IDEAS['articles']:
        item=ET.SubElement(channel,'item')
        href=ORIGIN+url(article['path'],lang)
        for tag,val in [('title',article['title'][lang]),('link',href),('description',article['standfirst'][lang]),('guid',href)]: ET.SubElement(item,tag).text=val
        d=DATES.get(('ar/' if lang=='ar' else '')+article['path'].lstrip('/'),{}).get('published')
        if d: ET.SubElement(item,'pubDate').text=format_datetime(datetime.fromisoformat(d.replace('Z','+00:00')))
    target=ROOT/('ar/feed.xml' if lang=='ar' else 'feed.xml')
    ET.indent(rss)
    target.write_bytes(ET.tostring(rss,encoding='utf-8',xml_declaration=True))


def build():
    for lang in ('en','ar'):
        for page in PAGES:
            target=ROOT/(('ar/' if lang=='ar' else '')+page)
            if page=='engagements.html': source=render_cases(lang)
            elif page=='inquiries/index.html': source=render_inbox(lang)
            else: source=BLOCK.sub('',target.read_text())
            if page in ('404.html','collaborate.html'): continue
            is_form=page in ('contact.html','writing/index.html')
            source=source.replace('</head>',block('head',common_head(lang,is_form))+'</head>')
            if page not in ('inquiries/index.html','analytics/index.html'):
                source=source.replace('</body>',block('footer',footer(lang))+'</body>')
            if page=='index.html':
                home='<div class="wrap">'+services(lang)+'</div>'
                source=add_to_main(source,'home-services',home)
                source=re.sub(r'<a class="button" href="#projects">[^<]*</a>','',source,count=1)
            if page in ('index.html','about.html'):
                source=re.sub(r'<script type="application/ld\+json">[^<]*"@type"\s*:\s*"Person"[^<]*</script>','',source)
                source=source.replace('</head>',block('person',json_script(person(lang)))+'</head>')
            if page=='contact.html':
                # Put the real form before the five service cards.
                source=add_to_main(source,'intake',inquiry_form(lang)+services(lang),True)
                actions='<div class="hero-actions"><a class="primary" href="#inquiry-form">'+text('Open inquiry form','افتح نموذج التواصل',lang)+'</a><a href="mailto:'+IDENTITY['institutional_email']+'">'+text('Email instead','البريد بديلًا',lang)+'</a></div>'
                source,count=re.subn(r'(<section class="page-hero">.*?)<div class="hero-actions">.*?</div>',lambda m:m[1]+actions,source,count=1,flags=re.S)
                if count!=1: raise ValueError('Contact hero action target missing')
                # Keep mail as an explicit fallback, while qualifying audience CTAs.
                for old,audience in [('Advisory%20Inquiry','institution'),('Partnership%20Inquiry','company'),('Research%20Collaboration','researcher'),('Student%20Research%20Inquiry','student')]:
                    source=re.sub(r'(<a\b[^>]*href=")mailto:[^"]*'+old+r'[^"]*("[^>]*>)',lambda m:m[1]+'#inquiry-form'+m[2][:-1]+' data-intake-audience="'+audience+'">',source)
                source=add_to_main(source,'proof',proof(lang))
            if page in ('ventures.html','impact.html'):
                source=add_to_main(source,'proof',proof(lang),True)
            if page in ('about.html','research.html'):
                source=add_to_main(source,'repositories',repositories(lang))
            if page=='writing/index.html': source=add_to_main(source,'updates',inquiry_form(lang,True))
            if page=='privacy.html':
                copy=text('Contact and essay-update requests are separate from anonymous visit analytics. With your permission, the form sends your name, email and the fields you complete to a private Supabase database hosted in Australia. Only the site owner can read requests through the protected inbox. No form content is sent to analytics or placed in public GitHub files. Requests older than 180 days are removed during subsequent submissions or owner access; removal is not an always-running scheduled job. An email-update request is pending review, not an active newsletter subscription. No automated emails are sent. A short-lived, keyed anti-abuse fingerprint is used for rate limiting; the raw IP address is not stored in the inquiry tables. Do not include confidential or health information. To ask for deletion or withdraw an update request, contact the email below.','طلبات التواصل وتحديثات المقالات منفصلة عن إحصاءات الزيارات المجهولة. بعد موافقتك، يرسل النموذج اسمك وبريدك والحقول التي تعبئها إلى قاعدة بيانات Supabase خاصة مستضافة في أستراليا. يطّلع صاحب الموقع فقط على الطلبات عبر الصندوق المحمي. لا يُرسل محتوى النموذج إلى الإحصاءات ولا يُنشر في ملفات GitHub العامة. تُحذف الطلبات الأقدم من 180 يومًا عند استقبال طلبات لاحقة أو فتح الصندوق؛ وليست هذه عملية حذف مجدولة تعمل باستمرار. طلب التحديثات البريدية قيد المراجعة، وليس اشتراكًا مفعّلًا. لا تُرسل رسائل آلية. يُستخدم معرّف قصير الأجل مشتق بمفتاح للحماية من الإساءة وتحديد عدد الطلبات؛ ولا يُحفظ عنوان IP الأصلي في جداول الطلبات. لا تُرسل معلومات صحية أو سرية. لطلب الحذف أو سحب طلب التحديثات، تواصل عبر البريد أدناه.',lang)
                source=add_to_main(source,'inquiry-privacy','<section class="audit-section" id="inquiry-privacy"><h2>'+text('Contact form privacy','خصوصية نموذج التواصل',lang)+'</h2><p>'+copy+'</p>'+link('mailto:'+IDENTITY['institutional_email'],IDENTITY['institutional_email'],lang)+'</section>')
            if page=='analytics/index.html':
                source=add_to_main(source,'owner-inbox','<section class="audit-section"><h2>'+text('Professional inquiries','طلبات التواصل المهني',lang)+'</h2>'+link('/inquiries/',text('Open private inquiry inbox →','افتح صندوق الطلبات الخاص ←',lang),lang,'audit-button')+'</section>')
            for article in IDEAS['articles']:
                if page==article['path'].lstrip('/'):
                    source=re.sub(r'<meta\b[^>]*(?:property="(?:og:image(?::[^" ]+)?|og:type|article:[^"]+)"|name="twitter:[^"]+")[^>]*>','',source)
                    meta,d=essay_meta(article,lang)
                    source=source.replace('</head>',block('article-meta',meta)+'</head>')
                    if d.get('published'):
                        date=d['published'][:10]
                        note='<p class="audit-meta">'+text('First recorded publication: ','أول نشر مسجّل: ',lang)+'<time datetime="'+e(d['published'],quote=True)+'">'+date+'</time> · '+text('Based on repository history.','وفق سجل المستودع.',lang)+'</p>'
                        source=source.replace('<div class="article-body">',block('publication-date',note)+'<div class="article-body">',1)
            target.write_text(source)
        feed(lang)
    print('Rendered bilingual engagement cases, real intake, private inbox, provenance, article metadata and feeds.')


if __name__=='__main__': build()
