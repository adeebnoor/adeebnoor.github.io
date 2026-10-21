"""Publish a post to LinkedIn through the official Share API, then record it on the site.

Usage: python scripts/linkedin_publish.py <path-to-github-event.json>
Secrets (environment): LINKEDIN_ACCESS_TOKEN (w_member_social), LINKEDIN_PERSON_URN
(urn:li:person:...). Optional: LINKEDIN_VERSION (YYYYMM API version; defaults to
last month), LINKEDIN_DRY_RUN=1 to validate and print the request without posting.

The issue body is untrusted text; only plain text and one https link are used.
On failure the reason is written to error.txt and the exit code is 1.
"""
from pathlib import Path
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import json
import os
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from add_linkedin_post import DATA, fields, clean_text  # noqa: E402

API = 'https://api.linkedin.com/rest/posts'
MAX_CHARS = 3000
SPECIAL = set('\\|{}@[]()<>#*_~')


def fail(message):
    Path('error.txt').write_text(message + '\n', encoding='utf-8')
    sys.exit(message)


def little_text(text):
    # LinkedIn's "little text" format: escape its control characters, keep #hashtags live.
    out = []
    for token in re.split(r'(#[\w؀-ۿ]+)', text):
        if token.startswith('#') and len(token) > 1:
            out.append('{hashtag|\\#|' + token[1:] + '}')
        else:
            out.append(''.join('\\' + ch if ch in SPECIAL else ch for ch in token))
    return ''.join(out)


def api_version():
    value = os.environ.get('LINKEDIN_VERSION', '').strip()
    if re.fullmatch(r'\d{6}', value):
        return value
    first = datetime.now(timezone.utc).replace(day=1)
    return (first - timedelta(days=1)).strftime('%Y%m')


def build(event):
    issue = event.get('issue') or {}
    form = fields(issue.get('body', ''))
    text = clean_text(form.get('post text'))
    if len(text) < 10:
        fail('Please write the post text (at least a sentence).')
    if len(text) > MAX_CHARS:
        fail(f'LinkedIn posts are limited to {MAX_CHARS} characters; this one has {len(text)}.')
    link = (form.get('link (optional)') or '').strip()
    if link in ('', '_No response_'):
        link = ''
    if link and (not link.startswith('https://') or not urlsplit(link).netloc or len(link) > 2048):
        fail('The optional link must be a full https:// address.')
    author = os.environ.get('LINKEDIN_PERSON_URN', '').strip()
    if not re.fullmatch(r'urn:li:person:[A-Za-z0-9_-]{3,64}', author):
        fail('LINKEDIN_PERSON_URN is missing or not of the form urn:li:person:...; run scripts/linkedin_auth.py.')
    payload = {
        'author': author,
        'commentary': little_text(text),
        'visibility': 'PUBLIC',
        'distribution': {'feedDistribution': 'MAIN_FEED', 'targetEntities': [], 'thirdPartyDistributionChannels': []},
        'lifecycleState': 'PUBLISHED',
        'isReshareDisabledByAuthor': False,
    }
    if link:
        payload['content'] = {'article': {'source': link}}
    return text, link, payload


def post(payload):
    token = os.environ.get('LINKEDIN_ACCESS_TOKEN', '').strip()
    if not token:
        fail('LINKEDIN_ACCESS_TOKEN is missing; run scripts/linkedin_auth.py and store the token as a repository secret.')
    request = Request(API, data=json.dumps(payload).encode('utf-8'), method='POST', headers={
        'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0', 'LinkedIn-Version': api_version(),
    })
    try:
        with urlopen(request, timeout=30) as response:
            urn = response.headers.get('x-restli-id', '')
    except HTTPError as error:
        detail = error.read(2000).decode('utf-8', 'replace')
        if error.code == 401:
            fail('LinkedIn rejected the access token (expired or revoked). Run scripts/linkedin_auth.py again and update LINKEDIN_ACCESS_TOKEN.')
        fail(f'LinkedIn returned HTTP {error.code}: {detail}')
    if not re.fullmatch(r'urn:li:(?:share|ugcPost|activity):\d{6,25}', urn):
        fail('LinkedIn accepted the post but returned no post id; check LinkedIn and add the link through the "LinkedIn post" form.')
    return urn


def record(urn, text):
    data = json.loads(DATA.read_text(encoding='utf-8'))
    url = f'https://www.linkedin.com/feed/update/{urn}/'
    lang = 'ar' if re.search(r'[؀-ۿ]', text) else 'en'
    data['posts'] = [p for p in data['posts'] if p['url'] != url]
    data['posts'].append({'url': url, 'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'), 'lang': lang, 'text': text, 'source': 'site'})
    data['posts'] = sorted(data['posts'], key=lambda p: p['date'], reverse=True)[:30]
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return url


def main(event_path):
    event = json.loads(Path(event_path).read_text(encoding='utf-8'))
    text, link, payload = build(event)
    if os.environ.get('LINKEDIN_DRY_RUN') == '1':
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return
    urn = post(payload)
    url = record(urn, text)
    Path('post-url.txt').write_text(url + '\n', encoding='utf-8')
    print(f'Published to LinkedIn: {url}')


if __name__ == '__main__':
    main(sys.argv[1])
