"""Render current project details in both languages from the shared project record.

Run after localization; preserve historical research titles and legacy anchors.
Current iSCARB/IMAM hierarchy is identical on project, teaching and CV pages.
"""
from pathlib import Path
from html import escape
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = {p['id']: p for p in json.loads((ROOT/'data/featured-projects.json').read_text())}
PAPER = 'https://zenodo.org/records/22964248'
CPIT = 'https://adeebnoor.github.io/CPIT/'

COPY = {
 'en': {
  'miyar': ('From strategy to an approved workforce decision.', [
   'MI’YĀR connects strategy, organizational design, job evaluation, workforce planning, compensation and approval. Developed with Ahmad Raza Khan, it makes assumptions, role responsibilities and review steps visible across the workflow.',
   'Release 6.0 starts from one sentence: describe the goal or problem and MI’YĀR suggests a reviewable role reference and the next action. It adds two-step sign-in, an isolated demo organization and a guided ten-minute tour.',
   'The public prototype supports exploration and evaluation. Institutional pilots should validate data, approval rules and integration needs in their own setting.'
  ], [('Strategy & structure', 'Translate strategic intent into organization and job architecture.'), ('Scenarios & cost', 'Explore workforce plans, job evaluation and compensation assumptions.'), ('Review & approval', 'Carry the evidence and responsibilities into an explicit approval workflow.')]),
  'kamin': ('Understand your capabilities. Explain your next step.', [
   'Kamin connects a student’s interests, goals and reviewed academic evidence in a capability network. Its user-controlled profile explains how learning and career pathways relate to the person, where evidence is missing and what to explore next.',
   'Kamin 1.0 is a public release built around an evidence-backed capability network: every relation shows its source, and transcripts are read in the browser rather than sent to a server. Current pathways are reference examples; recommendation quality is an active validation question.'
  ], [('Start with the person', 'Connect interests and goals with the evidence the student chooses to add.'), ('Explain the connection', 'Inspect the sources and relationships behind a suggested pathway.'), ('Own the next step', 'Review the profile and turn evidence gaps into a learning plan.')]),
  'iscarbTitle': 'iSCARB — defensible engineering judgment',
  'iscarbBody': 'When AI can generate an answer, students still need to explain why it is justified and when it stops being justified. iSCARB is implemented across nine software-engineering chapters and assignments, connecting a choice to its assumptions, boundaries, action and evidence. From Chapter 12, story-led lectures turn each chapter into a decision case, supported by executable labs, a two-minute ownership check and an AI study coach: AI is the practice layer, and engineering judgment is what is assessed.',
  'iscarbMethod': 'FIT · BOUND · ACT · EVIDENCE, followed by STRESS and REFIT: change a constraint, then retain or revise the decision. Commitment before disclosure, declared AI use and sampled oral verification keep ownership with the learner.',
  'imamTitle': 'IMAM within iSCARB',
  'imamBody': 'IMAM is the optional Saudi and Islamic contextualization layer within iSCARB. It connects relevant context, values and purpose to the same evidence and technical-fidelity requirements. It is presented as part of this teaching program.',
  'alignment': 'The teaching design includes NELC alignment and a proposed Jaheziah readiness mapping for review and piloting.',
  'paperStatus': 'Open preprint · 25 September 2026 · Not peer reviewed. The implementation is available to inspect; learning effectiveness remains a research question.',
  'hub': 'Explore iSCARB', 'paper': 'Read the open preprint', 'method': 'Method & evidence', 'alignmentLink': 'Read the alignment note',
  'ridiBody': 'RIDI is the research project behind the manuscript “Equal evaluation scores do not certify equivalent AI behaviour”, with an open toolkit (ridi-audit) for selection-change auditing and the exact identity–utility frontier. It asks how systems can retain aggregate performance while changing their actions, and how much change an explicit objective actually requires.',
  'ridiStatus': 'The manuscript is submission-ready and not peer reviewed. Source data and a reproducibility package are open on Zenodo (CC BY 4.0); code, demonstrations and research records are linked separately from publication claims.',
  'ridiLink': 'Explore RIDI', 'ridiProject': 'RIDI on GitHub', 'ridiData': 'Open data (Zenodo)', 'background': 'Research context', 'contact': 'Discuss a pilot',
  'cvHeading': 'Current systems & research · October 2026',
  'cvResearch': 'Submission-ready manuscript (not peer reviewed): Equal evaluation scores do not certify equivalent AI behaviour, with open source data on Zenodo (DOI 10.5281/zenodo.22974727). I examine action identity, evidence and the distinction between observed and necessary change.',
  'cvIsCarb': 'iSCARB integrates IMAM as an optional contextualization layer. Current implementation spans nine software-engineering chapters, with story-led lectures from Chapter 12, executable labs and an open preprint.',
  'imamRole': 'Founder & Lead Architect — IMAM, now within iSCARB',
  'translation': 'GenomeFit, iSCARB including IMAM, Kamin, MI’YĀR, HEALTHx, SHIFAA, LEDD and research-to-market operating models.',
 },
 'ar': {
  'miyar': ('من الاستراتيجية إلى قرار معتمد للقوى العاملة.', [
   'يربط معيار الاستراتيجية بالتصميم التنظيمي وتقييم الوظائف وتخطيط القوى العاملة والتعويضات والاعتماد. طُوّر بالتعاون مع أحمد رضا خان، ويُظهر الافتراضات ومسؤوليات الوظائف وخطوات المراجعة عبر مسار العمل.',
   'يبدأ الإصدار 6.0 من جملة واحدة: صِف الهدف أو المشكلة، فيقترح معيار مرجعًا وظيفيًا قابلًا للمراجعة والإجراء التالي. ويضيف التحقق بخطوتين ومؤسسة تجريبية معزولة وجولة موجّهة في عشر دقائق.',
   'تتيح النسخة الأولية العامة الاستكشاف والتقييم. وتحتاج التجارب المؤسسية إلى التحقق من البيانات وقواعد الاعتماد ومتطلبات التكامل في بيئتها الفعلية.'
  ], [('الاستراتيجية والهيكل', 'ترجمة التوجه الاستراتيجي إلى تصميم تنظيمي وهندسة وظائف.'), ('السيناريوهات والتكلفة', 'استكشاف خطط القوى العاملة وتقييم الوظائف وافتراضات التعويضات.'), ('المراجعة والاعتماد', 'نقل الأدلة والمسؤوليات إلى مسار اعتماد واضح.')]),
  'kamin': ('افهم قدراتك. واعرف سبب خطوتك القادمة.', [
   'يربط كامن اهتمامات الطالب وأهدافه وأدلته الأكاديمية التي راجعها في شبكة قدرات. ويوضح ملف يتحكم فيه المستخدم علاقة مسارات التعلم والعمل بالشخص، وأين تنقص الأدلة، وما الخطوة التي يمكن استكشافها.',
   'كامن 1.0 إصدار عام مبني على شبكة قدرات مدعومة بالأدلة: لكل علاقة مصدر ظاهر، ويُقرأ السجل الأكاديمي داخل المتصفح دون إرساله إلى خادم. المسارات الحالية أمثلة مرجعية، وجودة التوصيات موضوع للتحقق البحثي.'
  ], [('البداية من الشخص', 'ربط الاهتمامات والأهداف بالأدلة التي يختار الطالب إضافتها.'), ('تفسير العلاقة', 'فحص المصادر والعلاقات وراء المسار المقترح.'), ('امتلاك الخطوة التالية', 'مراجعة الملف وتحويل فجوات الأدلة إلى خطة تعلم.')]),
  'iscarbTitle': 'iSCARB — حكم هندسي يمكن الدفاع عنه',
  'iscarbBody': 'عندما يستطيع الذكاء الاصطناعي توليد إجابة، يبقى على الطالب تفسير سبب صلاحيتها ومتى تتوقف عن الصلاحية. يُطبّق iSCARB في تسعة فصول وتكليفات لهندسة البرمجيات، ويربط الخيار بافتراضاته وحدوده وإجراءاته وأدلته. ومن الفصل الثاني عشر، تحوّل المحاضرات القصصية كل فصل إلى حالة قرار، تدعمها معامل تطبيقية قابلة للتشغيل وتحقق من ملكية العمل في دقيقتين ومدرّب دراسة بالذكاء الاصطناعي: الذكاء الاصطناعي للتدريب، والحكم الهندسي هو ما يُقيَّم.',
  'iscarbMethod': 'الملاءمة والحدود والإجراء والدليل، ثم اختبار الضغط وإعادة الملاءمة: يتغير قيد، فيُبقي الطالب قراره أو يراجعه. ويساعد تثبيت موقف الطالب قبل كشف الإجابة، والإفصاح عن استخدام الذكاء الاصطناعي، والتحقق الشفهي بالعينة على إبقاء مسؤولية الحكم لدى المتعلم.',
  'imamTitle': 'IMAM ضمن iSCARB',
  'imamBody': 'يمثل IMAM طبقة اختيارية للسياق السعودي والإسلامي ضمن iSCARB. يربط السياق والقيم والغاية ذات الصلة بالمتطلبات نفسها للأدلة والأمانة التقنية، ويُعرض جزءًا من هذا البرنامج التعليمي.',
  'alignment': 'يتضمن التصميم التعليمي مواءمة مع إطار المركز الوطني للتعليم الإلكتروني وخريطة مقترحة للجاهزية، مطروحتين للمراجعة والتجريب.',
  'paperStatus': 'ورقة أولية مفتوحة · 25 سبتمبر 2026 · غير محكّمة. التطبيق متاح للفحص، وفعاليته التعليمية موضوع للبحث.',
  'hub': 'استكشف iSCARB', 'paper': 'اقرأ الورقة الأولية', 'method': 'المنهجية والأدلة', 'alignmentLink': 'اقرأ مذكرة المواءمة',
  'ridiBody': 'RIDI هو المشروع البحثي وراء مخطوطة «تساوي درجات التقييم لا يضمن تكافؤ سلوك أنظمة الذكاء الاصطناعي»، ومعه أداة مفتوحة (ridi-audit) لتدقيق تغيّر الاختيارات وحساب جبهة الهوية–المنفعة الدقيقة. يسأل: كيف تحافظ الأنظمة على أدائها الإجمالي بينما تتغير أفعالها، وما مقدار التغيير الذي يتطلبه هدف معلن فعلًا؟',
  'ridiStatus': 'المخطوطة جاهزة للتقديم وغير محكّمة. بيانات المصدر وحزمة إعادة الإنتاج متاحة مفتوحة على Zenodo (CC BY 4.0)، وتُعرض الشفرة والعروض والموارد البحثية مع تمييزها عن حالة النشر العلمي.',
  'ridiLink': 'استكشف RIDI', 'ridiProject': 'RIDI على GitHub', 'ridiData': 'البيانات المفتوحة (Zenodo)', 'background': 'السياق البحثي', 'contact': 'ناقش تجربة أولية',
  'cvHeading': 'الأنظمة والأبحاث الحالية · أكتوبر 2026',
  'cvResearch': 'مخطوطة جاهزة للتقديم (غير محكّمة): تساوي درجات التقييم لا يضمن تكافؤ سلوك أنظمة الذكاء الاصطناعي، مع بيانات مصدر مفتوحة على Zenodo (DOI 10.5281/zenodo.22974727). أدرس هوية الأفعال وأدلتها والتمييز بين التغيير المرصود والتغيير الضروري.',
  'cvIsCarb': 'يضم iSCARB طبقة IMAM الاختيارية للسياق. يشمل التطبيق الحالي تسعة فصول لهندسة البرمجيات، مع محاضرات قصصية من الفصل الثاني عشر ومعامل تطبيقية وورقة أولية مفتوحة.',
  'imamRole': 'المؤسس ورئيس التصميم المعماري — IMAM، ضمن iSCARB حاليًا',
  'translation': 'GenomeFit وiSCARB الذي يضم IMAM وكامن ومعيار وHEALTHx وSHIFAA وLEDD ونماذج تشغيل لنقل الأبحاث إلى السوق.',
 }
}

def a(url, label, primary=False):
    external = url.startswith('https://')
    attrs = ' target="_blank" rel="noopener noreferrer"' if external else ''
    return f'<a class="{"primary" if primary else "go-link"}" href="{escape(url,quote=True)}"{attrs}>{escape(label)}</a>'

def paras(items):
    return ''.join('<p>'+escape(p)+'</p>' for p in items)

def replace_card(source, card_id, markup):
    pattern = r'<article\b[^>]*\bid="'+re.escape(card_id)+r'"[^>]*>.*?</article>'
    source, count = re.subn(pattern, lambda _: markup, source, count=1, flags=re.S)
    if count != 1:
        raise ValueError('Missing card: '+card_id)
    return source

def venture(pid, lang):
    p, c = PROJECTS[pid], COPY[lang]
    heading, body, proofs = c[pid]
    proof = ''.join('<div class="proof"><b>'+escape(h)+'</b><span>'+escape(t)+'</span></div>' for h,t in proofs)
    prefix = '/ar' if lang == 'ar' else ''
    links = a(p['liveUrl'][lang], p[lang]['liveCta'], True)+a(prefix+'/contact.html#organizations', c['contact'])
    return f'<article class="venture-card" id="{pid}"><div class="venture-mark"><div class="vtype">{escape(p[lang]["domain"])}</div><h2>{escape(p[lang]["name"])}</h2></div><div class="venture-body"><div class="mini">{escape(p[lang]["stage"])}</div><h3>{escape(heading)}</h3>{paras(body)}<div class="proof-grid">{proof}</div><div class="venture-links">{links}</div></div></article>'

for lang in ('en', 'ar'):
    c = COPY[lang]
    prefix = 'ar/' if lang == 'ar' else ''
    public = '/ar' if lang == 'ar' else ''
    p = ROOT/(prefix+'ventures.html'); s = p.read_text()
    s = re.sub(r'<!-- ideas-project:start -->.*?<!-- ideas-project:end -->', '', s, flags=re.S)
    s = re.sub(r'<article\b[^>]*\bid="imam"[^>]*>.*?</article>', '', s, flags=re.S)
    s = replace_card(s, 'miyar', venture('miyar', lang))
    if 'id="kamin"' in s:
        s = replace_card(s, 'kamin', venture('kamin', lang))
    else:
        s = s.replace('<section class="venture-stack">', '<section class="venture-stack">'+venture('kamin', lang), 1)
    iscarb = '<article class="theme-card" id="iscarb-project"><div class="theme-no">iSCARB</div><h2>'+escape(c['iscarbTitle'])+'</h2>'+paras([c['iscarbBody']])+'<h3 id="imam">'+escape(c['imamTitle'])+'</h3>'+paras([c['imamBody'], c['paperStatus']])+'<div class="venture-links">'+a(CPIT+'iscarb.html', c['hub'], True)+a(PAPER,c['paper'])+'</div></article>'
    s = replace_card(s, 'iscarb-project', iscarb)
    ridi = '<article class="theme-card" id="ridi-system"><div class="theme-no">RIDI</div><h2>RIDI</h2>'+paras([c['ridiBody'], c['ridiStatus']])+'<div class="venture-links">'+a('https://github.com/adeebnoor/ridi',c['ridiProject'],True)+a(public+'/demo/',c['ridiLink'])+a('https://zenodo.org/records/22974727',c['ridiData'])+a(public+'/research.html#ridi',c['background'])+'</div></article>'
    p.write_text(replace_card(s, 'ridi-system', ridi))

    p = ROOT/(prefix+'teaching.html'); s = p.read_text()
    card = '<article class="theme-card" id="iscarb"><div class="theme-no">iSCARB</div><h2>'+escape(c['iscarbTitle'])+'</h2>'+paras([c['iscarbBody'],c['iscarbMethod'],c['paperStatus']])+'<div class="venture-links">'+a(CPIT+'iscarb.html',c['hub'],True)+a(PAPER,c['paper'])+a(CPIT+'methodology.html',c['method'])+'</div></article>'
    s = replace_card(s, 'iscarb', card)
    imam = '<article class="theme-card" id="imam"><div class="theme-no">IMAM · iSCARB</div><h2>'+escape(c['imamTitle'])+'</h2>'+paras([c['imamBody'],c['alignment']])+'<div class="venture-links">'+a(CPIT+'nelc-alignment.html',c['alignmentLink'])+'</div></article>'
    if 'id="imam"' in s:
        s = replace_card(s,'imam',imam)
    else:
        s,n = re.subn(r'<article class="theme-card"><div class="theme-no">R&amp;D · 03</div>.*?</article>',lambda _:imam,s,count=1,flags=re.S)
        if n != 1:
            # Localization translates the R&D label; the stable legacy title identifies the card.
            s,n = re.subn(r'<article class="theme-card">(?:(?!</article>).)*<h2>CIMT [^<]*iSCARB</h2>.*?</article>',lambda _:imam,s,count=1,flags=re.S)
        if n != 1: raise ValueError('Missing IMAM teaching context: '+lang)
    p.write_text(s)

    # The curated CV layout is intentional. Add a single current record instead
    # of rebuilding it with the older generic CV template.
    for page in ('academic-cv.html','executive-cv.html'):
        p=ROOT/(prefix+page); s=p.read_text()
        s=re.sub(r'<!-- current-cv:start -->.*?<!-- current-cv:end -->','',s,flags=re.S)
        # Keep historical job titles; explain the current relationship beneath them.
        s=re.sub(r'<h3>[^<]*IMAM[^<]*</h3><ul>.*?</ul>',lambda _:'<h3>'+escape(c['imamRole'])+'</h3><ul><li>'+escape(c['imamBody'])+'</li></ul>',s,flags=re.S)
        s=re.sub(r'<div class="cv-box"><b>(?:IMAM GenAI|CIMT [^<]*iSCARB|iSCARB)</b><span>.*?</span></div>',lambda _:'<div class="cv-box"><b>iSCARB</b><span>'+escape(c['cvIsCarb'])+'</span></div>',s,flags=re.S)
        s=re.sub(r'<h3>(?:CIMT [^<]*iSCARB|iSCARB)</h3><p>.*?</p>',lambda _:'<h3>iSCARB</h3>'+paras([c['cvIsCarb']]),s,flags=re.S)
        s=re.sub(r'<div class="cv-box"><b>RIDI</b><span>.*?</span></div>',lambda _:'<div class="cv-box"><b>RIDI</b><span>'+escape(c['ridiBody'])+'</span></div>',s,flags=re.S)
        boxes=''.join('<div class="cv-box"><b>'+escape(PROJECTS[pid][lang]['name'])+'</b><span>'+escape(PROJECTS[pid][lang]['description'])+'</span>'+a(PROJECTS[pid]['liveUrl'][lang],PROJECTS[pid][lang]['liveCta'])+'</div>' for pid in ('miyar','kamin'))
        block='<!-- current-cv:start --><section class="cv-section"><h2>'+escape(c['cvHeading'])+'</h2>'+paras([c['cvResearch'],c['cvIsCarb']])+'<div class="cv-grid">'+boxes+'</div>'+a(PAPER,c['paper'])+'</section><!-- current-cv:end -->'
        s=s.replace('</article></main>', block+'</article></main>',1)
        if '<!-- current-cv:start -->' not in s:
            s=s.replace('</article>',block+'</article>',1)
        if '<!-- current-cv:start -->' not in s: raise ValueError('Missing CV sheet: '+page)
        p.write_text(s)

    p=ROOT/(prefix+'about.html'); s=p.read_text()
    s=re.sub(r'<h3>[^<]*IMAM[^<]*</h3><p>.*?</p>',lambda _:'<h3>'+escape(c['imamRole'])+'</h3>'+paras([c['imamBody']]),s,flags=re.S)
    s=re.sub(r'<span>GenomeFit[^<]*IMAM[^<]*</span>',lambda _:'<span>'+escape(c['translation'])+'</span>',s)
    p.write_text(s)

print('Updated bilingual project, teaching and current CV records from shared project data.')
