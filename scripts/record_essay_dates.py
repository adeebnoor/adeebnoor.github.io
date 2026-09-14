"""One-time provenance capture from the public site's main-branch history.

Dates are never reset on rebuild. The committer timestamp of the earliest file
addition records the public site repository, not a claimed journal publication.
"""
from pathlib import Path
import subprocess,json
ROOT=Path(__file__).resolve().parents[1]
target=ROOT/'data/essay-dates.json'
if target.exists():
 print('Retained documented essay dates.')
else:
 data=json.loads((ROOT/'data/ideas-content.json').read_text());dates={}
 for article in data['articles']:
  for lang in ('en','ar'):
   path=('ar/' if lang=='ar' else '')+article['path'].lstrip('/')
   entries=subprocess.check_output(['git','log','origin/main','--follow','--diff-filter=A','--format=%cI%x09%H','--',path],cwd=ROOT,text=True).strip().splitlines()
   if not entries:raise RuntimeError('No documented date for '+path)
   timestamp,commit=entries[-1].split('\t')
   dates[path]={'published':timestamp,'source_commit':commit,'basis':'Earliest recorded file addition in the public site main-branch history; not a journal publication date.'}
 target.write_text(json.dumps(dates,ensure_ascii=False,indent=2)+'\n');print('Recorded first site-repository dates for eight language-specific essay URLs.')
