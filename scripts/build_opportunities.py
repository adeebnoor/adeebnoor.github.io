from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parents[1]
encoded = ''.join((ROOT / '.site-update' / f'opportunities-bootstrap-{i}.b64').read_text().strip() for i in (1,2,3))
source = base64.b64decode(encoded).decode('utf-8')
exec(compile(source, str(ROOT / 'scripts' / 'build_opportunities.py'), 'exec'), globals())
