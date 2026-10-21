"""One-time (and every 60 days) LinkedIn authorisation for scripts/linkedin_publish.py.

Run on your own computer:  python scripts/linkedin_auth.py
It asks for the Client ID and Client Secret of your LinkedIn app, opens the
LinkedIn consent page, receives the code on http://localhost:8912/callback,
exchanges it for an access token and prints the two values to store as GitHub
repository secrets: LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN.

The app needs the products "Share on LinkedIn" and "Sign In with LinkedIn using
OpenID Connect", and http://localhost:8912/callback as an authorised redirect URL.
Nothing is written to disk.
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlencode, urlparse, parse_qs
from urllib.request import Request, urlopen
import json
import secrets
import webbrowser

REDIRECT = 'http://localhost:8912/callback'
SCOPES = 'openid profile w_member_social'


def main():
    client_id = input('LinkedIn app Client ID: ').strip()
    client_secret = input('LinkedIn app Client Secret: ').strip()
    state = secrets.token_urlsafe(24)
    url = 'https://www.linkedin.com/oauth/v2/authorization?' + urlencode({
        'response_type': 'code', 'client_id': client_id, 'redirect_uri': REDIRECT, 'state': state, 'scope': SCOPES})
    print('\nOpening LinkedIn in your browser. If it does not open, visit:\n' + url + '\n')
    webbrowser.open(url)
    received = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            query = parse_qs(urlparse(self.path).query)
            ok = query.get('state', [''])[0] == state and 'code' in query
            if ok:
                received['code'] = query['code'][0]
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(('<p style="font:18px sans-serif">' + ('Authorised. You can close this tab.' if ok else 'Authorisation failed: ' + ', '.join(query.get('error_description', ['unknown']))) + '</p>').encode())

        def log_message(self, *args):
            pass

    server = HTTPServer(('localhost', 8912), Handler)
    while 'code' not in received:
        server.handle_request()
    server.server_close()
    token_request = Request('https://www.linkedin.com/oauth/v2/accessToken', data=urlencode({
        'grant_type': 'authorization_code', 'code': received['code'], 'redirect_uri': REDIRECT,
        'client_id': client_id, 'client_secret': client_secret}).encode(), method='POST',
        headers={'Content-Type': 'application/x-www-form-urlencoded'})
    with urlopen(token_request, timeout=30) as response:
        token = json.loads(response.read())
    with urlopen(Request('https://api.linkedin.com/v2/userinfo', headers={'Authorization': 'Bearer ' + token['access_token']}), timeout=30) as response:
        info = json.loads(response.read())
    days = int(token.get('expires_in', 0)) // 86400
    print('\nStore these as repository secrets (Settings → Secrets and variables → Actions):\n')
    print('LINKEDIN_ACCESS_TOKEN = ' + token['access_token'])
    print('LINKEDIN_PERSON_URN   = urn:li:person:' + info['sub'])
    print(f'\nSigned in as {info.get("name", "?")}. The token expires in about {days} days; run this script again then.')


if __name__ == '__main__':
    main()
