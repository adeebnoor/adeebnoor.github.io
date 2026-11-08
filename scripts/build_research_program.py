"""Render the bilingual Research & Lab page from one editorial source.

research.html is the single home of Adeeb Lab (Responsible Decision Intelligence):
the vision, three pillars, six projects with their stories, the five-question method,
the research arc since the PhD, selected records, ways to work together and contact; build_audit.py appends the open-work repositories.
/lab/ only redirects here.

The doctoral record, present interpretation and proposed studies stay distinct.
Publication status comes from the curated research inventory (data/latest-research.json);
project stories come from data/lab-projects.json.
"""
from pathlib import Path
from html import escape as e
import hashlib
import json

from localize_site import finish

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = json.loads((ROOT / 'data/research-program.json').read_text())
RECORDS = json.loads((ROOT / 'data/latest-research.json').read_text())['items']
PROJECTS = json.loads((ROOT / 'data/lab-projects.json').read_text())['projects']
SELECTED = ('ontology-ddi-2026', 'action-equivalence-current-research',
            'ridi-reproducibility-2026', 'iscarb-preprint-2026', 'context-aware-cxr-2026')
# Same-page anchors the live analytics collector does not know yet: their links are
# not reported until the portfolio-collect edge function (which lists them) is redeployed.
# Outbound destinations added to the collector at the same time, with the same caveat.
NEW_DESTINATIONS = {'https://pypi.org/project/ridi-audit/', 'https://osf.io/txwdv'}
NEW_ANCHORS = {'vision', 'method', 'work', 'principles', 'lab-contact'} | {p['id'] for p in PROJECTS if p['id'] != 'ridi'}


def build(lang):
    ar = lang == 'ar'
    c = PROGRAM[lang]
    lab = c['lab']
    labels = c['labels']
    prefix, arrow = ('/ar', '←') if ar else ('', '→')
    by_id = {p['id']: p for p in PROJECTS}

    def t(value):
        return e(value[lang])

    def link(href, label, cls=''):
        # Internal links preserve language; external records retain their URL.
        if ar and href.startswith('/') and not href.startswith('/ar/'):
            href = prefix + href
        ignore = ' data-analytics-ignore' if (href.startswith('#') and href[1:] in NEW_ANCHORS) or href in NEW_DESTINATIONS else ''
        return f'<a href="{e(href, quote=True)}"'+(f' class="{cls}"' if cls else '')+f'{ignore}>{e(label)} {arrow}</a>'

    def heading(id_, kicker, title, intro):
        return (f'<section class="rp-section" id="{id_}"><div class="rp-heading">'
                f'<div class="kicker">{e(kicker)}</div><h2>{e(title)}</h2><p>{e(intro)}</p></div>')

    def project_link(pid):
        p = by_id[pid]
        ignore = ' data-analytics-ignore' if pid in NEW_ANCHORS else ''
        return f'<a class="rp-chip" href="#{pid}"{ignore}>{t(p["title"])}</a>'

    # 1. Vision and mission
    body = (f'<section class="rp-vision" id="vision"><div class="kicker">{e(lab["visionKicker"])}</div>'
            f'<p class="rp-vision-label">{e(lab["visionLabel"])}</p><p class="rp-vision-text">{e(lab["vision"])}</p>'
            f'<p class="rp-vision-question">{e(lab["question"])}</p>'
            f'<p><strong>{e(lab["missionLabel"])}</strong> {e(lab["mission"])}</p></section>')

    # 2. Pillars: the Lab's decision life cycle, each with its ethical question
    body += heading('programs', labels['programs'], c['programsHeading'], lab['pillarsIntro'])
    body += '<div class="rp-grid rp-pillars">'
    for n, item in enumerate(c['pillars'], 1):
        chips = ''.join(project_link(pid) for pid in item['projects'])
        body += (f'<article class="rp-card" id="{item["id"]}"><span class="rp-number" aria-hidden="true">0{n}</span>'
                 f'<h3>{e(item["labTitle"])}</h3><p class="rp-question">{e(item["labQuestion"])}</p>'
                 f'<h4>{e(lab["ethicsQuestion"])} · {e(item["title"])}</h4><p>{e(item["question"])}</p>'
                 f'<p>{e(item["body"])}</p><h4>{e(labels["study"])}</h4><p>{e(item["study"])}</p>'
                 f'<h4>{e(lab["labProjects"])}</h4><div class="rp-chips">{chips}</div>'
                 f'<div class="rp-foundation"><h4>{e(labels["foundation"])}</h4>{link(item["href"], item["foundation"])}</div></article>')
    body += '</div></section>'

    # 3. Six projects, each with its full story
    body += heading('projects', lab['projectsKicker'], lab['projectsHeading'], lab['projectsIntro'])
    body += '<div class="rp-projects">'
    for p in PROJECTS:
        tone = ' rp-tag-warm' if p['tagTone'] == 'warm' else ''
        svg = p['svg'].replace('>2 flips<', '>انقلابان<') if ar else p['svg']
        flow = ''.join(f'<li{" class=\"rp-ours\"" if f["ours"] else ""}>{t(f["text"])}'
                       + (f'<em>{e(lab["added"])}</em>' if f['ours'] else '') + '</li>' for f in p['flow'])
        five = ''.join(f'<div><dt>{t(q["q"])}</dt><dd>{t(q["a"])}</dd></div>' for q in p['five'])
        journey = ''.join(f'<li class="rp-j-{j["state"]}"><span>{e(lab[j["state"]])}</span>{t(j["text"])}</li>' for j in p['journey'])
        lists = ''.join(f'<div><h5>{e(lab[k])}</h5><ul>' + ''.join(f'<li>{t(x)}</li>' for x in p[k]) + '</ul></div>'
                        for k in ('gains', 'seeking'))
        ways = ''.join(f'<li>{t(w)}</li>' for w in p['ways'])
        claims = ''.join(f'<li>{t(x)}</li>' for x in p['claims'])
        outputs = ''.join(f'<li>{link(o["href"], o["label"][lang])}</li>' for o in p['outputs'])
        related = ''.join(project_link(pid) for pid in p['related'])
        pillar = c['pillars'][p['pillar'] - 1]
        story = ''.join(f'<p>{t(x)}</p>' for x in p['story'])
        body += (
            f'<article class="rp-project" id="{p["id"]}"><div class="rp-project-head">'
            f'<p class="rp-project-meta"><span class="rp-tag{tone}">{t(p["tag"])}</span><span>{t(p["stage"])}</span></p>'
            f'<h3>{t(p["title"])}</h3><p class="rp-tagline">{t(p["tagline"])}</p>'
            f'<p><strong>{e(p["five"][0]["q"][lang].split(". ", 1)[-1])}:</strong> {t(p["five"][0]["a"])}</p>'
            f'<p><strong>{e(lab["opportunity"])}:</strong> {t(p["opportunity"])}</p></div>'
            f'<details class="rp-story"><summary>{e(lab["readStory"])}</summary><div class="rp-story-body">'
            f'<figure class="rp-fig">{svg}<figcaption><strong>{e(lab["abstract"])}.</strong> {t(p["abstract"])}</figcaption></figure>'
            f'<dl class="rp-facts"><div><dt>{e(lab["program"])}</dt><dd>{t(p["program"])}</dd></div>'
            f'<div><dt>{e(lab["stage"])}</dt><dd>{t(p["stage"])}</dd></div>'
            f'<div><dt>{e(lab["nextStep"])}</dt><dd>{t(p["next"])}</dd></div>'
            f'<div><dt>{e(lab["pillar"])} {p["pillar"]}</dt><dd>{e(pillar["labTitle"])}: {t(p["pillarNote"])}</dd></div></dl>'
            f'<h4>{e(lab["story"])}</h4><p class="rp-scene"><span>{e(lab["scene"])}</span>{t(p["scene"])}</p>{story}'
            f'<h4>{e(lab["idea"])}</h4><p class="rp-idea">{t(p["idea"])}</p><ol class="rp-flow">{flow}</ol>'
            f'<h4>{e(lab["opportunity"])}</h4><p>{t(p["opportunity"])}</p>'
            f'<div class="rp-opp"><div><h5>{e(lab["whyNow"])}</h5><p>{t(p["whyNow"])}</p></div>{lists}</div>'
            f'<h5>{e(lab["ways"])}</h5><ul class="rp-ways">{ways}</ul>'
            f'<h4>{e(lab["five"])}</h4><dl class="rp-five">{five}</dl>'
            f'<h4>{e(lab["journey"])}</h4><ol class="rp-journey">{journey}</ol>'
            f'<div class="rp-limits"><h4>{e(lab["claims"])}</h4><ul>{claims}</ul></div>'
            + (f'<h4>{e(lab["outputs"])}</h4><ul class="rp-outputs">{outputs}</ul>' if outputs else '')
            + f'<h4>{e(lab["related"])}</h4><div class="rp-chips">{related}</div>'
            f'<p class="rp-story-cta">{link("/contact.html#inquiry-form", lab["discuss"])}</p>'
            f'</div></details></article>')
    body += '</div></section>'

    # 4. The five-question method
    method = ''.join(f'<li><h3>{e(q)}</h3><p>{e(h)}</p></li>' for q, h in lab['method'])
    body += heading('method', lab['methodKicker'], lab['methodHeading'], lab['methodIntro'])
    body += f'<ol class="rp-method">{method}</ol></section>'

    # 5. Research arc since the PhD (unchanged editorial record)
    timeline = ''
    for item in c['timeline']:
        links = link(item['href'], item['label'])
        if item.get('related'):
            links += link(item['related'], item['relatedLabel'])
        timeline += (f'<li><span class="rp-year">{e(item["year"])}</span><article>'
                     f'<p class="rp-status">{e(item["status"])}</p><h3>{e(item["title"])}</h3>'
                     f'<p>{e(item["body"])}</p><p class="rp-reference">{e(item["reference"])}</p>'
                     f'<div class="rp-links">{links}</div></article></li>')
    body += heading('research-lineage', c['lineageKicker'], c['lineageHeading'], c['lineageIntro'])
    body += f'<ol class="rp-timeline">{timeline}</ol><p class="rp-note">{e(c["lineageNote"])}</p></section>'

    # 6. Selected records
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

    # 7. Places to test the questions: HEALTHx (flagship framework) and MIYAR
    body += heading('inventions', labels['applications'], labels['applicationsHeading'], labels['applicationsIntro'])
    body += '<div class="rp-grid rp-two">'
    for item in c['applications']:
        body += (f'<article class="rp-card"><h3>{e(item["title"])}</h3><p>{e(item["body"])}</p>'
                 f'{link(item["href"],item["label"])}</article>')
    body += '</div></section>'

    # 8. Work with us: six forms and how an engagement runs
    forms = ''.join(f'<article class="rp-card"><p class="rp-status">{e(a)}</p><h3>{e(t_)}</h3><p>{e(b)}</p></article>'
                    for t_, b, a in lab['forms'])
    steps = ''.join(f'<li><h4>{e(s)}</h4><p>{e(b)}</p></li>' for s, b in lab['steps'])
    body += heading('work', lab['workKicker'], lab['workHeading'], lab['workNote'])
    body += (f'<div class="rp-grid">{forms}</div><h3 class="rp-subhead">{e(lab["stepsHeading"])}</h3><ol class="rp-steps">{steps}</ol>'
             f'<div class="rp-contact" id="lab-contact"><div class="kicker">{e(lab["contactKicker"])}</div>'
             f'<h3>{e(lab["contactHeading"])}</h3><p>{e(lab["contactBody"])}</p>'
             f'<p class="rp-links">{link("/contact.html#inquiry-form", lab["contactCta"], "primary")}'
             f'<a href="mailto:arnoor@kau.edu.sa">arnoor@kau.edu.sa</a></p></div></section>')

    # 9. Collaborate: researchers, students, institutions; joining the lab
    body += heading('participate', labels['audiences'], labels['audiencesHeading'], labels['audiencesIntro'])
    body += '<div class="rp-grid">'
    for item in c['audiences']:
        body += (f'<article class="rp-card"><h3>{e(item["title"])}</h3><p>{e(item["body"])}</p>'
                 f'{link(item["href"],item["label"])}</article>')
    body += (f'</div><div class="rp-join"><div class="kicker">{e(lab["joinKicker"])}</div><h3>{e(lab["joinHeading"])}</h3>'
             f'<p>{e(lab["joinBody"])}</p></div></section>')

    # 10. How we work
    principles = ''.join(f'<li><strong>{e(a)}</strong> {e(b)}</li>' for a, b in lab['principles'])
    body += (f'<section class="rp-section" id="principles"><div class="rp-heading"><div class="kicker">{e(lab["principlesKicker"])}</div>'
             f'<h2>{e(lab["principlesHeading"])}</h2></div><ul class="rp-principles">{principles}</ul></section>')

    # Open work (repositories) is appended at the end of <main> by build_audit.py.

    title = 'مختبر أديب · الأبحاث — أديب نور' if ar else 'Adeeb Lab · Research — Adeeb Noor'
    description = lab['lead']
    css_version = hashlib.sha256((ROOT/'research.css').read_bytes()).hexdigest()[:10]
    origin = 'https://adeebnoor.github.io'
    actions = (link('#projects', lab['heroProjects'], 'primary') + link('#work', lab['heroWork'])
               + link('#research-lineage', lab['heroArc']))
    doc = f'''<!doctype html><html lang="{lang}"{' dir="rtl"' if ar else ''}><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title><meta name="description" content="{e(description,quote=True)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/inner.css"><link rel="stylesheet" href="/research.css?v={css_version}">
<meta property="og:type" content="website"><meta property="og:title" content="{e(title,quote=True)}"><meta property="og:description" content="{e(description,quote=True)}"><meta property="og:url" content="{origin+prefix}/research.html"><meta property="og:image" content="{origin}/assets/adeeb-lab-card.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{e(lab['kicker'],quote=True)}"><meta property="og:locale" content="{'ar_SA' if ar else 'en_US'}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{origin}/assets/adeeb-lab-card.jpg">
</head><body class="research-program"><section class="page-hero"><div class="wrap"><div class="crumb">{e(lab['kicker'])}</div><h1>{e(lab['heading'])}</h1><p>{e(lab['lead'])}</p><p class="rp-hero-note">{e(c['lead'])}</p><div class="hero-actions">{actions}</div></div></section><main class="wrap content">{body}</main><script>(function(){{function open(){{var id=location.hash.slice(1);if(!id)return;var el=document.getElementById(id);if(el&&el.classList.contains('rp-project')){{var d=el.querySelector('details');if(d)d.open=true;}}}}addEventListener('hashchange',open);open();}})();</script></body></html>'''
    target = ROOT/('ar/research.html' if ar else 'research.html')
    target.write_text(finish(doc, 'research.html', ar))


if __name__ == '__main__':
    for language in ('en', 'ar'):
        build(language)
    print('Built the bilingual Research & Lab page: vision, pillars, six project stories, method, arc, records and ways to work.')
