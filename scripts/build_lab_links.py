"""Connect the bilingual Adeeb Lab page (/lab/) to the personal site.

Idempotent and marker-delimited, like the other build steps:
- a Lab teaser on both homepages, after the "Ideas and execution" gateway;
- a one-line pointer to the Lab's projects at the top of Students and Partnerships;
- a link to the Lab's "About Adeeb" section on About;
- /lab/ in sitemap.xml.
Links into /lab/ carry data-analytics-ignore until the portfolio-collect edge
function (which now allows /lab/) is redeployed. The Lab page itself is a hand-maintained single file (lab/index.html) and is not
rewritten here. The menu entries come from data/site-navigation.json.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://adeebnoor.github.io'

STYLE = ('<style>'
         '.al-mod{--al-ink:#0F2230;--al-muted:#4F606B;--al-line:#D5DEE2;--al-card:#fff;--al-accent:#0F7C78;color:var(--al-ink)}'
         '.al-mod .al-k{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--al-accent);font-weight:700;margin:0 0 6px}'
         '.al-mod[dir="rtl"] .al-k{letter-spacing:0;text-transform:none}'
         '.al-mod h2{font-size:clamp(22px,3vw,30px);line-height:1.3;margin:0 0 10px}'
         '.al-mod .al-lead{color:var(--al-muted);max-width:68ch;margin:0 0 18px}'
         '.al-mod .al-v{background:var(--al-accent);color:#fff;border-radius:14px;padding:18px 20px;margin:0 0 16px;font-weight:600;line-height:1.6}'
         '.al-mod .al-g{display:grid;grid-template-columns:1fr;gap:12px;margin:0 0 18px}'
         '@media (min-width:760px){.al-mod .al-g{grid-template-columns:repeat(3,1fr)}}'
         '.al-mod .al-c{background:var(--al-card);border:1px solid var(--al-line);border-top:3px solid var(--al-accent);border-radius:12px;padding:14px 16px}'
         '.al-mod .al-c b{display:block;margin-bottom:4px}'
         '.al-mod .al-c span{font-size:14.5px;color:var(--al-muted)}'
         '.al-mod .al-cta{display:inline-block;background:var(--al-accent);color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:10px 18px}'
         '.al-mod .al-cta:focus-visible{outline:3px solid var(--al-ink);outline-offset:3px}'
         '.lab-pointer{margin:0 0 20px;padding:12px 16px;border:1px solid #D5DEE2;border-inline-start:4px solid #0F7C78;border-radius:10px;background:#fff}'
         '.lab-pointer a{color:#0F7C78;font-weight:700}'
         '</style>')

TEASER = {
    'en': ('<section class="section al-mod" id="adeeb-lab" aria-labelledby="al-title"><div class="wrap">'
           '<p class="al-k">Adeeb Lab · Responsible Decision Intelligence</p>'
           '<h2 id="al-title">The research and development arm behind this work.</h2>'
           '<p class="al-lead">Adeeb Lab turns the question “what changes when your AI changes?” into methods, tools and evidence for hospitals, government agencies, companies and universities. Every project starts from five questions: the problem, today’s solution, why it falls short, our added value, and the impact.</p>'
           '<p class="al-v">Our vision: no decision that affects people, whether made by a person or an AI system, is adopted without evidence that can be checked and traced, before adoption and after every change.</p>'
           '<div class="al-g"><div class="al-c"><b>1 · Decision stability</b><span>Does the decision stay the same for each case?</span></div>'
           '<div class="al-c"><b>2 · Evidence traceability</b><span>Do we know where every element came from and who approved it?</span></div>'
           '<div class="al-c"><b>3 · Evidence through change</b><span>Does the evidence still hold when the model or the science changes?</span></div></div>'
           '<a class="al-cta" href="/lab/?lang=en" data-analytics-ignore>Explore the lab’s six projects →</a></div></section>'),
    'ar': ('<section class="section al-mod" id="adeeb-lab" dir="rtl" lang="ar" aria-labelledby="al-title-ar"><div class="wrap">'
           '<p class="al-k">مختبر أديب · ذكاء القرار المسؤول</p>'
           '<h2 id="al-title-ar">ذراع البحث والتطوير خلف هذا العمل.</h2>'
           '<p class="al-lead">يحوّل مختبر أديب سؤال «ما الذي يتغيّر حين يتغيّر ذكاؤك الاصطناعي؟» إلى طرق وأدوات وأدلة للمستشفيات والجهات الحكومية والشركات والجامعات. وكل مشروع يبدأ بخمسة أسئلة: المشكلة، والحل الحالي، ولماذا لا يكفي، وقيمتنا المضافة، والأثر.</p>'
           '<p class="al-v">رؤيتنا: ألّا يُعتمد قرار يمسّ الناس، من إنسان أو نظام ذكي، دون دليل يمكن فحصه وتتبعه، قبل اعتماده وبعد كل تغيير.</p>'
           '<div class="al-g"><div class="al-c"><b>1 · ثبات القرار</b><span>هل يبقى القرار نفسه لكل حالة؟</span></div>'
           '<div class="al-c"><b>2 · تتبّع الدليل</b><span>هل نعرف من أين جاء كل عنصر ومن اعتمده؟</span></div>'
           '<div class="al-c"><b>3 · الدليل مع التغيير</b><span>هل يبقى الدليل صالحاً حين يتغيّر النموذج أو العلم؟</span></div></div>'
           '<a class="al-cta" href="/lab/" data-analytics-ignore>تعرّف على مشاريع المختبر الستة ←</a></div></section>'),
}

POINTER = {
    'en': '<p class="lab-pointer">Current research projects and partnership opportunities are at <a href="/lab/?lang=en#projects" data-analytics-ignore>Adeeb Lab → Projects</a>.</p>',
    'ar': '<p class="lab-pointer">المشاريع البحثية القائمة وفرص الشراكة في <a href="/lab/#projects" data-analytics-ignore>مختبر أديب ← المشاريع</a>.</p>',
}
ABOUT = {
    'en': '<p class="lab-pointer">Who Adeeb is in the lab: <a href="/lab/?lang=en#adeeb" data-analytics-ignore>Adeeb Lab → About Adeeb</a>.</p>',
    'ar': '<p class="lab-pointer">من هو أديب في المختبر: <a href="/lab/#adeeb" data-analytics-ignore>مختبر أديب ← من هو أديب</a>.</p>',
}


def put(source, name, html, anchor, after=True):
    """Insert html between name markers next to anchor (a regex), replacing any earlier copy."""
    start, end = f'<!-- {name}:start -->', f'<!-- {name}:end -->'
    source = re.sub(re.escape(start) + r'.*?' + re.escape(end), '', source, flags=re.S)
    match = re.search(anchor, source)
    if not match:
        raise SystemExit(f'{name}: insertion point not found')
    at = match.end() if after else match.start()
    return source[:at] + start + html + end + source[at:]


def style(source):
    source = re.sub(r'<!-- lab-style:start -->.*?<!-- lab-style:end -->', '', source, flags=re.S)
    return source.replace('</head>', '<!-- lab-style:start -->' + STYLE + '<!-- lab-style:end --></head>', 1)


def main():
    for lang, prefix in (('en', ''), ('ar', 'ar/')):
        home = ROOT / prefix / 'index.html'
        s = put(home.read_text(encoding='utf-8'), 'lab-teaser', TEASER[lang], r'<!-- ideas-gateway:end -->')
        home.write_text(style(s), encoding='utf-8')
        for page in ('students.html', 'partnerships.html'):
            path = ROOT / prefix / page
            s = put(path.read_text(encoding='utf-8'), 'lab-pointer', POINTER[lang], r'<main[^>]*>')
            if page == 'partnerships.html':  # full-bleed hero: give the line the page width
                s = s.replace('<!-- lab-pointer:start --><p class="lab-pointer">', '<!-- lab-pointer:start --><div class="wrap" style="padding-top:18px"><p class="lab-pointer">', 1)
                s = s.replace('</p><!-- lab-pointer:end -->', '</p></div><!-- lab-pointer:end -->', 1)
            path.write_text(style(s), encoding='utf-8')
        about = ROOT / prefix / 'about.html'
        s = put(about.read_text(encoding='utf-8'), 'lab-about', ABOUT[lang], r'<main[^>]*>')
        about.write_text(style(s), encoding='utf-8')

    sitemap = ROOT / 'sitemap.xml'
    s = sitemap.read_text(encoding='utf-8')
    entry = f'<url><loc>{ORIGIN}/lab/</loc></url>'
    if entry not in s:
        s = s.replace('</urlset>', entry + '</urlset>', 1)
        sitemap.write_text(s, encoding='utf-8')
    print('Linked Adeeb Lab from both homepages, Students, Partnerships, About and the sitemap.')


if __name__ == '__main__':
    main()
