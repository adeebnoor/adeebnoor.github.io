from pathlib import Path
import re

pages = [
    'about.html','research.html','publications.html','ventures.html','teaching.html',
    'phd.html','speaking.html','impact.html','master-cv.html','executive-cv.html',
    'academic-cv.html','collaborate.html','404.html'
]

nav = '''<nav class="menu">
<div class="navitem"><a href="index.html">Home</a></div>
<div class="navitem"><a href="research.html">Research</a><div class="drop"><a href="research.html">Research Overview</a><a href="publications.html">Publications & Profiles</a><a href="demo/">RIDI Interactive Demo</a></div></div>
<div class="navitem"><a href="ventures.html">Ventures</a><div class="drop"><a href="ventures.html">Venture Portfolio</a><a href="ventures.html#genomefit">GenomeFit</a><a href="healthx/">HEALTHx</a><a href="ventures.html#shifaa">SHIFAA</a></div></div>
<div class="navitem"><a href="teaching.html">Teaching</a><div class="drop"><a href="teaching.html">Teaching Overview</a><a href="https://adeebnoor.github.io/CPIT/">CPIT-455</a><a href="teaching.html#iscarb">iSCARB</a></div></div>
<div class="navitem"><a href="impact.html">Impact</a><div class="drop"><a href="impact.html">Impact Overview</a><a href="master-cv.html">Master CV</a><a href="executive-cv.html">Executive CV</a><a href="academic-cv.html">Academic CV</a></div></div>
<div class="navitem"><a href="writing/">Writing</a></div>
<div class="navitem"><a href="about.html">About</a><div class="drop"><a href="about.html">Profile & Experience</a><a href="phd.html">Doctoral Foundations</a><a href="speaking.html">Speaking & Media</a></div></div>
<div class="navitem"><a class="connect" href="collaborate.html">Professional Inquiries →</a></div>
</nav>'''

for name in pages:
    p = Path(name)
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'<nav class="menu">.*?</nav>', nav, s, count=1, flags=re.S)
    s = s.replace("Let's Connect →", 'Professional Inquiries →')
    s = s.replace('17+ Years', '18+ Years')
    s = s.replace('17+ years', '18+ years')
    s = s.replace('17+ years of', '18+ years of')
    s = s.replace('King Abdulaziz University · Jeddah, Saudi Arabia</p>', 'Saudi National · King Abdulaziz University · Jeddah, Saudi Arabia</p>')

    if name == 'ventures.html':
        s = s.replace('href="mailto:adeeb.noor@gmail.com?subject=HEALTHx%20Partnership">Discuss HEALTHx →</a>', 'href="healthx/">View HEALTHx Project →</a>')
        s = s.replace('<a class="primary" href="mailto:adeeb.noor@gmail.com?subject=HEALTHx%20Partnership">Discuss HEALTHx →</a>', '<a class="primary" href="healthx/">View HEALTHx Project →</a>')

    p.write_text(s, encoding='utf-8')

print('Site navigation standardized: Home, Research, Ventures, Teaching, Impact, Writing, About; formal Professional Inquiries CTA; 18+ years; HEALTHx linked.')
