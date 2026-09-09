from pathlib import Path

p = Path('impact.html')
s = p.read_text(encoding='utf-8')

s = s.replace(
    '<div class="hero-actions"><a class="primary" href="executive-cv.html">Executive CV →</a><a href="academic-cv.html">Academic CV →</a><a href="collaborate.html">Work with me →</a></div>',
    '<div class="hero-actions"><a class="primary" href="master-cv.html">Master CV →</a><a href="executive-cv.html">Executive CV →</a><a href="academic-cv.html">Academic CV →</a><a href="collaborate.html">Work with me →</a></div>'
)

s = s.replace(
    '<div class="navitem"><a href="impact.html">Impact</a><div class="drop"><a href="impact.html">Impact Overview</a><a href="executive-cv.html">Executive CV</a><a href="academic-cv.html">Academic CV</a></div></div>',
    '<div class="navitem"><a href="impact.html">Impact</a><div class="drop"><a href="impact.html">Impact Overview</a><a href="master-cv.html">Master CV</a><a href="executive-cv.html">Executive CV</a><a href="academic-cv.html">Academic CV</a></div></div>'
)

s = s.replace(
    '<div class="profile-links"><a href="executive-cv.html"><b>Executive CV</b><span>Leadership · strategy · transformation · ventures →</span></a>',
    '<div class="profile-links"><a href="master-cv.html"><b>Master CV</b><span>Complete canonical record · one source of truth →</span></a><a href="executive-cv.html"><b>Executive CV</b><span>Leadership · strategy · transformation · ventures →</span></a>'
)

p.write_text(s, encoding='utf-8')
print('Master CV links added to Impact page.')
