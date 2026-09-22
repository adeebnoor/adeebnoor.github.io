"""Apply canonical identity, CV guidance and metric provenance after localization.

This module has no write side effects when imported. Generated blocks are tagged
so the localizer can call strip_generated() before translating a second build.
"""
from pathlib import Path
from html import escape, unescape
from urllib.parse import urlsplit
import json
import re

ROOT = Path(__file__).resolve().parents[1]
GENERATED = re.compile(r'<!-- site-identity:([\w-]+):start -->.*?<!-- site-identity:\1:end -->', re.S)
ANCHOR = re.compile(r'(<a\b[^>]*\bhref="([^"]*)"[^>]*>)(.*?)(</a>)', re.S)


def read_identity():
    return json.loads((ROOT / 'data/site_identity.json').read_text())


def strip_generated(source):
    """Remove only this generator's complete, delimited blocks."""
    return GENERATED.sub('', re.sub(r'<!-- site-audit:([\w-]+):start -->.*?<!-- site-audit:\1:end -->', '', source, flags=re.S))


def block(name, content):
    return f'<!-- site-identity:{name}:start -->{content}<!-- site-identity:{name}:end -->'


def path(page, lang):
    return ('/ar/' if lang == 'ar' else '/') + page


def cv_guidance(identity, lang):
    cv = identity['cv']
    choices = ''.join(
        f'<p><a href="{path(kind + "-cv.html", lang)}"><strong>{escape(cv[kind]["label"][lang])}</strong></a>: '
        f'{escape(cv[kind]["purpose"][lang])}</p>'
        for kind in ('executive', 'academic')
    )
    return block('cv-guide', '<aside class="identity-cv-guide" aria-label="' + escape(cv['heading'][lang]) + '">' + choices + '</aside>')


def metric_strip(identity, lang):
    cards = []
    evidence = identity['evidence']
    for metric in evidence['metrics']:
        headline = identity['experience']['label'][lang] if metric['id'] == 'experience' else metric['headline'][lang]
        target = path(metric['source_page'], lang) + ('#' + metric['source_anchor'] if metric['source_anchor'] else '')
        label = evidence['projects_label' if metric['id'] == 'translation' else 'source_label'][lang]
        cards.append(f'<div class="metric" data-identity-metric="{metric["id"]}"><b>{escape(headline)}</b>'
                     f'<span>{escape(metric["scope"][lang])}</span><a class="identity-source-link" href="{target}">{escape(label)}</a></div>')
    return block('metric-strip', '<section class="metric-strip">' + ''.join(cards) + '</section>'
                 + f'<p class="evidence-note">{escape(evidence["owner_reported"][lang])}</p>')


def evidence_notes(identity, lang):
    evidence = identity['evidence']
    notes = [f'<p id="experience-basis"><strong>{escape(identity["experience"]["label"][lang])}.</strong> '
             f'{escape(identity["experience"]["basis"][lang])}</p>']
    for metric in evidence['metrics']:
        if 'note' in metric:
            notes.append(f'<p id="{metric["source_anchor"]}">{escape(metric["note"][lang])}</p>')
    return block('evidence-notes', '<section class="cv-section identity-evidence" id="metric-sources">'
                 f'<h2>{escape(evidence["heading"][lang])}</h2><p>{escape(evidence["owner_reported"][lang])}</p>'
                 + ''.join(notes) + '</section>')


def standardize_contacts(source, identity, lang):
    official = identity['institutional_email']
    labels = {"Let's Connect", 'Let’s Connect', 'Collaborate', 'Professional Inquiries',
              'Work with me', 'Start a conversation', 'Contact', 'Personal email', 'البريد الشخصي', 'التعاون', 'لنتواصل',
              'لنتعاون', 'اعمل معي', 'تعاون معي', 'ابدأ محادثة', 'تواصل', 'لنعمل معًا'}

    def mark(opening, name, value):
        if re.search(r'\b' + re.escape(name) + r'="[^"]*"', opening):
            return re.sub(r'\b' + re.escape(name) + r'="[^"]*"', f'{name}="{value}"', opening)
        return opening[:-1] + f' {name}="{value}">'

    def link(match):
        opening, href, content, closing = match.groups()
        # Personal pages use mailto for the site owner's contact paths. A future
        # third-party mail link must opt out explicitly; ordinary third-party
        # text and emails are never rewritten with a document-wide replacement.
        if 'data-contact-owner="external"' in opening:
            return match[0]
        is_mail = href.lower().startswith('mailto:')
        # Keep the separate opportunities address for leadership, board and investment correspondence.
        if is_mail and identity.get('opportunities_email') and unescape(href[7:].partition('?')[0]).casefold() == identity['opportunities_email'].casefold():
            return match[0]
        if is_mail:
            recipient, separator, query = href[7:].partition('?')
            replacement = 'mailto:' + escape(official, quote=True) + separator + query
            opening = opening.replace(f'href="{href}"', f'href="{replacement}"', 1)
            opening = mark(opening, 'data-contact-owner', 'site')
            # Only matching visible email text in this contact anchor changes;
            # the subject/body query and other people's names/emails are intact.
            old = unescape(recipient)
            parts = re.split(r'(<[^>]*>)', content)
            for i in range(0, len(parts), 2):
                plain = unescape(parts[i]).strip()
                base = re.sub(r'\s*[→←]\s*$', '', plain)
                if base.casefold() == old.casefold():
                    arrow = (' ←' if lang == 'ar' else ' →') if base != plain else ''
                    parts[i] = escape(official + arrow)
                    opening = mark(opening, 'data-site', 'institutional-email')
            content = ''.join(parts)
        target = urlsplit(unescape(href)).path
        if target.rsplit('/', 1)[-1] not in ('contact.html', 'collaborate.html') and not is_mail:
            return match[0]
        # Preserve descriptive research/speaking/partnership calls to action.
        force_label = 'data-site="contact-label"' in opening or bool(re.search(r'\bclass="[^"]*\bsite-contact\b', opening))
        changed_label = False
        def label(text):
            nonlocal changed_label
            plain = unescape(text).strip()
            base = re.sub(r'\s*[→←]\s*$', '', plain)
            if base not in labels and not force_label:
                return text
            arrow = (' ←' if lang == 'ar' else ' →') if base != plain else ''
            changed_label = True
            return escape(identity['contact_label'][lang] + arrow)
        if '<' not in content:
            content = label(content)
        else:
            content = re.sub(r'(<b>)([^<]+)(</b>)', lambda m: m[1] + label(m[2]) + m[3], content)
        if changed_label:
            opening = mark(opening, 'data-site', 'contact-label')
        return opening + content + closing
    source = ANCHOR.sub(link, source)
    # An old CV header listed both addresses on consecutive lines.
    duplicate = rf'(<a\b[^>]*href="mailto:{re.escape(official)}"[^>]*>{re.escape(official)}</a>)<br>\s*\1'
    return re.sub(duplicate, r'\1', source)


def standardize_experience(source, identity, lang):
    # Replace known headline/prose variants; do not change unrelated durations.
    experience = identity['experience']
    for old in experience['legacy_labels']:
        source = source.replace(old, experience['label'][lang])
    for old in experience['legacy_prose']:
        source = source.replace(old, experience['prose'][lang])
    return source


def synchronize(source, page, lang, identity=None):
    identity = identity or read_identity()
    source = strip_generated(source)
    source = standardize_contacts(source, identity, lang)
    source = standardize_experience(source, identity, lang)

    if page in ('about.html', 'impact.html'):
        source = re.sub(r'<section class="metric-strip">.*?</section>', '', source, flags=re.S)
        source = re.sub(r'<p class="evidence-note">.*?</p>', '', source, flags=re.S)
        source, count = re.subn(r'(<main\b[^>]*>)', lambda m: m[1] + metric_strip(identity, lang), source, count=1)
        if count != 1:
            raise ValueError(f'{page}: metric insertion target missing')

    if page in ('index.html', 'about.html', 'master-cv.html', 'executive-cv.html', 'academic-cv.html'):
        source = re.sub(r'<div class="cv-purpose">.*?</div>', '', source, flags=re.S)
        guide = cv_guidance(identity, lang)
        if page == 'index.html':
            # The homepage hero has one flat action group.
            source, count = re.subn(r'(<div class="actions">.*?</div>)', lambda m: m[1] + guide, source, count=1, flags=re.S)
        elif page in ('about.html', 'master-cv.html'):
            source, count = re.subn(r'(<div class="hero-actions">.*?</div>)', lambda m: m[1] + guide, source, count=1, flags=re.S)
        else:
            source, count = re.subn(r'(<article class="cv-sheet">)', lambda m: guide + m[1], source, count=1)
        if count != 1:
            raise ValueError(f'{page}: CV guide insertion target missing')

    if page == 'executive-cv.html':
        # A fixed platform total mixed concepts, ventures and live systems.
        metric = next(x for x in identity['evidence']['metrics'] if x['id'] == 'translation')
        source = re.sub(r'<div class="cv-box"><b>(?:5 (?:AI )?Platforms|5 منصات|Research Translation|تحويل البحث إلى تطبيق)</b><span>.*?</span></div>',
                        f'<div class="cv-box"><b>{escape(metric["headline"][lang])}</b><span>{escape(metric["scope"][lang])}</span></div>', source, flags=re.S)
        source, count = re.subn(r'(</article>\s*</main>)', lambda m: evidence_notes(identity, lang) + m[1], source, count=1)
        if count != 1:
            raise ValueError('Executive CV: provenance insertion target missing')

    # The available master record aggregates platform reach; do not assign the
    # entire figure to SHIFAA in the Impact narrative.
    if page == 'impact.html':
        new = ('Patient-facing digital platform created within hospital modernization.' if lang == 'en' else
               'منصة رقمية موجهة للمرضى أُنشئت ضمن تحديث أنظمة المستشفى.')
        source = re.sub(r'(<div class="now-item"><b>SHIFAA</b><span>).*?(</span>)',
                        lambda m: m[1] + escape(new) + m[2], source, flags=re.S)
    return source


def build():
    # localize_site's main guard makes importing the registered page list safe.
    from localize_site import PAGES
    identity = read_identity()
    changed = 0
    for page in PAGES:
        for lang in ('en', 'ar'):
            target = ROOT / (('ar/' if lang == 'ar' else '') + page)
            source = target.read_text()
            updated = synchronize(source, page, lang, identity)
            if updated != source:
                target.write_text(updated)
                changed += 1
    print(f'Synchronized shared identity in {len(PAGES) * 2} pages; changed {changed}.')


if __name__ == '__main__':
    build()
