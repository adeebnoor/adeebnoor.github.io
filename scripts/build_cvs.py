import json, html
from pathlib import Path

D=json.loads(Path('data/master_cv.json').read_text(encoding='utf-8'))
I=D['identity']

def esc(x): return html.escape(str(x))
def nav():
    return '<div class="top"><div class="wrap nav"><a class="brand" href="index.html">ADEEB NOOR</a><nav class="menu"><div class="navitem"><a href="index.html">Home</a></div><div class="navitem"><a href="about.html">About</a></div><div class="navitem"><a href="research.html">Research</a></div><div class="navitem"><a href="ventures.html">Ventures</a></div><div class="navitem"><a href="teaching.html">Teaching</a></div><div class="navitem"><a href="impact.html">Impact</a></div><div class="navitem"><a href="collaborate.html">Collaborate</a></div></nav></div></div>'

def top(mode):
    labels={'master':'Master CV','executive':'Executive CV','academic':'Academic CV'}
    other=[]
    for k in ('master','executive','academic'):
        if k!=mode: other.append(f'<a href="{k}-cv.html">{labels[k]}</a>')
    return f'<main class="cv-wrap"><div class="cv-toolbar"><div><b>{labels[mode]} · web / print version</b><div class="cv-note">Generated from one canonical master profile. Use Print / Save PDF for a PDF copy.</div></div><div class="actions">{"".join(other)}<a href="impact.html">Impact</a><button class="primary" onclick="window.print()">Print / Save PDF</button></div></div><article class="cv-sheet">'

def head(mode):
    role={'master':'Comprehensive master record','executive':'Strategy · AI · Transformation · Ventures','academic':'Research · Teaching · Translation'}[mode]
    return f'<header class="cv-head"><div><h1>{esc(I["name"])}</h1><div class="cv-title">Saudi National · {esc(I["title"])}</div><div class="cv-note">{role}</div></div><div class="cv-contact">{esc(I["location"])}<br><a href="mailto:{esc(I["email"])}">{esc(I["email"])}</a><br><a href="{I["linkedin"]}">LinkedIn</a> · <a href="{I["scholar"]}">Google Scholar</a></div></header>'

def section(title, body): return f'<section class="cv-section"><h2>{esc(title)}</h2>{body}</section>'
def p(text, cls=''): return f'<p class="{cls}">{esc(text)}</p>'
def boxes(items): return '<div class="cv-grid">'+''.join(f'<div class="cv-box"><b>{esc(a)}</b><span>{esc(b)}</span></div>' for a,b in items)+'</div>'
def tags(items): return '<div class="cv-tags">'+''.join(f'<span class="cv-tag">{esc(x)}</span>' for x in items)+'</div>'
def bullets(items): return '<ul class="cv-bullets">'+''.join(f'<li>{esc(x)}</li>' for x in items)+'</ul>'

def roles(aud):
    out=[]
    for e in D['experience']:
        if aud in e['audiences'] or aud=='master':
            desc=' '.join('• '+b for b in e['bullets'])
            out.append(f'<div class="cv-role"><div class="cv-when">{esc(e["date"])}</div><div><h3>{esc(e["title"])}</h3><p><b>{esc(e["org"])}</b><br>{esc(desc)}</p></div></div>')
    return ''.join(out)

def education():
    return ''.join(f'<div class="cv-role"><div class="cv-when">{esc(y)}</div><div><h3>{esc(deg)}</h3><p><b>{esc(org)}</b>{("<br>"+esc(note)) if note else ""}</p></div></div>' for y,deg,org,note in D['education'])

def profiles():
    xs=[('Google Scholar',I['scholar']),('LinkedIn',I['linkedin']),('ResearchGate',I['researchgate']),('KAUST Profile',I['kaust']),('Website',I['website'])]
    return '<div class="cv-links">'+''.join(f'<a href="{url}"><b>{esc(lbl)}</b><span>Open profile →</span></a>' for lbl,url in xs)+'</div>'

def render(mode):
    title={'master':'Master CV','executive':'Executive CV','academic':'Academic CV'}[mode]
    meta=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{title} of Adeeb Noor — Saudi Professor of Data Science and Artificial Intelligence."><title>{title} — Adeeb Noor</title><link rel="canonical" href="https://adeebnoor.github.io/{mode}-cv.html"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="inner.css"><link rel="stylesheet" href="cv.css"></head><body>'''
    parts=[meta,nav(),top(mode),head(mode)]
    if mode=='academic':
        parts += [section('Academic Profile',p('Researcher and professor working across artificial intelligence, decision intelligence, biomedical informatics, digital health, software engineering and AI-enabled education. The central theme is the gap between technical representation and real-world action: what aggregate metrics hide, what incomplete knowledge changes, and how systems behave once embedded in consequential decisions.','cv-summary')), section('Research Programs', boxes(D['research'])), section('Academic & Research Experience', roles('academic')), section('Education',education()), section('Research Impact',bullets(D['research_impact'])), section('Selected Awards',bullets(D['awards'])), section('Professional Development',bullets(D['certifications'])), section('Identity & Languages',bullets(['Nationality: Saudi']+D['languages'])), section('Scholarly Profiles',profiles())]
    elif mode=='executive':
        parts += [section('Executive Profile',p(D['summary'],'cv-summary')), section('Scale & Impact',boxes(D['metrics'])), section('Core Executive Domains',tags(D['competencies'])), section('Leadership Experience',roles('executive')), section('Board, Governance & Strategic Committees',bullets(D['governance'])), section('Systems & Ventures',boxes(D['ventures'])), section('Selected Strategic Initiatives',bullets(D['initiatives'])), section('Education',education()), section('Awards & Recognition',bullets(D['awards'])), section('Certifications & Professional Development',bullets(D['certifications'])), section('Languages & Identity',bullets(['Nationality: Saudi']+D['languages'])), section('Profiles',profiles())]
    else:
        parts += [section('Executive Profile',p(D['summary'],'cv-summary')), section('Scale & Impact',boxes(D['metrics'])), section('Core Competencies',tags(D['competencies'])), section('Professional Experience',roles('master')), section('Board, Governance & Strategic Committees',bullets(D['governance'])), section('Entrepreneurial & Commercial Track Record',boxes(D['ventures'])), section('Selected Strategic Initiatives & Pipeline',bullets(D['initiatives'])), section('Research & Scholarly Impact',bullets(D['research_impact'])+boxes(D['research'])), section('Education',education()), section('Awards & Recognition',bullets(D['awards'])), section('Certifications & Professional Development',bullets(D['certifications'])), section('Selected Endorsement',p(D['endorsement'],'cv-summary')), section('Languages & Identity',bullets(['Nationality: Saudi']+D['languages'])), section('Profiles',profiles())]
    parts += ['</article></main><footer class="footer"><div class="wrap"><div class="fine"><span>© 2026 Adeeb Noor</span><span>Saudi National · Generated from master CV data</span></div></div></footer></body></html>']
    return ''.join(parts)

for mode in ('master','executive','academic'):
    Path(f'{mode}-cv.html').write_text(render(mode),encoding='utf-8')
print('Generated master-cv.html, executive-cv.html and academic-cv.html from data/master_cv.json')
