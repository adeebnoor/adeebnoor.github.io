from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parts = [ROOT / '.site-update' / f'opportunities-source-{i}.part' for i in range(1, 7)]
source = ''.join(path.read_text() for path in parts)
exec(compile(source, str(ROOT / 'scripts' / 'build_opportunities.py'), 'exec'), globals())
