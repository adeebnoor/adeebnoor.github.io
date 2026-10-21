"""Place original inline illustrations (AI, ethics and evidence motifs) on the public pages.

Runs last in build_site.py, after the homepage focus pass, so every illustration
is re-applied on each build. Illustrations are inline SVG, never <img>, because
the localization check counts one <img> per project.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP = ('kinetic-hr/', 'SulTaN/', 'healthx/', 'ar/healthx/')
ART_DIR = ROOT/'assets'/'illustrations'


def inline_svg(path):
    # Drop the intrinsic size from the root <svg> only; inner shapes keep their width/height.
    text = path.read_text(encoding='utf-8').strip()
    head, rest = text.split('>', 1)
    return re.sub(r'\s(?:width|height)="\d+"', '', head) + '>' + rest


ART = {f.stem: inline_svg(f) for f in ART_DIR.glob('*.svg')}
RIDI_MARK = inline_svg(ROOT/'assets'/'brand'/'ridi-mark.svg')
ART_CLEAN = re.compile(r'<(span|div|figure) class="t-art[^"]*"[^>]*>.*?</\1>', re.S)
PAGE_ART = {'research': 'art-research', 'publications': 'art-research', 'phd': 'art-research', 'academic': 'art-research',
            'advisory': 'art-advisory', 'engagements': 'art-advisory', 'impact': 'art-advisory', 'executive-cv': 'art-advisory', 'partnerships': 'art-advisory', 'ventures': 'art-advisory',
            'ideas': 'art-ideas', 'writing': 'art-ideas', 'speaking': 'art-ideas', 'teaching': 'art-ideas',
            'healthx': 'art-health'}


def art(name, cls='t-art', tag='span'):
    return f'<{tag} class="{cls}" aria-hidden="true">{ART[name]}</{tag}>'


def page_art_for(rel):
    stem = rel.replace('ar/', '', 1).split('/')[0].replace('.html', '')
    return PAGE_ART.get(stem, 'art-decision')


def illustrate(source, rel):
    # Decorative, inline SVG only: the localization check counts <img> per project.
    source = ART_CLEAN.sub('', source)
    is_home = rel in ('index.html', 'ar/index.html')
    if is_home:
        source = source.replace('<div class="portrait">', '<div class="portrait">' + art('hero-network', 't-art t-hero-art'), 1)
        source = re.sub(r'(<article class="focus-path">)(<div class="label">)', lambda m, n=iter(['ico-ideas', 'ico-leadership']): m[1] + art(next(n), 't-art t-ico') + m[2], source)
        glyphs = iter(['ico-years', 'ico-people', 'ico-map', 'ico-users'])
        source = re.sub(r'<div class="stat"><b>', lambda m: '<div class="stat">' + art(next(glyphs), 't-art t-stat-ico') + '<b>', source)
        source = source.replace('<div class="latest-home-head"><div>', '<div class="latest-home-head">' + art('ico-research', 't-art t-ico t-ico-lg') + '<div>', 1)
        source = re.sub(r'(<div class="wrap leadership"><div>.*?)(</div><ul class="experience-list">)', lambda m: m[1] + art('human-loop', 't-art t-illus') + m[2], source, count=1, flags=re.S)
        source = source.replace('<div class="polish-cta-actions">', art('question-nodes', 't-art t-cta-art') + '<div class="polish-cta-actions">', 1)
        source = re.sub(r'(<article class="card" data-project="ridi">.*?<span class="project-open" aria-hidden="true">[^<]*</span>)',
                        lambda m: m[1] + f'<span class="t-art t-ridi-badge" aria-hidden="true">{RIDI_MARK}</span>', source, count=1, flags=re.S)
    else:
        name = page_art_for(rel)
        for hero in ('page-hero', 'opp-hero', 'ideas-hero'):
            m = re.search(r'<section class="' + hero + r'"[^>]*>', source)
            if m:
                source = source[:m.end()] + art(name, 't-art t-page-art') + source[m.end():]
                break
        if rel.endswith('research.html'):
            source = re.sub(r'(<section class="rp-ridi"[^>]*>)', lambda m: m[1] + f'<span class="t-art t-ridi-mark" aria-hidden="true">{RIDI_MARK}</span>', source, count=1)
    return source



changed = 0
for path in sorted(ROOT.rglob('*.html')):
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith(SKIP) or rel.startswith('.git/'):
        continue
    original = path.read_text(encoding='utf-8')
    if 'theme.css' not in original:
        continue
    source = illustrate(original, rel)
    if source != original:
        path.write_text(source, encoding='utf-8')
        changed += 1
print(f'Illustrated {changed} pages.')
