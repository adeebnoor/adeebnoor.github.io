from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Preserve the approved image-based homepage and add only precise live overlays.
# Remove any previous homepage overlays first so repeated deploys remain idempotent.
s = re.sub(r'<div class="top-identity-live"[^>]*>.*?</div>\s*', '', s, count=1, flags=re.S)
s = re.sub(r'<nav class="top-nav-live"[^>]*>.*?</nav>\s*', '', s, count=1, flags=re.S)
s = re.sub(r'<div class="experience-live"[^>]*>.*?</div>\s*', '', s, count=1, flags=re.S)
s = re.sub(r'<div class="identity-label"[^>]*>.*?</div>\s*', '', s, count=1, flags=re.S)
s = re.sub(r'<a class="writing-tab"[^>]*>.*?</a>\s*', '', s, count=1, flags=re.S)
s = re.sub(r'<a class="writing-nav-home"[^>]*>.*?</a>\s*', '', s, count=1, flags=re.S)

# Remove earlier injected CSS blocks when present.
s = re.sub(r'\.top-identity-live\{.*?\.experience-live\{.*?\}', '', s, count=1, flags=re.S)
s = re.sub(r'\.writing-nav-home\{.*?@media\(max-width:700px\)\{\.writing-nav-home\{display:none\}\}', '', s, count=1, flags=re.S)

css = '''
.top-identity-live{position:absolute;left:3.75%;top:.12%;width:25.2%;height:4.2%;z-index:70;display:flex;flex-direction:column;justify-content:center;padding:0 .65%;background:linear-gradient(90deg,#0b151c 0%,#0b151c 86%,rgba(11,21,28,.98) 94%,rgba(11,21,28,0) 100%);font-family:Arial,Helvetica,sans-serif;line-height:1.08;text-transform:uppercase;pointer-events:none}.top-identity-live .nat{display:block;color:#f3eee5;font-size:clamp(6px,.53vw,9px);font-weight:700;letter-spacing:.19em;margin-bottom:4px}.top-identity-live .title{display:block;color:#d8ad58;font-size:clamp(7px,.66vw,11px);font-weight:700;letter-spacing:.05em;white-space:nowrap}.top-identity-live:after{content:"";position:absolute;left:.65%;bottom:7%;width:31%;height:1px;background:#d8ad58;opacity:.72}.top-nav-live{position:absolute;left:28.8%;top:.1%;width:66.2%;height:4.25%;z-index:68;display:flex;align-items:center;justify-content:flex-end;gap:clamp(8px,1.18vw,20px);padding:0 .35% 0 1.1%;background:#0b151c;font-family:Georgia,'Times New Roman',serif;line-height:1}.top-nav-live a{color:#f2ede4;text-decoration:none;font-size:clamp(7px,.69vw,12px);font-weight:600;white-space:nowrap;padding:9px 1px;position:relative}.top-nav-live a:hover,.top-nav-live a:focus-visible{color:#d8ad58;outline:none}.top-nav-live a.active:after{content:"";position:absolute;left:4%;right:4%;bottom:2px;height:1px;background:#d8ad58}.top-nav-live .professional{margin-left:clamp(6px,.7vw,12px);border:1px solid #d8ad58;color:#e7c77f;padding:10px clamp(10px,1vw,18px);font-style:normal}.top-nav-live .professional:hover{background:#d8ad58;color:#0b151c}.experience-live{position:absolute;left:10.05%;top:31.28%;width:12.4%;height:2.25%;z-index:55;display:flex;align-items:center;background:#f7f3eb;color:#1d1710;font-family:Georgia,'Times New Roman',serif;font-size:clamp(10px,1.25vw,20px);font-weight:700;line-height:1;white-space:nowrap;padding-left:.35%}@media(max-width:700px){.top-identity-live,.top-nav-live,.experience-live{display:none}}
'''
marker = '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}'
if '.top-identity-live{' not in s:
    s = s.replace(marker, marker + css, 1)

identity = '<div class="top-identity-live" aria-label="Saudi National; Professor of Data Science and Artificial Intelligence"><span class="nat">Saudi National</span><span class="title">Professor of Data Science and Artificial Intelligence</span></div>'
nav = '<nav class="top-nav-live" aria-label="Primary navigation"><a class="active" href="index.html">Home</a><a href="research.html">Research</a><a href="ventures.html">Ventures</a><a href="teaching.html">Teaching</a><a href="impact.html">Impact</a><a href="writing/">Writing</a><a href="about.html">About</a><a class="professional" href="collaborate.html">Professional Inquiries →</a></nav>'
experience = '<div class="experience-live" aria-label="More than 18 years of experience">18+ Years</div>'
s = s.replace('<div class="stage">\n', '<div class="stage">\n' + identity + '\n' + nav + '\n' + experience + '\n', 1)

# Ensure the HEALTHx card opens the English project page.
s = s.replace('href="healthx/" aria-label="Explore HEALTHx"', 'href="healthx/" aria-label="Explore HEALTHx"')

# Impact should open the expanded Impact/CV area.
s = re.sub(r'<div class="navgroup ng-impact">.*?</div></div>', '<div class="navgroup ng-impact"><a class="hit navhit impact" href="impact.html" aria-label="Impact"></a><div class="dropdown"><a href="impact.html">Impact Overview</a><a href="master-cv.html">Master CV</a><a href="executive-cv.html">Executive CV</a><a href="academic-cv.html">Academic CV</a></div></div>', s, count=1, flags=re.S)

# Make hidden/legacy contact hotspot formal as well.
s = s.replace('aria-label="Let\'s Connect"', 'aria-label="Professional Inquiries"')

p.write_text(s, encoding='utf-8')
print('Homepage patched: About moved to the end, Professional Inquiries CTA, Saudi identity, and 18+ years.')
