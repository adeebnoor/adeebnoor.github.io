"""Opportunities & investors: dedicated pages plus homepage/contact/footer entry points.
Runs last in build_site.py (and once first with --bootstrap so the pages exist
before other generators iterate PAGES). Every injected fragment is wrapped in a
`site-audit:opp-*` marker, so sync_identity.strip_generated removes it on the
next build and this script re-adds it: the output is idempotent.
Content lives in data/opportunities.json.
"""
from html import escape
from pathlib import Path
from urllib.parse import quote
import json
import re
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from localize_site import finish, public_path  # noqa: E402
DATA = json.loads((ROOT / 'data' / 'opportunities.json').read_text())
IDENTITY=json.loads((ROOT/'data'/'site_identity.json').read_text())
EMAIL = IDENTITY['opportunities_email']
OFFICIAL = IDENTITY['institutional_email']
ORIGIN = 'https://adeebnoor.github.io'
CSS = '/opportunities.css?v=20260924-opp2'
PAGES = ('advisory.html', 'partnerships.html')
def e(text):
    return escape(str(text), quote=True)
def block(name, content):
    return f'<!-- site-audit:opp-{name}:start -->{content}<!-- site-audit:opp-{name}:end -->'
def strip(source, name):
    return re.sub(rf'<!-- site-audit:opp-{name}:start -->.*?<!-- site-audit:opp-{name}:end -->', '', source, flags=re.S)
def mailto(subject, cls='opp-btn primary', text=None):
    href = f'mailto:{EMAIL}?subject={quote(subject)}'
    return f'<a class="{cls}" href="{e(href)}" data-contact-owner="site" data-site="opportunities-email">{e(text or EMAIL)}</a>'
def external(href):
    return href.startswith('http')
def link(href, text, cls=''):
    attrs = f' class="{cls}"' if cls else ''
    if external(href):
        attrs += ' target="_blank" rel="noopener noreferrer"'
    return f'<a{attrs} href="{e(href)}">{e(text)}</a>'
def ul(items):
    return '<ul>' + ''.join(f'<li>{e(i)}</li>' for i in items) + '</ul>'
def contact_panel(c, lang, subject):
    routes = ''.join(link(r['href'], r['text']) for r in c['routes'])
    return (f'<section class="opp-section" id="start"><div class="opp-contact"><div>'
            f'<h2>{e(c["contact_h2"])}</h2><p>{e(c["contact_text"])}</p>'
            f'<p>{mailto(subject, "opp-email")}</p>{ul(c["contact_list"]) if c["contact_list"] else ""}</div>'
            f'<div class="opp-routes"><b>{e(c["routes_title"])}</b>{routes}'
            f'<span>{e(DATA["contact"][lang]["institutional"])} <a href="mailto:{OFFICIAL}" data-contact-owner="site" data-site="institutional-email">{OFFICIAL}</a></span>'
            f'</div></div></section>')
def page_opportunities(lang):
    c = DATA['opportunities'][lang]
    ar = lang == 'ar'
    roles = ''.join(
        f'<article class="opp-card"><h3>{e(r["title"])}</h3><p>{e(r["text"])}</p>{ul(r["fit"])}'
        f'{link(r["link"], r["link_text"], "opp-link")}</article>' for r in c['roles'])
    stats = ''.join(f'<div class="opp-stat"><b>{e(p["value"])}</b><span>{e(p["label"])}</span></div>' for p in c['proof'])
    career = ''.join(f'<li><time>{e(x["when"])}</time><div><b>{e(x["role"])}</b><span>{e(x["org"])}</span></div></li>' for x in c['career'])
    cv = public_path('executive-cv.html', ar)
    body = (
        f'<section class="opp-hero"><div class="opp-wrap"><p class="opp-kicker">{e(c["kicker"])}</p><h1>{e(c["h1"])}</h1>'
        f'<p class="opp-lead">{e(c["lead"])}</p><div class="opp-actions">'
        f'{link(cv, c["cta_cv"], "opp-btn primary")}{link(c["cta_second_link"], c["cta_second"], "opp-btn")}</div></div></section>'
        f'<div class="opp-wrap">'
        f'<section class="opp-section" id="roles"><h2>{e(c["roles_h2"])}</h2><p class="opp-intro">{e(c["roles_intro"])}</p><div class="opp-grid">{roles}</div></section>'
        f'<section class="opp-section" id="delivered"><h2>{e(c["proof_h2"])}</h2><p class="opp-intro">{e(c["proof_intro"])}</p><div class="opp-stats">{stats}</div>'
        f'<p class="opp-note">{e(c["proof_note"])} <a href="{cv}#metric-sources">{e(c["proof_source"])}</a> · <a href="{public_path("engagements.html", ar)}">{e(DATA["opportunities"][lang]["roles"][1]["link_text"])}</a></p></section>'
        f'<section class="opp-section" id="career"><h2>{e(c["career_h2"])}</h2><ol class="opp-timeline">{career}</ol></section>'
        f'{contact_panel(c, lang, c["mail_subject"])}</div>')
    return c['title'], c['description'], body
def page_investors(lang):
    c = DATA['investors'][lang]
    ar = lang == 'ar'
    L = c['labels']
    stage_classes = {'Live':'live','Public Beta':'beta','Prototype':'prototype','In Development':'development'}
    ventures = ''.join(
        f'<article class="opp-card"><div class="opp-lifecycle"><span class="opp-tag {stage_classes.get(v["stage"], "")}"'+(' lang="en"' if ar else '')+f'>{e(v["stage"])}</span>'
        f'<span class="opp-updated">{e(("محدّث " if ar else "Updated ") + v.get("updated", ""))}</span></div><h3>{e(v["name"])}</h3><p>{e(v["text"])}</p>'
        f'<dl class="opp-dl"><dt>{e(L["sector"])}</dt><dd>{e(v["sector"])}</dd><dt>{e(L["role"])}</dt><dd>{e(v["role"])}</dd>'
        f'<dt>{e(L["built"])}</dt><dd>{e(v["built"])}</dd><dt>{e(L["seeking"])}</dt><dd>{e(v["seeking"])}</dd></dl>'
        f'{link(v["link"], v["link_text"], "opp-link")}</article>' for v in c['ventures'])
    record = ''.join(f'<article class="opp-card"><h3>{e(r["title"])}</h3><p>{e(r["text"])}</p>{link(r["link"], r["link_text"], "opp-link")}</article>' for r in c['record'])
    bring = ''.join(f'<article class="opp-card"><h3>{e(b["title"])}</h3>{ul(b["items"])}</article>' for b in c['bring'])
    body = (
        f'<section class="opp-hero"><div class="opp-wrap"><p class="opp-kicker">{e(c["kicker"])}</p><h1>{e(c["h1"])}</h1>'
        f'<p class="opp-lead">{e(c["lead"])}</p><div class="opp-actions">'
        f'{link(public_path("ventures.html", ar), c["cta_projects"], "opp-btn primary")}</div><p class="opp-meta">{e(c["meta"])}</p></div></section>'
        f'<div class="opp-wrap">'
        f'<section class="opp-section" id="ventures-open"><h2>{e(c["ventures_h2"])}</h2><p class="opp-intro">{e(c["ventures_intro"])}</p><div class="opp-grid opp-ventures">{ventures}</div></section>'
        f'<section class="opp-section" id="track-record"><h2>{e(c["record_h2"])}</h2><div class="opp-grid">{record}</div></section>'
        f'<section class="opp-section" id="bring"><h2>{e(c["bring_h2"])}</h2><p class="opp-intro">{e(c["bring_intro"])}</p><div class="opp-grid">{bring}</div></section>'
        f'{contact_panel(c, lang, c["mail_subject"])}<p class="opp-disclaimer">{e(c["disclaimer"])}</p></div>')
    return c['title'], c['description'], body
def audit_footer(lang):
    source = (ROOT / (('ar/' if lang == 'ar' else '') + 'engagements.html')).read_text()
    m = re.search(r'<!-- site-audit:footer:start -->.*?<!-- site-audit:footer:end -->', source, re.S)
    return m[0] if m else ''
def render_page(page, lang):
    ar = lang == 'ar'
    title, description, body = (page_opportunities if page == 'advisory.html' else page_investors)(lang)
    url = ORIGIN + public_path(page, ar)
    rtl = ' dir="rtl"' if ar else ''
    image = f'{ORIGIN}/assets/adeeb-noor-card-{lang}.jpg'
    head = (f'<!doctype html><html lang="{lang}"{rtl}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{e(title)}</title><meta name="description" content="{e(description)}"><link rel="icon" href="/favicon.svg"><meta name="theme-color" content="#0a151a">'
            f'<link rel="stylesheet" href="/audit.css?v=20260914-audit2"><link rel="stylesheet" href="{CSS}">'
            f'<meta property="og:type" content="website"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}">'
            f'<meta property="og:url" content="{url}"><meta property="og:image" content="{image}"><meta property="og:image:alt" content="{e(title)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            f'<meta property="og:locale" content="{"ar_SA" if ar else "en_US"}"><meta property="og:site_name" content="{"أديب نور" if ar else "Adeeb Noor"}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(description)}"><meta name="twitter:image" content="{image}">'
            '</head>')
    source = head + f'<body class="opp-page"><main id="main-content">{body}</main>{audit_footer(lang)}</body></html>'
    return finish(source, page, ar)
def patch_home(lang):
    ar = lang == 'ar'
    path = ROOT / (('ar/' if ar else '') + 'index.html')
    source = strip(strip(strip(path.read_text(), 'head'), 'home'), 'recog')
    h = DATA['home'][lang]
    source = source.replace('</head>', block('head', f'<link rel="stylesheet" href="{CSS}">') + '</head>', 1)
    old = re.search(r'<title>(.*?)</title>', source, re.S)[1]
    new = e(h['title'])
    if old != new:
        source = source.replace(f'<title>{old}</title>', f'<title>{new}</title>', 1)
        source = source.replace(f'content="{old}"', f'content="{new}"')
    hero = re.search(r'<section class="hero">.*?</section>', source, re.S)
    part = hero[0]
    part = re.sub(r'<div class="eyebrow">.*?</div>', f'<div class="eyebrow">{e(h["eyebrow"])}</div>', part, count=1, flags=re.S)
    actions = (f'<div class="actions"><a class="button primary" href="{public_path("advisory.html", ar)}">{e(h["cta_roles"])}</a>'
               f'<a class="button" href="{public_path("partnerships.html", ar)}">{e(h["cta_investors"])}</a></div>')
    part = re.sub(r'<div class="actions">.*?</div>', actions, part, count=1, flags=re.S)
    position = public_path('ideas/position.html', ar)
    part = re.sub(r'(<p class="hero-cv-links">)(.*?)(</p>)',
                  lambda m: m[1] + re.sub(r'<span aria-hidden="true"> · </span><a href="[^"]*position\.html">.*?</a>', '', m[2]) +
                  f'<span aria-hidden="true"> · </span><a href="{position}">{e(h["position_link"])}</a>' + m[3], part, count=1, flags=re.S)
    part = re.sub(r'<p class="hero-thesis">.*?</p>', f'<p class="hero-thesis">{e(h["thesis"])}</p>', part, count=1, flags=re.S)
    source = source[:hero.start()] + part + source[hero.end():]
    stats = re.search(r'<section class="stats".*?</section>', source, re.S)
    if stats:
        block_html = stats[0]
        for before, after in h['stat_labels']:
            block_html = block_html.replace(f'<p>{before}</p>', f'<p>{e(after)}</p>')
        source = source[:stats.start()] + block_html + source[stats.end():]
        r = h['recognition']
        items = ''.join(f'<a class="opp-recog-item" href="{e(i["href"])}" target="_blank" rel="noopener noreferrer"><b>{e(i["title"])}</b><span>{e(i["meta"])}</span></a>' for i in r['items'])
        more = ''.join(f'<a href="{e(href)}">{e(text)}</a>' for href, text in r['links'])
        recog = (f'<section class="opp-recog" id="recognition" aria-labelledby="recognition-title"><div class="wrap"><div class="opp-recog-head">'
                 f'<div><p class="opp-kicker">{e(r["kicker"])}</p><h2 id="recognition-title">{e(r["heading"])}</h2></div><p class="opp-recog-more">{more}</p></div>'
                 f'<div class="opp-recog-grid">{items}</div></div></section>')
        end = source.index('</section>', stats.start()) + len('</section>')
        source = source[:end] + block('recog', recog) + source[end:]
    path.write_text(source)
def patch_contact(lang):
    ar = lang == 'ar'
    path = ROOT / (('ar/' if ar else '') + 'contact.html')
    source = strip(strip(path.read_text(), 'contact'), 'head')
    c = DATA['contact'][lang]
    section = (f'<section class="audit-section" id="direct-routes"><div class="audit-kicker">{e(c["kicker"])}</div><h2>{e(c["heading"])}</h2>'
               f'<p>{e(c["text"])}</p><p>{mailto(c["heading"], "audit-button", EMAIL)}</p>'
               f'<div class="audit-links"><a href="{public_path("advisory.html", ar)}">{e(c["roles"])}</a><a href="{public_path("partnerships.html", ar)}">{e(c["investors"])}</a></div>'
               f'<p class="audit-note">{e(c["institutional"])} <a href="mailto:{OFFICIAL}" data-contact-owner="site" data-site="institutional-email">{OFFICIAL}</a></p></section>')
    marker = '<!-- site-audit:intake:end -->'
    if marker not in source:
        raise SystemExit(f'{path}: intake block missing')
    source = source.replace(marker, marker + block('contact', section), 1)
    path.write_text(source)
def patch_footers():
    for path in ROOT.rglob('*.html'):
        if any(p in {'.git', 'node_modules', 'kinetic-hr', 'SulTaN'} for p in path.parts):
            continue
        rel = path.relative_to(ROOT)
        ar = rel.parts[0] == 'ar'
        lang = 'ar' if ar else 'en'
        source = path.read_text()
        original = source
        source = re.sub(r'<a [^>]*data-opp="1"[^>]*>.*?</a>', '', source)
        f = DATA['footer'][lang]
        links = (f'<a data-opp="1" href="{public_path("advisory.html", ar)}">{e(f["roles"])}</a>'
                 f'<a data-opp="1" href="{public_path("partnerships.html", ar)}">{e(f["investors"])}</a>')
        source = re.sub(r'(<div class="audit-footer"><nav [^>]*>)', lambda m: m[1] + links, source, count=1)
        mail = f'<a data-opp="1" href="mailto:{EMAIL}" data-contact-owner="site" data-site="opportunities-email">{EMAIL}</a>'
        source = re.sub(r'(<nav class="footer-nav"[^>]*>.*?data-site="institutional-email">[^<]*</a>)', lambda m: m[1] + mail, source, count=1, flags=re.S)
        if source != original:
            path.write_text(source)
def main():
    bootstrap = '--bootstrap' in sys.argv
    for page in PAGES:
        for lang in ('en', 'ar'):
            target = ROOT / (('ar/' if lang == 'ar' else '') + page)
            if bootstrap and target.exists():
                continue
            target.write_text(render_page(page, lang))
    if bootstrap:
        return
    for lang in ('en', 'ar'):
        patch_home(lang)
        patch_contact(lang)
    patch_footers()
    print('Built leadership & advisory and ventures & partnerships pages (EN/AR) with homepage, contact and footer entry points.')
if __name__ == '__main__':
    main()
