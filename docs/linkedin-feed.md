# LinkedIn posts on the homepage

LinkedIn does not offer a public API or feed for a member's own posts. An automatic sync would need either an approved LinkedIn partner app or a third-party widget that loads LinkedIn/vendor scripts on every visit. Instead, posts are added in one step and published automatically:

1. Publish the post on LinkedIn, then open its menu (…) → **Copy link to post**.
2. Open https://github.com/adeebnoor/adeebnoor.github.io/issues/new?template=linkedin-post.yml (works in the GitHub mobile app).
3. Paste the link and the post text, then submit.

`.github/workflows/linkedin-post.yml` runs only for issues opened by the repository owner with the `linkedin-post` label. It validates the URL, stores the post in `data/linkedin-posts.json` (`scripts/add_linkedin_post.py`), rebuilds and validates the site, pushes to `main`, comments on the issue and closes it. The homepage "From LinkedIn" section (EN/AR) shows the three newest posts and is hidden while the list is empty.

The cards are plain text with a link; no LinkedIn script or iframe loads on the site, and post links carry `data-analytics-ignore`, so no collector change is needed. To remove a post, delete it from `data/linkedin-posts.json` and run `python scripts/build_site.py`.
