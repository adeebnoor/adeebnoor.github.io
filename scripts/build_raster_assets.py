"""Materialize binary image assets from text-safe build payloads."""
from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'sultan-card.webp.b64'
TARGET = ROOT / 'assets' / 'sultan-strategy-logo.webp'

payload = ''.join(SOURCE.read_text(encoding='utf-8').split())
data = base64.b64decode(payload, validate=True)
if not (data.startswith(b'RIFF') and data[8:12] == b'WEBP'):
    raise ValueError('Decoded SULTAN asset is not a valid WebP container')

if not TARGET.exists() or TARGET.read_bytes() != data:
    TARGET.write_bytes(data)
    print(f'Wrote {TARGET.relative_to(ROOT)} ({len(data)} bytes).')
else:
    print(f'{TARGET.relative_to(ROOT)} already current.')
