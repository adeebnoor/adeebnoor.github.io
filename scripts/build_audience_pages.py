"""Generate bilingual audience landing pages requested by the portfolio roadmap.

These pages deliberately use only claims already present in the public CV/site.
Missing grant amounts, student names, current citation metrics and an approved
high-resolution portrait are not invented here.
"""
from pathlib import Path
from html import escape
import re

from localize_site import finish, ORIGIN

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('funders.html', 'students.html', 'academic.html', 'press.html')


def card(title, text, link=None, label=None):
    action = f'<p><a href="{escape(link, quote=True)}">{escape(label or "Learn more")} →</a></p>' if link else ''
    return f'<article class="venture-card"><div class="venture-body"><h3>{escape(title)}</h3><p>{escape(text)}</p>{action}</div></article>'


def page(lang, page_name, title, description, crumb, heading, lead, body, cta_label, cta_href='/contact.html#inquiry-form'):
    ar = lang == 'ar'
    prefix = '/ar' if ar else ''
    share = ORIGIN.rstrip('/') + '/assets/' + ('adeeb-noor-card-ar.jpg' if ar else 'adeeb-noor-card-en.jpg')
    href = prefix + cta_href if cta_href.startswith('/') else cta_href
    doc = f'''<!doctype html><html lang="{lang}"{' dir="rtl"' if ar else ''}><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)}</title><meta name="description" content="{escape(description, quote=True)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/inner.css">
<meta property="og:type" content="website"><meta property="og:title" content="{escape(title, quote=True)}"><meta property="og:description" content="{escape(description, quote=True)}"><meta property="og:image" content="{share}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="{'ar_SA' if ar else 'en_US'}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{share}">
</head><body><section class="page-hero"><div class="wrap"><div class="crumb">{escape(crumb)}</div><h1>{escape(heading)}</h1><p>{escape(lead)}</p><div class="hero-actions"><a class="primary" href="{escape(href, quote=True)}">{escape(cta_label)}</a></div></div></section><main class="wrap content">{body}</main></body></html>'''
    built = finish(doc, page_name, ar)
    # The central collector currently inventories the long-lived site pages. These
    # new landing pages should never emit partially accepted analytics batches.
    built = re.sub(r'<script\b[^>]*id="portfolio-analytics"[^>]*></script>', '', built)
    return built


def section(kicker, heading, text, cards=''):
    return f'<section class="section-intro"><div class="kicker">{escape(kicker)}</div><div><h2>{escape(heading)}</h2><p>{escape(text)}</p></div></section>{cards}'


def build_funders(lang):
    ar = lang == 'ar'; p = '/ar' if ar else ''
    if ar:
        record = ''.join([
            card('سجل علمي', 'أكثر من 40 ورقة محكّمة وفق سجل السيرة الحالي؛ تبقى أرقام الاستشهادات وh-index ديناميكية ويُرجع فيها إلى Google Scholar.', p+'/academic-cv.html', 'السيرة الأكاديمية'),
            card('من البحث إلى التطبيق', 'يتضمن السجل دعم KAUST TAQADAM لمشروع في الطب الدقيق عام 2016، وجائزة/منحة FekraTech لمشروع تحسين قسم الطوارئ عام 2017.', p+'/master-cv.html', 'السيرة الكاملة'),
            card('خبرة مؤسسية', 'يتضمن السجل الإشراف أو المساهمة في محافظ برامج بنحو 190 مليون ريال؛ الرقم معروض وفق نطاق ومصدر السيرة وليس كتدقيق مالي مستقل.', p+'/executive-cv.html#metric-sources', 'النطاق والمصدر'),
        ])
        proposals = ''.join([
            card('1 · تدقيق قرارات الذكاء الاصطناعي في القطاع العام', 'امتداد لـRIDI: قياس من يتغير عندما يتغير النموذج، وربط جودة الترتيب بكلفة التغيير في القرار.', p+'/ideas/position.html#beyond-the-average', 'الأساس الفكري'),
            card('2 · اكتمال المعرفة الطبية قبل الاستدلال السريري', 'امتداد D3 وAnti-DDI وD4: فحص ما إذا كانت قاعدة المعرفة نفسها مكتملة بما يكفي قبل تحويلها إلى استدلال أو قرار سريري.', p+'/research.html', 'الأبحاث ذات الصلة'),
            card('3 · دليل الجاهزية في التعليم المدعوم بالذكاء الاصطناعي', 'امتداد iSCARB وIMAM: الانتقال من مخرج مصقول إلى دليل على الحكم والجاهزية تحت ظروف متغيرة.', p+'/ideas/readiness-needs-evidence.html', 'اقرأ الموقف'),
        ])
        body = section('للجهات المانحة','تمويل السؤال قبل تمويل الأداة','الأطروحة المشتركة: الرقم ليس قرارًا. أبحث أين تضيع الهوية والسياق والدليل عندما تتحول المقاييس إلى قرارات تمس الناس.') + '<div class="venture-stack">'+record+'</div>' + section('اتجاهات جاهزة للنقاش','ثلاثة برامج بحثية قابلة للتشكيل مع الجهة المانحة','المدة والفريق والميزانية والشركاء لا تُفترض هنا؛ تُحدَّد بعد مواءمة نطاق البرنامج مع دعوة التمويل.') + '<div class="venture-stack">'+proposals+'</div>'
        return page(lang,'funders.html','للجهات المانحة — أديب نور','مسارات بحثية قابلة للتمويل في قرارات الذكاء الاصطناعي والمعلوماتية الطبية والتعليم.','الجهات المانحة','موّل سؤالًا يمكن اختباره وقرارًا يمكن مساءلته.','ثلاثة اتجاهات مترابطة بأعمال منشورة أو قيد التطوير، مع فصل واضح بين السجل المؤكد وما يحتاج إلى تصميم مشترك. ',body,'ناقش مقترحًا')
    record = ''.join([
        card('Research record', '40+ peer-reviewed publications are represented in the current CV record; citation count and h-index remain dynamic and are delegated to Google Scholar.', p+'/academic-cv.html', 'Academic CV'),
        card('Research to application', 'The CV records KAUST TAQADAM venture support for precision medicine in 2016 and a FekraTech innovation award/grant for emergency-department optimization in 2017.', p+'/master-cv.html', 'Full CV'),
        card('Institutional scale', 'The CV reports program portfolios of approximately SAR 190M shaped or overseen; the figure is presented with its defined scope and source rather than as an independently audited financial claim.', p+'/executive-cv.html#metric-sources', 'Scope & source'),
    ])
    proposals = ''.join([
        card('1 · Auditing public-sector AI decisions', 'An extension of RIDI: measure who changes when the model changes, and connect ranking quality to the cost of changing the decision.', p+'/ideas/position.html#beyond-the-average', 'Conceptual basis'),
        card('2 · Knowledge completeness before clinical inference', 'An extension of D3, Anti-DDI and D4: test whether the knowledge base is complete enough before turning it into clinical inference or decision support.', p+'/research.html', 'Related research'),
        card('3 · Evidence of readiness in AI-enabled education', 'An extension of iSCARB and IMAM: move from polished output to evidence of judgment and readiness under changing conditions.', p+'/ideas/readiness-needs-evidence.html', 'Read the position'),
    ])
    body = section('For funders','Fund the question before the tool','The common thesis is simple: a score is not a decision. The research asks where identity, context and evidence are lost when metrics become decisions about people.') + '<div class="venture-stack">'+record+'</div>' + section('Ready for discussion','Three research programs to shape with the funder','Duration, team, budget and partners are intentionally not invented here; they are set after aligning a program with a specific funding call.') + '<div class="venture-stack">'+proposals+'</div>'
    return page(lang,'funders.html','For Funders — Adeeb Noor','Fundable research directions in AI decisions, biomedical knowledge and AI-enabled education.','Funders','Fund a testable question and an accountable decision.','Three research directions connected to an existing body of work, with a clear boundary between documented record and what still needs co-design.',body,'Discuss a proposal')


def build_students(lang):
    ar = lang == 'ar'; p='/ar' if ar else ''
    if ar:
        topics=''.join([card('من الذي يتغير؟','قياس أثر تحديث النماذج والترتيبات على الأشخاص أو العناصر التي يقع عليها القرار.'),card('ماذا تخفي المعرفة الناقصة؟','اكتمال المعرفة الطبية والتداخلات الدوائية قبل الاستدلال.'),card('ماذا تعني الفئة؟','تصميم الوظائف والتصنيف الذكي للقوى العاملة مع MIYAR.'),card('ما دليل الجاهزية؟','التعليم المدعوم بالذكاء الاصطناعي، والحكم، وأدلة القدرة مع iSCARB وIMAM.')])
        body=section('انضم إلى مسار بحثي','ابدأ بسؤال محدد، لا برسالة عامة','الملاءمة الأفضل لطلاب الحوسبة والبيانات والذكاء الاصطناعي والمعلوماتية الطبية وتقنيات التعليم ممن يستطيعون قراءة الأدبيات، العمل بالبيانات أو البرمجيات، وشرح منطقهم بوضوح.')+'<div class="venture-stack">'+topics+'</div>'+section('كيف تبدأ','ما الذي ترسله في أول تواصل','أرسل برنامجك ومرحلتك، سؤالًا أوليًا من 3–5 أسطر، المهارات أو الأدوات التي تتقنها، ورابطًا إلى عمل سابق إن وجد. لا ترسل بيانات مرضى أو مواد مؤسسية سرية.')+f'<div class="venture-stack">{card("القبول والتمويل","أي قبول رسمي أو تمويل أو تسجيل إشراف يتم حصريًا عبر أنظمة ولوائح الجامعة؛ صفحة الموقع ليست بوابة قبول.",p+"/contact.html#inquiry-form","ابدأ تواصلًا")}</div>'
        return page(lang,'students.html','للطلاب — أديب نور','موضوعات بحثية مفتوحة وطريقة بدء نقاش بحث أو إشراف مع أديب نور.','الطلاب','ابدأ بسؤال. ابنِ دليلًا على قدرتك.','هذه الصفحة توضّح اتجاهات البحث وطريقة بدء الحديث، ولا تمثل قبولًا أو وعدًا بالتمويل أو الإشراف.',body,'ابدأ تواصلًا')
    topics=''.join([card('Who changes?','Measure how model and ranking updates alter the people or items selected by a decision.'),card('What does missing knowledge hide?','Study biomedical knowledge completeness and drug interactions before inference.'),card('What does the category mean?','Workforce position design and AI-assisted classification with MIYAR.'),card('What counts as readiness?','AI-enabled education, judgment and evidence of capability with iSCARB and IMAM.')])
    body=section('Join a research path','Start with a specific question, not a generic request','Best fit includes students in computing, data, AI, biomedical informatics or education technology who can engage with literature, data or software and explain their reasoning clearly.')+'<div class="venture-stack">'+topics+'</div>'+section('How to approach','What to send in the first message','Include your program and stage, a 3–5 line initial question, the skills or tools you can use, and a link to prior work when available. Do not send patient data or confidential institutional material.')+f'<div class="venture-stack">{card("Admissions and funding","Formal admission, funding and supervision registration are handled only through university systems and policies; this site is not an admissions portal.",p+"/contact.html#inquiry-form","Start a conversation")}</div>'
    return page(lang,'students.html','For Students — Adeeb Noor','Open research directions and how to start a research or supervision conversation with Adeeb Noor.','Students','Start with a question. Build evidence of capability.','This page explains research directions and how to begin a conversation; it is not an offer of admission, funding or supervision.',body,'Start a conversation')


def build_academic(lang):
    ar=lang=='ar'; p='/ar' if ar else ''
    if ar:
        cards=''.join([card('البيان البحثي','أدرس ما يحدث عندما تتحول الدرجة أو الفئة أو الترتيب إلى قرار يمس الناس. يربط البرنامج بين ذكاء القرار، تقييم الذكاء الاصطناعي، المعلوماتية الطبية، الصحة الرقمية، والتعليم.',p+'/research.html','البرنامج البحثي'),card('البيان التدريسي','أبني التدريس حول الحكم القابل للدفاع عنه: سؤال واضح، دليل يمكن فحصه، حدود معلنة، ومخرجات يستطيع الطالب تفسيرها لا مجرد إنتاجها.',p+'/teaching.html','التدريس وiSCARB'),card('السجل العلمي','يتضمن سجل السيرة الحالي أكثر من 40 ورقة محكّمة. تُترك الاستشهادات وh-index ديناميكية ويُرجع فيها مباشرة إلى Google Scholar.','https://scholar.google.com/citations?user=XUQD1WAAAAAJ','Google Scholar'),card('الخلفية والتعاون','دكتوراه وماجستير من University of Colorado Boulder، وسجل تعاون وزيارة أكاديمية مع KAUST، إضافة إلى العمل الحالي في جامعة الملك عبدالعزيز.',p+'/academic-cv.html','السيرة الأكاديمية')])
        body=section('للجامعات','برنامج بحثي واحد عبر مجالات متعددة','أربع أسئلة تربط الأعمال: من الذي يتغير؟ من يحدد السعة؟ ماذا تعني الفئة؟ وما دليل الجاهزية؟')+'<div class="venture-stack">'+cards+'</div>'+section('التعاون','أين يمكن أن نعمل معًا','أرحب بالمشاريع المشتركة، وإعادة الاختبار المستقل، والإشراف المشترك، وزيارات البحث أو التدريس عندما يكون السؤال والمسؤوليات ومخرجات الدليل محددة.')
        return page(lang,'academic.html','التعاون الأكاديمي — أديب نور','بيان بحثي وتدريسي مختصر وسجل أكاديمي ومسارات تعاون دولي.','التعاون الأكاديمي','برنامج بحثي عن الفجوة بين القياس والقرار.','للجامعات والباحثين الذين يبحثون عن تعاون في الذكاء الاصطناعي والمعلوماتية الطبية والصحة الرقمية والتعليم.',body,'ناقش تعاونًا أكاديميًا')
    cards=''.join([card('Research statement','I study what happens when a score, category or ranking becomes a decision about people. The program connects decision intelligence, AI evaluation, biomedical informatics, digital health and education.',p+'/research.html','Research agenda'),card('Teaching statement','I design teaching around defensible judgment: a clear question, inspectable evidence, stated limits and outputs students can explain rather than merely produce.',p+'/teaching.html','Teaching & iSCARB'),card('Research record','The current CV record includes 40+ peer-reviewed publications. Citation count and h-index are kept dynamic and delegated directly to Google Scholar.','https://scholar.google.com/citations?user=XUQD1WAAAAAJ','Google Scholar'),card('Background and collaboration','PhD and MS from the University of Colorado Boulder, a visiting/collaborative record with KAUST, and current work at King Abdulaziz University.',p+'/academic-cv.html','Academic CV')])
    body=section('For universities','One research program across multiple domains','Four questions connect the work: who changes, who sets capacity, what does the category mean, and what counts as evidence of readiness?')+'<div class="venture-stack">'+cards+'</div>'+section('Collaboration','Where we could work together','I welcome joint projects, independent replication, co-supervision and research or teaching visits when the question, responsibilities and evidence outputs are explicit.')
    return page(lang,'academic.html','Academic Collaboration — Adeeb Noor','Concise research and teaching statements, academic record and routes for international collaboration.','Academic collaboration','A research program about the gap between measurement and decision.','For universities and researchers seeking collaboration across AI, biomedical informatics, digital health and education.',body,'Discuss academic collaboration')


def build_press(lang):
    ar=lang=='ar'; p='/ar' if ar else ''
    if ar:
        bios=''.join([card('تعريف قصير','أديب نور أستاذ علوم البيانات والذكاء الاصطناعي في جامعة الملك عبدالعزيز. يدرس ما يحدث عندما تتحول المقاييس إلى قرارات تمس الناس، ويعمل عبر الذكاء الاصطناعي والصحة والتعليم والمؤسسات العامة.'),card('تعريف متوسط','أديب نور أستاذ علوم البيانات والذكاء الاصطناعي في جامعة الملك عبدالعزيز. يجمع عمله بين البحث والقيادة المؤسسية وبناء الأنظمة، مع تركيز على سؤال واحد: ماذا يحدث عندما تتحول الدرجة أو الفئة أو الترتيب إلى قرار يمس الناس؟ تشمل أعماله ذكاء القرار، المعلوماتية الطبية، الصحة الرقمية، تخطيط القوى العاملة، والذكاء الاصطناعي في التعليم. بنى وقاد مبادرات في الجامعة ووزارة التعليم والقطاع الصحي، ويطوّر أدوات تجعل الدليل والحدود وآثار القرار أكثر قابلية للفحص والمساءلة.'),card('تعريف مطوّل','أديب نور أستاذ علوم البيانات والذكاء الاصطناعي في جامعة الملك عبدالعزيز، وباحث وقائد عمل عبر الحكومة والتعليم العالي والصحة. يمتد سجله لأكثر من 18 عامًا ويجمع بين البحث في الذكاء الاصطناعي والمعلوماتية الطبية وبين بناء أنظمة ونماذج تشغيل تدعم قرارات مؤسسية حقيقية. أطروحته العامة هي أن «الرقم ليس قرارًا»: فالمتوسط أو الدرجة قد يخفيان من يتغير، ومن يحدد السعة، وما الذي تعنيه الفئة، وما إذا كان الناتج دليلًا على الجاهزية أصلًا. تظهر هذه الأسئلة في RIDI لقرارات الترتيب، وأبحاث التداخلات الدوائية واكتمال المعرفة، وMIYAR لبنية القوى العاملة، وiSCARB وIMAM للتعليم المدعوم بالذكاء الاصطناعي. إلى جانب البحث، شغل أدوارًا استشارية وتنفيذية في وزارة التعليم وجامعة الملك عبدالعزيز وقطاع الصحة الرقمية. يركز في أعماله الحالية على جعل القرارات المدعومة بالذكاء الاصطناعي أكثر وضوحًا وقابلية للفحص والمساءلة.')])
        assets=''.join([card('موضوعات مقترحة للمحاضرات','ما يخفيه الرقم؛ عندما يصبح التقييم قرارًا؛ اكتمال المعرفة قبل الاستدلال؛ ما الذي يعد دليلًا على الجاهزية في عصر الذكاء الاصطناعي.',p+'/speaking.html','المحاضرات'),card('صور ومواد إعلامية','ستُضاف صورة رسمية عالية الدقة هنا عند اعتماد ملف مستقل مناسب للنشر. إلى ذلك الحين يمكن طلب المواد الإعلامية عبر نموذج التواصل.',p+'/contact.html#inquiry-form','اطلب المواد')])
        body=section('للإعلام والمنظمين','تعريف جاهز بثلاثة أطوال','يمكن استخدام النص المناسب مع الإبقاء على الصفة المهنية والأطروحة كما هي.')+'<div class="venture-stack">'+bios+'</div>'+section('المحاضرات والمواد','ابدأ من الأطروحة','تُصاغ الموضوعات حول الفجوة بين المقياس والقرار، مع تخصيص الأمثلة للجمهور.')+'<div class="venture-stack">'+assets+'</div>'
        return page(lang,'press.html','الملف الإعلامي — أديب نور','تعريفات إعلامية وموضوعات محاضرات ومواد للمنظمين والصحافة.','الملف الإعلامي','الرقم ليس قرارًا. هذه هي نقطة البداية.','تعريفات جاهزة للاستخدام وروابط تساعد منظمي الفعاليات والصحفيين على تقديم العمل بدقة.',body,'دعوة لمحاضرة أو مقابلة')
    bios=''.join([card('Short bio','Adeeb Noor is Professor of Data Science & AI at King Abdulaziz University. He studies what happens when metrics become decisions about people, working across AI, healthcare, education and public institutions.'),card('Medium bio','Adeeb Noor is Professor of Data Science & AI at King Abdulaziz University. His work combines research, institutional leadership and system building around one recurring question: what happens when a score, category or ranking becomes a decision about people? His work spans decision intelligence, biomedical informatics, digital health, workforce planning and AI-enabled education. He has built and led initiatives across university, Ministry of Education and healthcare settings, and develops tools that make evidence, limits and decision consequences easier to inspect and hold accountable.'),card('Extended bio','Adeeb Noor is Professor of Data Science & AI at King Abdulaziz University, a researcher and institutional leader with more than 18 years across government, higher education and healthcare. His work connects AI and biomedical-informatics research with systems and operating models used to support real institutional decisions. His public thesis is that “a score is not a decision”: an average or score can hide who changes, who sets capacity, what a category actually means, and whether an output is evidence of readiness at all. These questions appear in RIDI for ranking decisions, research on drug interactions and biomedical knowledge completeness, MIYAR for workforce architecture, and iSCARB and IMAM for AI-enabled education. Alongside research, he has held advisory and executive roles with the Ministry of Education, King Abdulaziz University and digital-health initiatives. His current focus is on making AI-supported decisions more transparent, inspectable and accountable.')])
    assets=''.join([card('Suggested talk themes','What the Score Hides; When Evaluation Becomes a Decision; Knowledge Completeness Before Inference; What Counts as Evidence of Readiness in the AI Era.',p+'/speaking.html','Speaking'),card('Photography and media assets','A publication-ready high-resolution official portrait will be added when an approved standalone image is supplied. Until then, media materials can be requested through the contact form.',p+'/contact.html#inquiry-form','Request materials')])
    body=section('For media and organizers','Ready-to-use bios at three lengths','Use the version that fits your format while keeping the professional title and core thesis intact.')+'<div class="venture-stack">'+bios+'</div>'+section('Speaking and assets','Start with the thesis','Talk themes are framed around the gap between measurement and decision, with examples adapted to the audience.')+'<div class="venture-stack">'+assets+'</div>'
    return page(lang,'press.html','Press & Speaker Bio — Adeeb Noor','Media bios, talk themes and organizer resources for Adeeb Noor.','Press & speaker bio','A score is not a decision. That is the starting point.','Ready-to-use bios and links for journalists, podcast hosts and event organizers.',body,'Invite me to speak')


def patch_contact():
    options = {
        'en': '<option value="">Please select</option><option value="institution">Funder / grantmaker</option><option value="company">Investor / venture partner</option><option value="researcher">University / academic institution</option><option value="student">Student</option><option value="researcher">Researcher / collaborator</option><option value="institution">Government / institution</option>',
        'ar': '<option value="">يرجى الاختيار</option><option value="institution">جهة مانحة</option><option value="company">مستثمر / شريك مشروع</option><option value="researcher">جامعة / جهة أكاديمية</option><option value="student">طالب</option><option value="researcher">باحث / متعاون</option><option value="institution">جهة حكومية / مؤسسة</option>'
    }
    for lang, rel in [('en','contact.html'),('ar','ar/contact.html')]:
        path=ROOT/rel; source=path.read_text()
        source,count=re.subn(r'(<select id="inquiry-audience" name="audience" required>).*?(</select>)',lambda m:m[1]+options[lang]+m[2],source,count=1,flags=re.S)
        if count!=1: raise ValueError(f'{rel}: inquiry audience select missing')
        path.write_text(source)


def add_sitemap():
    path=ROOT/'sitemap.xml'; source=path.read_text(); entries=[]
    for name in PAGES:
        for ar in (False,True):
            loc=ORIGIN.rstrip('/')+('/ar/' if ar else '/')+name
            if f'<loc>{loc}</loc>' in source: continue
            alt=''.join(f'<xhtml:link rel="alternate" hreflang="{lang}" href="{ORIGIN.rstrip("/")+prefix+name}"/>' for lang,prefix in [('en','/'),('ar','/ar/')])
            entries.append(f'<url><loc>{loc}</loc>{alt}</url>')
    source=source.replace('</urlset>',''.join(entries)+'</urlset>')
    path.write_text(source)


def main():
    builders={'funders.html':build_funders,'students.html':build_students,'academic.html':build_academic,'press.html':build_press}
    for name,builder in builders.items():
        (ROOT/name).write_text(builder('en'))
        target=ROOT/'ar'/name; target.parent.mkdir(parents=True,exist_ok=True); target.write_text(builder('ar'))
    patch_contact(); add_sitemap()
    print('Generated four bilingual audience pages, six homepage audience routes and aligned inquiry choices.')


if __name__=='__main__':
    main()
