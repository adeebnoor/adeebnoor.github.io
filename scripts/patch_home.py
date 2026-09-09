from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old_desc = '<meta name="description" content="Adeeb Noor — Professor, Researcher, Builder. AI, decision intelligence, digital health, education and institutional transformation.">'
new_meta = '''<meta name="description" content="Adeeb Noor — Saudi Professor of Data Science and Artificial Intelligence. Research, decision intelligence, digital health, education, ventures and institutional transformation.">
<link rel="canonical" href="https://adeebnoor.github.io/">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="manifest" href="site.webmanifest">
<meta property="og:type" content="profile">
<meta property="og:title" content="Adeeb Noor — Professor of Data Science and Artificial Intelligence">
<meta property="og:description" content="Saudi professor, researcher and builder working across AI, decision intelligence, digital health, education, ventures and institutional transformation.">
<meta property="og:url" content="https://adeebnoor.github.io/">
<meta property="og:image" content="https://adeebnoor.github.io/assets/hero-right.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Adeeb Noor — Professor of Data Science and Artificial Intelligence">
<meta name="twitter:description" content="Saudi professor working across AI, decision intelligence, digital health, education, ventures and institutional transformation.">
<meta name="twitter:image" content="https://adeebnoor.github.io/assets/hero-right.webp">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Adeeb Noor","jobTitle":"Professor of Data Science and Artificial Intelligence","nationality":{"@type":"Country","name":"Saudi Arabia"},"url":"https://adeebnoor.github.io/","affiliation":{"@type":"CollegeOrUniversity","name":"King Abdulaziz University"},"sameAs":["https://scholar.google.com/citations?user=XUQD1WAAAAAJ&hl=en","https://www.linkedin.com/in/adeeb-noor","https://www.researchgate.net/profile/Adeeb-Noor-2","https://cemse.kaust.edu.sa/profiles/adeeb-noor"]}</script>'''
if old_desc in s and 'og:title' not in s:
    s = s.replace(old_desc, new_meta, 1)

s = s.replace('Adeeb Noor — Professor of Data Science and Artificial Intelligence. Research, decision intelligence, digital health, education, ventures and institutional transformation.', 'Adeeb Noor — Saudi Professor of Data Science and Artificial Intelligence. Research, decision intelligence, digital health, education, ventures and institutional transformation.')
s = s.replace('Research, decision intelligence, digital health, education, ventures and institutional transformation — from ideas to real-world systems.', 'Saudi professor, researcher and builder working across AI, decision intelligence, digital health, education, ventures and institutional transformation.')
if '"nationality"' not in s and '"jobTitle":"Professor of Data Science and Artificial Intelligence"' in s:
    s = s.replace('"jobTitle":"Professor of Data Science and Artificial Intelligence",', '"jobTitle":"Professor of Data Science and Artificial Intelligence","nationality":{"@type":"Country","name":"Saudi Arabia"},', 1)

css = '.identity-label{position:absolute;left:4.1%;top:.18%;width:24.7%;height:4.05%;z-index:15;display:flex;flex-direction:column;justify-content:center;padding:0 .35%;background:linear-gradient(90deg,rgba(7,17,26,.995),rgba(7,17,26,.965) 88%,rgba(7,17,26,.12));font-family:Arial,Helvetica,sans-serif;line-height:1.08;text-transform:uppercase;white-space:nowrap}.identity-label .nationality{color:#f3eadc;font-size:8.5px;font-weight:600;letter-spacing:.19em;margin-bottom:3px}.identity-label .role{color:#d8ad58;font-size:10px;font-weight:700;letter-spacing:.075em}.identity-label:after{content:"";position:absolute;left:.35%;bottom:8%;width:23%;height:1px;background:#d8ad58;opacity:.7}.writing-tab{position:absolute;right:1.2%;top:4.9%;z-index:24;display:inline-flex;align-items:center;justify-content:center;padding:9px 13px;border:1px solid rgba(216,173,88,.75);background:rgba(7,17,26,.88);color:#e2bc6b;text-decoration:none;font:700 10px/1 Arial,Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 8px 20px rgba(0,0,0,.18)}.writing-tab:hover{background:#d8ad58;color:#07111a}@media(max-width:700px){.writing-tab{display:none}}'
if '.identity-label{' not in s:
    s = s.replace('.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}', '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' + css, 1)
else:
    start = s.find('.identity-label{')
    marker = '@media(max-width:700px)'
    # replace only our injected identity/writing style block if it already exists
    if start != -1:
        # locate end after writing-tab media or identity :after block
        end = s.find('\n', s.find('}', s.find('.identity-label:after{')) + 1)
        if end == -1: end = s.find('</style>')
        s = s[:start] + css + s[end:]

label = '<div class="identity-label" aria-label="Saudi national; Professor of Data Science and Artificial Intelligence"><span class="nationality">Saudi National</span><span class="role">Professor of Data Science and Artificial Intelligence</span></div>'
if 'class="identity-label"' not in s:
    s = s.replace('<div class="stage">\n', '<div class="stage">\n' + label + '\n', 1)
else:
    s = re.sub(r'<div class="identity-label"[^>]*>.*?</div>', label, s, count=1, flags=re.S)

writing = '<a class="writing-tab" href="writing/" aria-label="Writing and essays">Writing →</a>'
if 'class="writing-tab"' not in s:
    s = s.replace(label, label + '\n' + writing, 1)

old_impact = '<div class="navgroup ng-impact"><a class="hit navhit impact" href="collaborate.html" aria-label="Impact"></a><div class="dropdown"><a href="collaborate.html#researchers">For Researchers</a><a href="collaborate.html#organizations">For Organizations</a><a href="collaborate.html#investors">For Investors & Partners</a></div></div>'
new_impact = '<div class="navgroup ng-impact"><a class="hit navhit impact" href="impact.html" aria-label="Impact"></a><div class="dropdown"><a href="impact.html">Impact Overview</a><a href="master-cv.html">Master CV</a><a href="executive-cv.html">Executive CV</a><a href="academic-cv.html">Academic CV</a></div></div>'
if old_impact in s:
    s = s.replace(old_impact, new_impact, 1)

s = s.replace('<h1>Adeeb Noor — Professor, Researcher, Builder</h1>', '<h1>Adeeb Noor — Saudi Professor of Data Science and Artificial Intelligence</h1>', 1)

p.write_text(s, encoding='utf-8')
print('Approved homepage preserved; Saudi identity, Impact/CV links and Writing entry patched in.')
