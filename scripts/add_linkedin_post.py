"""Add a LinkedIn post to data/linkedin-posts.json from a GitHub issue-form event.

Usage: python scripts/add_linkedin_post.py <path-to-event.json>
The issue body is untrusted text; only a validated LinkedIn post URL, a date and
plain text are kept. Exits non-zero with a message when the input is invalid.
"""
from pathlib import Path
from datetime import datetime
import json
import re
import sys
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'linkedin-posts.json'
URL = re.compile(r'^https://(?:www\.)?linkedin\.com/(posts/[A-Za-z0-9_%\-]{3,300}|feed/update/urn:li:(?:activity|share|ugcPost):\d{6,25})/?$')
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def fields(body):
    # GitHub issue forms render each field as "### Label" followed by its value.
    out, key = {}, None
    for line in (body or '').splitlines():
        heading = re.match(r'^###\s+(.+?)\s*$', line)
        if heading:
            key = heading.group(1).strip().lower()
            out[key] = []
        elif key is not None:
            out[key].append(line)
    return {k: '\n'.join(v).strip() for k, v in out.items()}


def clean_text(value):
    value = '' if value in (None, '_No response_') else value
    value = ''.join(ch for ch in value if ch in '\n\t' or unicodedata.category(ch)[0] != 'C')
    value = re.sub(r'\n{3,}', '\n\n', value).strip()
    return value[:3000]


def main(event_path):
    event = json.loads(Path(event_path).read_text(encoding='utf-8'))
    issue = event.get('issue') or {}
    form = fields(issue.get('body', ''))
    url = (form.get('post link') or '').strip().split('?')[0].split('#')[0]
    if not URL.match(url):
        sys.exit('The post link must be a public LinkedIn post URL (linkedin.com/posts/... or linkedin.com/feed/update/urn:li:activity:...).')
    text = clean_text(form.get('post text'))
    if len(text) < 10:
        sys.exit('Please paste the post text (at least a sentence) so the site can show an excerpt.')
    date = (form.get('date (optional)') or '').strip()
    if date in ('', '_No response_'):
        date = (issue.get('created_at') or datetime.utcnow().isoformat())[:10]
    if not DATE.match(date):
        sys.exit('The date must look like 2026-10-21.')
    data = json.loads(DATA.read_text(encoding='utf-8'))
    posts = [p for p in data['posts'] if p['url'] != url]
    lang = 'ar' if re.search(r'[؀-ۿ]', text) else 'en'
    posts.append({'url': url, 'date': date, 'lang': lang, 'text': text})
    data['posts'] = sorted(posts, key=lambda p: p['date'], reverse=True)[:30]
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Added LinkedIn post from {date}: {url}')


if __name__ == '__main__':
    main(sys.argv[1])
