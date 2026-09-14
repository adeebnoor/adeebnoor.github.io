"""Apply the focused September 14 audit follow-up to generator sources.

Safe to re-run: exact old targets are replaced once; known new targets are
accepted. Publication timestamps and essay bodies are never modified here.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]


def replace_once(path, old, new):
    file=ROOT/path
    source=file.read_text()
    if new in source:
        return
    if source.count(old)!=1:
        raise ValueError(f'{path}: expected one known patch target')
    file.write_text(source.replace(old,new,1))

p=ROOT/'data/ideas-content.json'
d=json.loads(p.read_text())
d['cadence']={
 'en': 'Each essay displays its first recorded date on this site, with the date of its current edition shown in the article. First-recorded dates come from the public repository history. I aim to publish one substantial essay every two months and explain substantive revisions.',
 'ar': 'يعرض كل مقال تاريخ أول ظهور مسجّل له على هذا الموقع، ويظهر تاريخ نسخته الحالية داخل المقال. تستند تواريخ أول ظهور إلى سجل المستودع العام. أستهدف نشر مقال متعمّق كل شهرين مع توضيح التعديلات الجوهرية.'
}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
replace_once('scripts/build_ideas.py',
 'from localize_site import finish',
 'from localize_site import finish\nfrom essay_dates import date_badge')
replace_once('scripts/build_ideas.py',
 "+t(article['theme'],lang)+'</div><h3>'",
 "+t(article['theme'],lang)+'</div>'+date_badge(article,lang)+'<h3>'")
replace_once('scripts/build_ideas.py',
 "link('/impact.html','القيادة والأثر' if lang=='ar' else 'Executive',lang,''),",
 "link('/impact.html','القيادة والأثر' if lang=='ar' else 'Leadership',lang,''),")
old="""            if page=='contact.html':
                source=add_to_main(source,'intake',services(lang)+inquiry_form(lang),True)"""
new="""            if page=='contact.html':
                # Put the real form before the five service cards.
                source=add_to_main(source,'intake',inquiry_form(lang)+services(lang),True)
                actions='<div class="hero-actions"><a class="primary" href="#inquiry-form">'+text('Open inquiry form','افتح نموذج التواصل',lang)+'</a><a href="mailto:'+IDENTITY['institutional_email']+'">'+text('Email instead','البريد بديلًا',lang)+'</a></div>'
                source,count=re.subn(r'(<section class="page-hero">.*?)<div class="hero-actions">.*?</div>',lambda m:m[1]+actions,source,count=1,flags=re.S)
                if count!=1: raise ValueError('Contact hero action target missing')"""
replace_once('scripts/build_audit.py',old,new)
replace_once('scripts/build_audit.py',"VERSION = '20260914-audit1'","VERSION = '20260914-audit2'")
p=ROOT/'i18n/ar/research.json'
d=json.loads(p.read_text());d['contact.html']['text'].update({'Open inquiry form':'افتح نموذج التواصل','Email instead':'البريد بديلًا'})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
replace_once('scripts/validate_audit.py',
 "print('Validated seven paired projects",
 "import validate_followup\nprint('Validated seven paired projects")
print('Patched the shared archive generator, current cadence, footer labels and Contact form discovery.')
