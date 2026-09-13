"""Compatibility entry point; all site updates use the canonical full build."""
from pathlib import Path
import runpy

if __name__ == '__main__':
    runpy.run_path(str(Path(__file__).with_name('build_site.py')), run_name='__main__')
