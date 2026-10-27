"""Add LinkedIn posts to data/linkedin-posts.json from a GitHub issue-form event.

Usage: python scripts/add_linkedin_post.py <path-to-event.json>

The form needs only the post link(s), one per line. For each link the public post
page on linkedin.com is read to get the text and the publish date; pasted text and
a typed date, when given, take precedence (they apply to a single link). A post is
shown only when its public page names the site owner's profile as the author.

The issue body and the fetched page are untrusted: only a validated LinkedIn post
URL, an ISO date and plain text are kept. Exits non-zero with a message when
nothing could be added; partial results are reported line by line.
"""
from pathlib import Path
from datetime import datetime, timezone
from html import unescape
from urllib.request import Request, urlopen
import json
import re
import sys
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'linkedin-posts.json'
URL = re.compile(r'^https://(?:www\.)?linkedin\.com/(posts/[A-Za-z0-9_%\-]{3,300}|feed/update/urn:li:(?:activity|share|ugcPost):\d{6,25})/?$')
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
OWNER = 'adeeb-noor'          # linkedin.com/in/<OWNER>
MAX_PAGE = 2_000_000


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


def post_id(url):
    m = re.search(r'(?:urn:li:(?:activity|share|ugcPost):|-(?:activity|share|ugcPost)-)(\d{15,25})', url)
    return int(m.group(1)) if m else None


def date_from_id(number):
    # LinkedIn post ids carry their creation time in the high bits (milliseconds since 1970).
    try:
        moment = datetime.fromtimestamp((number >> 22) / 1000, timezone.utc)
    except (OverflowError, OSError, ValueError):
        return ''
    return moment.strftime('%Y-%m-%d') if 2003 <= moment.year <= datetime.now(timezone.utc).year else ''


def fetch(url):
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; adeebnoor.github.io post importer)', 'Accept-Language': 'en-US,en;q=0.8,ar;q=0.6'})
    with urlopen(request, timeout=30) as response:
        if not response.geturl().startswith('https://www.linkedin.com/'):
            raise ValueError('LinkedIn redirected away from the post (it may be private or deleted).')
        return response.read(MAX_PAGE).decode('utf-8', 'replace')


def read_public_post(page):
    """Return (text, date, canonical_url, author_ok) from a public LinkedIn post page."""
    text = ''
    m = re.search(r'class="[^"]*attributed-text-segment-list__content[^"]*"[^>]*>(.*?)</p>', page, re.S)
    if m:
        text = re.sub(r'<br\s*/?>', '\n', m.group(1))
        text = unescape(re.sub(r'<[^>]+>', '', text))
    if not text.strip():
        m = re.search(r'<meta property="og:description" content="([^"]*)"', page)
        text = unescape(m.group(1)) if m else ''
    m = re.search(r'"datePublished":"(\d{4}-\d{2}-\d{2})', page)
    date = m.group(1) if m else ''
    m = re.search(r'<link rel="canonical" href="(https://www\.linkedin\.com/posts/[^"]+)"', page)
    canonical = m.group(1) if m else ''
    author_ok = f'linkedin.com/in/{OWNER}' in page and (not canonical or f'/posts/{OWNER}_' in canonical)
    return clean_text(text), date, canonical, author_ok


def key(text):
    return re.sub(r'\s+', ' ', text).strip()[:200]


def main(event_path, fetcher=fetch):
    event = json.loads(Path(event_path).read_text(encoding='utf-8'))
    issue = event.get('issue') or {}
    form = fields(issue.get('body', ''))
    raw = form.get('post links') or form.get('post link') or ''
    links = []
    for line in raw.split():
        link = line.strip().strip('<>').split('?')[0].split('#')[0]
        if link and link not in links:
            links.append(link)
    if not links:
        sys.exit('Paste at least one LinkedIn post link (… menu on the post → Copy link to post).')
    pasted = clean_text(form.get('post text'))
    typed_date = (form.get('date (optional)') or '').strip()
    typed_date = '' if typed_date == '_No response_' else typed_date
    if typed_date and not DATE.match(typed_date):
        sys.exit('The date must look like 2026-10-21.')
    single = len(links) == 1

    data = json.loads(DATA.read_text(encoding='utf-8'))
    posts = data['posts']
    report, added = [], 0
    for link in links:
        if not URL.match(link):
            report.append(f'- Skipped {link}: not a public LinkedIn post link.')
            continue
        text, date, canonical = (pasted if single else ''), (typed_date if single else ''), ''
        if not text or not date:
            try:
                page_text, page_date, canonical, author_ok = read_public_post(fetcher(link))
            except Exception as error:  # network, private post, redirect
                if not text:
                    report.append(f'- Skipped {link}: the public post page could not be read ({error}). Paste the text in the form to add it anyway.')
                    continue
                page_text, page_date, author_ok = '', '', True
            if not author_ok:
                report.append(f'- Skipped {link}: LinkedIn does not show this post as written by linkedin.com/in/{OWNER}.')
                continue
            text = text or page_text
            date = date or page_date
        if len(text) < 10:
            report.append(f'- Skipped {link}: no post text found. Paste the text in the form to add it.')
            continue
        number = post_id(canonical) or post_id(link)
        date = date or (date_from_id(number) if number else '') or (issue.get('created_at') or datetime.now(timezone.utc).isoformat())[:10]
        url = link
        same = [p for p in posts if p['url'] in (link, canonical) or key(p.get('text', '')) == key(text)]
        if same:
            url = same[0]['url']      # keep the link already shown on the site
        posts = [p for p in posts if p not in same]
        lang = 'ar' if len(re.findall(r'[؀-ۿ]', text)) > len(re.findall(r'[A-Za-z]', text)) else 'en'
        entry = {'url': url, 'date': date, 'lang': lang, 'text': text, 'source': 'linkedin'}
        if same and same[0].get('source') == 'site':
            entry['source'] = 'site'
        posts.append(entry)
        added += 1
        report.append(f'- {"Updated" if same else "Added"} the post from {date}: {url}')

    if not added:
        sys.exit('No post was added:\n' + '\n'.join(report))
    data['posts'] = sorted(posts, key=lambda p: p['date'], reverse=True)[:30]
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    Path('report.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
    print('\n'.join(report))


if __name__ == '__main__':
    main(sys.argv[1])
