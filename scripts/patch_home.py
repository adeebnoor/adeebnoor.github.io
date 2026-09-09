from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Keep the approved visual homepage. Only add metadata and small functional overlays.
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

# Remove the previous top-left identity patch so the original ADEEB NOOR brand is visible again.
s = re.sub(r'<div class="identity-label"[^>]*>.*?</div>\s*', '', s, count=1, flags=re.S)
s = re.sub(r'<a class="writing-tab"[^>]*>.*?</a>\s*', '', s, count=1, flags=re.S)

# Add Writing as a real top-nav item by replacing the baked Contact label visually.
# Contact remains available through the Let's Connect button.
nav_css = '''.writing-nav-home{position:absolute;left:63.25%;top:.62%;width:6.15%;height:3.25%;z-index:40;display:flex;align-items:center;justify-content:center;background:rgba(8,20,28,.985);color:#f4eee4;text-decoration:none;font:600 clamp(7px,.69vw,11px)/1 Arial,Helvetica,sans-serif}.writing-nav-home:hover{color:#d8ad58}.writing-nav-home:after{content:"";position:absolute;left:24%;right:24%;bottom:11%;height:1px;background:#d8ad58;opacity:.0}.writing-nav-home:hover:after{opacity:1}@media(max-width:700px){.writing-nav-home{display:none}}'''
marker = '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}'
if '.writing-nav-home{' not in s:
    s = s.replace(marker, marker + nav_css, 1)

writing_link = '<a class="writing-nav-home" href="writing/" aria-label="Writing">Writing</a>'
if 'class="writing-nav-home"' not in s:
    s = s.replace('<div class="stage">\n', '<div class="stage">\n' + writing_link + '\n', 1)

# Ensure Impact points to the expanded Impact/CV area.
old_impact = '<div class="navgroup ng-impact"><a class="hit navhit impact" href="collaborate.html" aria-label="Impact"></a><div class="dropdown"><a href="collaborate.html#researchers">For Researchers</a><a href="collaborate.html#organizations">For Organizations</a><a href="collaborate.html#investors">For Investors & Partners</a></div></div>'
new_impact = '<div class="navgroup ng-impact"><a class="hit navhit impact" href="impact.html" aria-label="Impact"></a><div class="dropdown"><a href="impact.html">Impact Overview</a><a href="master-cv.html">Master CV</a><a href="executive-cv.html">Executive CV</a><a href="academic-cv.html">Academic CV</a></div></div>'
if old_impact in s:
    s = s.replace(old_impact, new_impact, 1)

# Accessible heading/metadata only; does not change the approved visual composition.
s = s.replace('<h1>Adeeb Noor — Professor, Researcher, Builder</h1>', '<h1>Adeeb Noor — Saudi Professor of Data Science and Artificial Intelligence</h1>', 1)

p.write_text(s, encoding='utf-8')
print('Approved homepage preserved: ADEEB NOOR restored at top-left and Writing added to top navigation.')
