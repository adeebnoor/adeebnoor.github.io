"""One build entry point for the public, bilingual portfolio.

Identity is applied last so legacy source pages cannot reintroduce old contact
details. The CI check runs this command and rejects unpublished generated drift.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

for script in ('localize_site.py', 'build_featured_projects.py',
               'build_homepage_positioning.py', 'build_ideas.py', 'sync_identity.py'):
    subprocess.run([sys.executable, str(ROOT/'scripts'/script)], cwd=ROOT, check=True)
