from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parents[1]
parts = [
    ROOT / '.site-update' / 'opportunities-bootstrap-1a.b64',
    ROOT / '.site-update' / 'opportunities-bootstrap-1b.b64',
    ROOT / '.site-update' / 'opportunities-bootstrap-2.b64',
    ROOT / '.site-update' / 'opportunities-bootstrap-3.b64',
]
encoded = ''.join(path.read_text().strip() for path in parts)
source = base64.b64decode(encoded).decode('utf-8')
exec(compile(source, str(ROOT / 'scripts' / 'build_opportunities.py'), 'exec'), globals())
