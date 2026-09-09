from pathlib import Path

pages = [
    'about.html','research.html','publications.html','ventures.html','teaching.html',
    'phd.html','speaking.html','impact.html','master-cv.html','executive-cv.html',
    'academic-cv.html','collaborate.html','404.html'
]
old = '<p>King Abdulaziz University · Jeddah, Saudi Arabia</p>'
new = '<p>Saudi National · King Abdulaziz University · Jeddah, Saudi Arabia</p>'
writing_nav = '<div class="navitem"><a href="writing/">Writing</a></div>'

for name in pages:
    p = Path(name)
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if 'Saudi National · King Abdulaziz University' not in s:
        s = s.replace(old, new)
    if 'href="writing/"' not in s:
        marker = '<div class="navitem"><a href="collaborate.html">Collaborate</a></div>'
        if marker in s:
            s = s.replace(marker, writing_nav + marker, 1)
        else:
            marker = '<div class="navitem"><a href="collaborate.html">Contact</a></div>'
            if marker in s:
                s = s.replace(marker, writing_nav + marker, 1)
    p.write_text(s, encoding='utf-8')
print('Saudi nationality marker and Writing navigation applied across inner pages.')