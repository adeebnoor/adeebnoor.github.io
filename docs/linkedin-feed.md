# LinkedIn posts on the homepage

## Write once: publish to LinkedIn and the site together (free, official API)

Open https://github.com/adeebnoor/adeebnoor.github.io/issues/new?template=linkedin-publish.yml, write the post (optionally with a link to attach), submit. `.github/workflows/linkedin-publish.yml` (owner's issues only, label `linkedin-publish`) runs `scripts/linkedin_publish.py`, which posts through LinkedIn's Posts API (`w_member_social`), records the resulting post URL in `data/linkedin-posts.json`, rebuilds, validates and pushes to `main`, then comments the LinkedIn link on the issue and closes it. Hashtags stay live; LinkedIn's "little text" control characters are escaped.

One-time setup (about ten minutes):
1. https://www.linkedin.com/developers/apps → Create app. It must be linked to a LinkedIn Page you administer (a free page such as HEALTHx is enough).
2. In the app, add the products **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect** (both are self-serve), and add `http://localhost:8912/callback` under Auth → Authorized redirect URLs.
3. On your computer run `python scripts/linkedin_auth.py`, paste the app's Client ID and Secret, approve in the browser, and store the two printed values as repository secrets `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN`.
4. Optional: store `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` as secrets too; `.github/workflows/linkedin-token-check.yml` then checks the token weekly and opens an issue when it has under ten days left.

LinkedIn access tokens last 60 days and apps outside LinkedIn's partner programme get no refresh tokens, so step 3 repeats every two months (two minutes). `data/linkedin-mode.txt` switches the whole flow: `test` validates each pending issue and checks the token against LinkedIn without posting anything (the issue gets a "Test only" comment and stays open); `live` publishes. A failed post is never lost: the issue gets a comment naming the cause and the run shows as failed; the workflow then retries every open `linkedin-publish` issue hourly (quietly, repeating the comment only when the cause changes), or close and reopen the issue to retry now. An issue that already carries a "Published on LinkedIn" comment is never posted twice. `LINKEDIN_VERSION` (repository variable, `YYYYMM`) overrides the API version if LinkedIn retires the default (previous month).


## Posts written directly on LinkedIn: paste the link only

LinkedIn does not offer a free API or feed for a member's own posts, and the public profile and its activity list sit behind a login wall, so posts written on LinkedIn cannot be discovered automatically. They are added by link, in one step:

1. On LinkedIn, open the post's menu (…) → **Copy link to post**. Several posts can go in one go.
2. Open https://github.com/adeebnoor/adeebnoor.github.io/issues/new?template=linkedin-post.yml (works in the GitHub mobile app).
3. Paste the link(s), one per line, and submit. Text and date are optional.

`.github/workflows/linkedin-post.yml` runs only for issues opened by the repository owner with the `linkedin-post` label. `scripts/add_linkedin_post.py` validates each URL, reads the text and publish date from the public post page, and adds the post only when that page names `linkedin.com/in/adeeb-noor` as the author. A post already shown (same link or same text) is updated, not duplicated. The workflow rebuilds and validates the site, pushes to `main`, comments a line per link on the issue and closes it; on failure it explains why and the issue can be reopened to retry. The homepage "From LinkedIn" section (EN/AR) shows the three newest posts and is hidden while the list is empty. A post's direction (RTL/LTR) follows the majority script of its text.

The cards are plain text with a link; no LinkedIn script or iframe loads on the site, and post links carry `data-analytics-ignore`, so no collector change is needed. To remove a post, delete it from `data/linkedin-posts.json` and run `python scripts/build_site.py`.
