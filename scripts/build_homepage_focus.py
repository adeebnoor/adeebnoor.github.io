"""Curate a shorter home and retain every original project image in the catalog.

Run after the existing content/localization passes. Those passes provide the
current stages, links, images and roles; this pass only changes their presentation.
The hero and research identity are deliberately left intact.
"""
from pathlib import Path
from html import escape
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
FOCUS = json.loads((ROOT/'data/homepage-focus.json').read_text())
PROJECTS = json.loads((ROOT/'data/featured-projects.json').read_text())
CSS_VERSION = hashlib.sha256((ROOT/'homepage-focus.css').read_bytes()).hexdigest()[:10]


def block(name):
    return re.compile(r'<!-- '+re.escape(name)+r':start -->.*?<!-- '+re.escape(name)+r':end -->', re.S)


def required(pattern, source):
    match = re.search(pattern, source, re.S)
    if not match:
        raise ValueError(f'Missing source block: {pattern}')
    return match[0]


def stylesheet(source):
    source = block('homepage-focus:css').sub('', source)
    return source.replace('</head>', f'<!-- homepage-focus:css:start --><link rel="stylesheet" href="/homepage-focus.css?v={CSS_VERSION}"><!-- homepage-focus:css:end --></head>', 1)


for lang in ('en', 'ar'):
    prefix = '/ar' if lang == 'ar' else ''
    arrow = '←' if lang == 'ar' else '→'
    text = FOCUS[lang]
    home = ROOT/(prefix.lstrip('/')+'/' if prefix else '')/'index.html'
    source = home.read_text()
    full = required(r'<section class="section" id="projects">.*?</section>', source)
    cards = {m[1]: m[0] for m in re.finditer(r'<article class="card" data-project="([^"]+)">.*?</article>', full, re.S)}
    if list(cards) != [item['id'] for item in PROJECTS]:
        raise ValueError('Run the full build before the homepage focus pass.')

    # Reuse the generated image/link markup verbatim, including SVG crops and RTL assets.
    featured = []
    catalog = []
    for item in PROJECTS:
        card = cards[item['id']]
        visual = required(r'<a class="project-visual-link".*?</a>', card)
        meta = required(r'<div class="project-meta">.*?</div>', card)
        title = required(r'<h3>.*?</h3>', card)
        actions = required(r'<div class="project-actions">.*?</div>', card)
        role = required(r'<p class="project-role">.*?</p>', card)
        catalog.append(f'<article class="focus-catalog-card" data-project="{item["id"]}">{visual}<div class="focus-catalog-copy">{meta}{title}<p>{escape(item[lang]["domain"])}</p>{actions}</div></article>')
        if item['id'] in FOCUS['projects']:
            work = text['work'][item['id']]
            detail = (f'<dl class="focus-project-facts"><dt>{text["valueLabel"]}</dt><dd>{escape(work["value"])}</dd>'
                      f'<dt>{text["resultLabel"]}</dt><dd>{escape(work["result"])}</dd></dl>')
            featured.append((item['id'], f'<article class="card" data-project="{item["id"]}">{visual}<div class="card-copy">{meta}{title}{detail}{role}{actions}</div></article>'))
    selected = dict(featured)
    audience = ''.join(f'<a href="{prefix+item["url"]}">{escape(item["label"])} {arrow}</a>' for item in text['audiences'])
    projects = (f'<section class="section" id="projects"><div class="wrap"><div class="section-heading"><div><div class="label">{text["label"]}</div><h2>{text["title"]}</h2></div>'
                f'<a href="{prefix}/ventures.html">{text["all"]} {arrow}</a></div><p class="project-intro">{text["intro"]}</p>'
                '<div class="cards project-grid focus-featured">'+''.join(selected[key] for key in FOCUS['projects'])+'</div>'
                f'<nav class="focus-audiences" aria-label="{text["audienceLabel"]}"><span>{text["audienceLabel"]}</span>{audience}</nav></div></section>')
    paths = ''.join(f'<article class="focus-path"><div class="label">{escape(item["label"])}</div><h3>{escape(item["title"])}</h3>'
                    f'<p>{escape(item["text"])}</p><a href="{prefix+item["url"]}">{escape(item["cta"])} {arrow}</a></article>' for item in text['paths'])
    gateway = ('<!-- ideas-gateway:start --><section class="section focus-gateway" id="work-and-ideas"><div class="wrap">'
               f'<h2 class="sr-only">{text["gatewayTitle"]}</h2><div class="focus-paths">{paths}</div></div></section><!-- ideas-gateway:end -->')
    latest = required(r'<!-- latest-research:start -->.*?<!-- latest-research:end -->', source)
    # The full publication feed remains on Publications; home retains the research link.
    for name in ('expertise-map', 'site-audit:home-services', 'ideas-gateway', 'latest-research'):
        source = block(name).sub('', source)
    source = source.replace(full, '', 1)
    stats = required(r'<section class="stats".*?</section>', source)
    source = source.replace(stats, stats+gateway+projects+latest, 1)
    home.write_text(stylesheet(source))

    target = ROOT/(prefix.lstrip('/')+'/' if prefix else '')/'ventures.html'
    source = block('homepage-focus:catalog').sub('', target.read_text())
    gallery = ('<!-- homepage-focus:catalog:start --><section class="focus-catalog" id="projects" aria-labelledby="project-catalog-title">'
               f'<div class="label">{text["galleryLabel"]}</div><h2 id="project-catalog-title">{text["galleryTitle"]}</h2><p class="focus-catalog-intro">{text["galleryIntro"]}</p>'
               '<div class="focus-catalog-grid">'+''.join(catalog)+'</div></section><!-- homepage-focus:catalog:end -->')
    source, count = re.subn(r'(<main\b[^>]*>)', lambda m: m[0]+gallery, source, count=1)
    if count != 1:
        raise ValueError(f'Missing catalog main in {target}')
    target.write_text(stylesheet(source))

print('Focused both homepages on three projects; preserved all nine project visuals in both catalogs.')
