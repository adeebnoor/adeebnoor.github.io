from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old_desc = '<meta name="description" content="Adeeb Noor — Professor, Researcher, Builder. AI, decision intelligence, digital health, education and institutional transformation.">'
new_meta = '''<meta name="description" content="Adeeb Noor — Professor of Data Science and Artificial Intelligence. Research, decision intelligence, digital health, education, ventures and institutional transformation.">
<link rel="canonical" href="https://adeebnoor.github.io/">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="manifest" href="site.webmanifest">
<meta property="og:type" content="profile">
<meta property="og:title" content="Adeeb Noor — Professor of Data Science and Artificial Intelligence">
<meta property="og:description" content="Research, decision intelligence, digital health, education, ventures and institutional transformation — from ideas to real-world systems.">
<meta property="og:url" content="https://adeebnoor.github.io/">
<meta property="og:image" content="https://adeebnoor.github.io/assets/hero-right.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Adeeb Noor — Professor of Data Science and Artificial Intelligence">
<meta name="twitter:description" content="Research, decision intelligence, digital health, education, ventures and institutional transformation.">
<meta name="twitter:image" content="https://adeebnoor.github.io/assets/hero-right.webp">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Adeeb Noor","jobTitle":"Professor of Data Science and Artificial Intelligence","url":"https://adeebnoor.github.io/","affiliation":{"@type":"CollegeOrUniversity","name":"King Abdulaziz University"},"sameAs":["https://scholar.google.com/citations?user=XUQD1WAAAAAJ&hl=en","https://www.linkedin.com/in/adeeb-noor","https://www.researchgate.net/profile/Adeeb-Noor-2","https://cemse.kaust.edu.sa/profiles/adeeb-noor"]}</script>'''
if old_desc in s and 'og:title' not in s:
    s = s.replace(old_desc, new_meta, 1)

css = '.identity-label{position:absolute;left:4.1%;top:.35%;width:24.7%;height:3.7%;z-index:15;display:flex;align-items:center;padding:0 .35%;background:linear-gradient(90deg,rgba(7,17,26,.995),rgba(7,17,26,.965) 88%,rgba(7,17,26,.12));color:#d8ad58;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;line-height:1.12;letter-spacing:.115em;text-transform:uppercase;white-space:nowrap}.identity-label:after{content:"";position:absolute;left:.35%;bottom:16%;width:22%;height:1px;background:#d8ad58;opacity:.7}'
if '.identity-label{' not in s:
    s = s.replace('.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}', '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' + css, 1)

label = '<div class="identity-label" aria-label="Professor of Data Science and Artificial Intelligence">Professor of Data Science and Artificial Intelligence</div>'
if 'class="identity-label"' not in s:
    s = s.replace('<div class="stage">\n', '<div class="stage">\n' + label + '\n', 1)

old_impact = '<div class="navgroup ng-impact"><a class="hit navhit impact" href="collaborate.html" aria-label="Impact"></a><div class="dropdown"><a href="collaborate.html#researchers">For Researchers</a><a href="collaborate.html#organizations">For Organizations</a><a href="collaborate.html#investors">For Investors & Partners</a></div></div>'
new_impact = '<div class="navgroup ng-impact"><a class="hit navhit impact" href="impact.html" aria-label="Impact"></a><div class="dropdown"><a href="impact.html">Impact Overview</a><a href="executive-cv.html">Executive CV</a><a href="academic-cv.html">Academic CV</a></div></div>'
if old_impact in s:
    s = s.replace(old_impact, new_impact, 1)

s = s.replace('<h1>Adeeb Noor — Professor, Researcher, Builder</h1>', '<h1>Adeeb Noor — Professor of Data Science and Artificial Intelligence</h1>', 1)

p.write_text(s, encoding='utf-8')
print('Homepage patched for title, Impact, CV links and social metadata.')
