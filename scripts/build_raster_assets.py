"""Materialize binary image assets from text-safe source files.

GitHub's content API path used by this project writes UTF-8 text. The SULTAN
logo source is therefore kept as an SVG containing an embedded WebP data URI;
this build step extracts the embedded bytes into a normal WebP file so browsers
receive a regular image asset from GitHub Pages.
"""
from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'sultan-strategy-logo.svg'
TARGET = ROOT / 'assets' / 'sultan-strategy-logo.webp'

source = SOURCE.read_text(encoding='utf-8')
marker = 'data:image/webp;base64,'
start = source.find(marker)
if start < 0:
    raise ValueError('SULTAN SVG does not contain the expected embedded WebP data URI')
start += len(marker)
end = source.find('"', start)
if end < 0:
    raise ValueError('SULTAN embedded WebP data URI is not terminated')
payload = ''.join(source[start:end].split())
data = base64.b64decode(payload, validate=True)
if not (data.startswith(b'RIFF') and data[8:12] == b'WEBP'):
    raise ValueError('Decoded SULTAN asset is not a valid WebP container')

if not TARGET.exists() or TARGET.read_bytes() != data:
    TARGET.write_bytes(data)
    print(f'Wrote {TARGET.relative_to(ROOT)} ({len(data)} bytes).')
else:
    print(f'{TARGET.relative_to(ROOT)} already current.')
