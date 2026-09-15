"""Last-pass language guard for the generated public portfolio."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = 'Professor of Data Science &amp; AI, King Abdulaziz University'
AR = 'أستاذ علوم البيانات والذكاء الاصطناعي، جامعة الملك عبدالعزيز'
ROLE_VARIANTS = (
    'Professor · Researcher · Builder',
    'Professor · Researcher · Advisor',
    'Professor · Executive Advisor · Builder',
    'Professor of Data Science & AI, King Abdulaziz University',
    'Professor of Data Science &amp; AI, King Abdulaziz University',
    'أستاذ دكتور · باحث · مستشار',
    'أستاذ دكتور · مستشار تنفيذي · مؤسس مشاريع',
    'أستاذ · باحث · مؤسس',
    'أستاذ علوم البيانات والذكاء الاصطناعي، جامعة الملك عبدالعزيز',
)

for path in ROOT.rglob('*.html'):
    if any(part in {'.git', 'node_modules', 'audit-artifacts'} for part in path.parts):
        continue
    relative = path.relative_to(ROOT)
    arabic = relative.parts and relative.parts[0] == 'ar'
    target = AR if arabic else EN
    source = path.read_text()
    for old in ROLE_VARIANTS:
        source = source.replace(old, target)
    path.write_text(source)

# Guard the language-sensitive public identity after every build.
for path in ROOT.rglob('*.html'):
    if any(part in {'.git', 'node_modules', 'audit-artifacts'} for part in path.parts):
        continue
    relative = path.relative_to(ROOT)
    source = path.read_text()
    if relative.parts and relative.parts[0] == 'ar':
        if 'Professor of Data Science &amp; AI, King Abdulaziz University' in source or 'Professor of Data Science & AI, King Abdulaziz University' in source:
            raise SystemExit(f'{relative}: English professional title leaked into Arabic page')

print('Finalized language-specific professional identity.')
