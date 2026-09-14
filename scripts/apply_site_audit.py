"""Audit entry point. All source is versioned as normal, readable repository files."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(ROOT/'scripts/record_essay_dates.py')],cwd=ROOT,check=True)
