"""Render the bilingual research agenda from one editorial source.

The doctoral record, present interpretation and proposed studies are deliberately
distinct. Publication status comes from the existing curated research inventory.
"""
from pathlib import Path
from html import escape as e
import hashlib
import json

from localize_site import finish

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = json.loads((ROOT / 'data/research-program.json').read_text())
RECORDS = json.loads((ROOT / 'data/latest-research.json').read_text())['items']
SELECTED = ('ontology-ddi-2026', 'action-equivalence-current-research',
            'ridi-reproducibility-2026', 'iscarb-preprint-2026', 'context-aware-cxr-2026')


def build(lang):
    ar = lang == 'ar'
    c = PROGRAM[lang]
    labels = c['labels']
    prefix, arrow = ('/ar', '←') if ar else ('', '→')

    def link(href, label, cls=''):
        # Internal links preserve language; external records retain their URL.
        if ar and href.startswith('/') and not href.startswith('/ar/'):
            href = prefix + href
        return f'<a href="{e(href, quote=True)}"'+(f' class="{cls}"' if cls else '')+f'>{e(label)} {arrow}</a>'

    def heading(id_, kicker, title, intro):
        return (f'<section class="rp-section" id="{id_}"><div class="rp-heading">'
                f'<div class="kicker">{e(kicker)}</div><h2>{e(title)}</h2><p>{e(intro)}</p></div>')

    timeline = ''
    for item in c['timeline']:
        links = link(item['href'], item['label'])
        if item.get('related'):
            links += link(item['related'], item['relatedLabel'])
        timeline += (f'<li><span class="rp-year">{e(item["year"])}</span><article>'
                     f'<p class="rp-status">{e(item["status"])}</p><h3>{e(item["title"])}</h3>'
                     f'<p>{e(item["body"])}</p><p class="rp-reference">{e(item["reference"])}</p>'
                     f'<div class="rp-links">{links}</div></article></li>')
    body = heading('research-lineage', c['lineageKicker'], c['lineageHeading'], c['lineageIntro'])
    body += f'<ol class="rp-timeline">{timeline}</ol><p class="rp-note">{e(c["lineageNote"])}</p></section>'

    body += heading('programs', labels['programs'], c['programsHeading'], c['programsIntro'])
    body += '<div class="rp-grid rp-pillars">'
    for n, item in enumerate(c['pillars'], 1):
        body += (f'<article class="rp-card" id="{item["id"]}"><span class="rp-number" aria-hidden="true">0{n}</span>'
                 f'<h3>{e(item["title"])}</h3><p class="rp-question">{e(item["question"])}</p>'
                 f'<p>{e(item["body"])}</p><h4>{e(labels["study"])}</h4><p>{e(item["study"])}</p>'
                 f'<div class="rp-foundation"><h4>{e(labels["foundation"])}</h4>{link(item["href"], item["foundation"])}</div></article>')
    body += '</div></section>'

    r = c['ridi']
    manuscript = next(item for item in RECORDS if item['id'] == 'action-equivalence-current-research')
    body += (f'<section class="rp-ridi" id="ridi"><div><div class="kicker">{e(r["kicker"])}</div>'
             f'<h2>{e(r["heading"])}</h2><p>{e(r["body"])}</p>'
             f'<div class="rp-links">{link("https://adeebnoor.github.io/ridi/",r["page"])}'
             f'{link("https://zenodo.org/records/22974727",r["data"])}{link("/demo/",r["demo"])}</div></div>'
             f'<div class="rp-ridi-evidence"><p class="rp-status">{e(manuscript["kind"][lang])}</p>'
             f'<p>{e(manuscript["summary"][lang])}</p><p class="rp-note">{e(r["limit"])}</p></div></section>')

    body += heading('research-record', labels['record'], labels['recordHeading'], labels['recordIntro'])
    body += '<div class="rp-records">'
    for id_ in SELECTED:
        item = next(x for x in RECORDS if x['id'] == id_)
        title = item.get('title_'+lang, item['title'])
        # Preserve the official English title when no translated title exists.
        language = ' lang="en" dir="ltr"' if ar and not item.get('title_ar') else ''
        body += (f'<article class="rp-record"><div><p class="rp-status">{e(item["kind"][lang])} · '
                 f'{e(item["date"])}</p><h3{language}>{e(title)}</h3>'
                 f'<p>{e(item["summary"][lang])}</p></div>{link(item.get("url_"+lang,item["url"]),labels["read"])}</article>')
    body += f'</div><p class="rp-note">{e(labels["statusDate"])}</p>{link("/publications.html",labels["allPublications"])}</section>'

    for key, id_, heading_key, intro_key in (
            ('applications', 'inventions', 'applicationsHeading', 'applicationsIntro'),
            ('audiences', 'participate', 'audiencesHeading', 'audiencesIntro')):
        body += heading(id_, labels[key], labels[heading_key], labels[intro_key])
        body += '<div class="rp-grid '+('rp-two' if key == 'applications' else '')+'">'
        for item in c[key]:
            body += (f'<article class="rp-card"><h3>{e(item["title"])}</h3><p>{e(item["body"])}</p>'
                     f'{link(item["href"],item["label"])}</article>')
        body += '</div></section>'

    title = 'أخلاقيات الذكاء الاصطناعي والأبحاث — أديب نور' if ar else 'AI Ethics & Research — Adeeb Noor'
    css_version = hashlib.sha256((ROOT/'research.css').read_bytes()).hexdigest()[:10]
    origin = 'https://adeebnoor.github.io'
    doc = f'''<!doctype html><html lang="{lang}"{' dir="rtl"' if ar else ''}><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title><meta name="description" content="{e(c['description'],quote=True)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/inner.css"><link rel="stylesheet" href="/research.css?v={css_version}">
<meta property="og:type" content="website"><meta property="og:title" content="{e(title,quote=True)}"><meta property="og:description" content="{e(c['description'],quote=True)}"><meta property="og:url" content="{origin+prefix}/research.html"><meta property="og:image" content="{origin}/assets/adeeb-noor-card-{lang}.jpg"><meta property="og:locale" content="{'ar_SA' if ar else 'en_US'}"><meta name="twitter:card" content="summary_large_image">
</head><body class="research-program"><section class="page-hero"><div class="wrap"><div class="crumb">{e(c['identity'])}</div><h1>{e(c['heading'])}</h1><p>{e(c['lead'])}</p><div class="hero-actions">{link('#research-lineage',labels['lineage'],'primary')}{link('#programs',labels['programs'])}{link('#participate',labels['participate'])}</div></div></section><main class="wrap content">{body}</main></body></html>'''
    target = ROOT/('ar/research.html' if ar else 'research.html')
    target.write_text(finish(doc, 'research.html', ar))


if __name__ == '__main__':
    for language in ('en', 'ar'):
        build(language)
    print('Built bilingual AI ethics agenda with sourced doctoral lineage and explicit research status.')
