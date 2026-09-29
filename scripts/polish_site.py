"""Final design pass: load polish.css everywhere and tune the homepage flow.

Runs last in build_site.py. Every change is marker-delimited and removed before
it is re-applied, so repeated builds converge on identical output.
"""
from pathlib import Path
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP = ('kinetic-hr/', 'SulTaN/', 'healthx/', 'ar/healthx/')
CSS_VERSION = hashlib.sha256((ROOT/'polish.css').read_bytes()).hexdigest()[:10]
CSS_BLOCK = re.compile(r'<!-- polish:css:start -->.*?<!-- polish:css:end -->', re.S)
CTA_BLOCK = re.compile(r'<!-- polish:cta:start -->.*?<!-- polish:cta:end -->', re.S)
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


SAVINGS = {
    'en': '<div class="stat"><b>~SAR 11.3M</b><p>Reported year-one savings from ML-supported workforce analysis</p><a href="/engagements.html#national-workforce">Case &amp; caveats →</a></div>',
    'ar': '<div class="stat"><b>~11.3 مليون ريال</b><p>وفورات مُعلنة في السنة الأولى من تحليل القوى العاملة المدعوم بالتعلّم الآلي</p><a href="/ar/engagements.html#national-workforce">الحالة والتحفظات ←</a></div>',
}


def polish_home(source, lang):
    source = CTA_BLOCK.sub('', source)
    # "49 districts" restates the 540,000-educator programme; show its reported outcome instead.
    source = re.sub(r'<div class="stat"><b>49</b>.*?</div>', lambda m: SAVINGS[lang], source, count=1, flags=re.S)
    services = SERVICES.search(source)
    anchor = '<!-- expertise-map:end -->'
    if services and anchor in source:
        # Lead with how to engage, right after the four capabilities.
        source = source[:services.start()] + source[services.end():]
        source = source.replace(anchor, anchor + services[0], 1)
    return source.replace('</main>', cta(lang) + '</main>', 1)


changed = 0
for path in sorted(ROOT.rglob('*.html')):
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith(SKIP) or rel.startswith('.git/'):
        continue
    original = path.read_text(encoding='utf-8')
    if 'site-nav.css' not in original or '</head>' not in original:
        continue
    source = CSS_BLOCK.sub('', original)
    source = source.replace('</head>', f'<!-- polish:css:start --><link rel="stylesheet" href="/polish.css?v={CSS_VERSION}"><!-- polish:css:end --></head>', 1)
    if rel in ('index.html', 'ar/index.html'):
        source = polish_home(source, 'ar' if rel.startswith('ar/') else 'en')
    if source != original:
        path.write_text(source, encoding='utf-8')
        changed += 1
print(f'Applied design polish to {changed} pages.')
