"""One build entry point for the public, bilingual portfolio.

Identity is applied last so legacy source pages cannot reintroduce old contact
details. The CI check runs this command and rejects unpublished generated drift.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

# Bootstrap the bilingual advisory/partnership pages before localization sees them.
subprocess.run([sys.executable, str(ROOT/'scripts'/'build_opportunities.py'), '--bootstrap'], cwd=ROOT, check=True)

# Materialize binary assets before any page generator references them. Keep the
# thought-leadership, audience and language guards last: all generated EN/AR
# pages are verified from this final state.
for script in ('build_raster_assets.py', 'localize_site.py', 'build_featured_projects.py',
               'build_homepage_positioning.py', 'build_ideas.py', 'build_analytics.py', 'sync_identity.py', 'build_social_cards.py', 'build_audit.py', 'build_thought_leadership.py', 'build_research_updates.py', 'build_audience_pages.py', 'enable_audience_analytics.py', 'finalize_public_identity.py', 'finalize_portfolio_ux.py', 'build_opportunities.py'):
    subprocess.run([sys.executable, str(ROOT/'scripts'/script)], cwd=ROOT, check=True)
