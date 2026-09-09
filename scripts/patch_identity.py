from pathlib import Path

pages = [
    'research.html','publications.html','ventures.html','teaching.html',
    'phd.html','speaking.html','collaborate.html','404.html'
]
old = '<p>King Abdulaziz University · Jeddah, Saudi Arabia</p>'
new = '<p>Saudi National · King Abdulaziz University · Jeddah, Saudi Arabia</p>'
for name in pages:
    p = Path(name)
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if 'Saudi National · King Abdulaziz University' not in s:
        s = s.replace(old, new)
    p.write_text(s, encoding='utf-8')
print('Saudi nationality marker applied across inner pages.')
