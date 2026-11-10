# Adeeb Noor

Public site for [adeebnoor.github.io](https://adeebnoor.github.io/). Generated pages are committed. Rebuild them with `python scripts/build_site.py`.

## Add a LinkedIn post

The homepage section **From LinkedIn — Latest writing and updates** (and the same section on the Arabic homepage) does not read the LinkedIn profile. LinkedIn publishes no feed of a member's posts, and the profile activity list sits behind a login wall. The section renders the three newest entries in [`data/linkedin-posts.json`](data/linkedin-posts.json). A post written on [linkedin.com/in/adeeb-noor](https://www.linkedin.com/in/adeeb-noor) stays off the site until it is added there.

**From GitHub (usual path).** On the post, open … → **Copy link to post**. Then open a [LinkedIn post](https://github.com/adeebnoor/adeebnoor.github.io/issues/new?template=linkedin-post.yml) issue and paste one link per line. The workflow reads the public post, stores it in `data/linkedin-posts.json`, rebuilds both homepages and pushes to `main`. A country link such as `ae.linkedin.com` is accepted. If LinkedIn does not return the text, paste the text and an optional `YYYY-MM-DD` date in that same issue.

**By editing the file.** Put a new object at the start of `posts` (newest first):

```json
{
  "url": "https://www.linkedin.com/feed/update/urn:li:share:...",
  "date": "2026-10-24",
  "lang": "en",
  "text": "The opening of the post. The card shows about the first 240 characters."
}
```

`lang` is `en` or `ar`. Arabic text is rendered right to left. Then run `python scripts/build_site.py` and commit `data/linkedin-posts.json` plus the two homepages.

To publish a new post to LinkedIn and the site together, use the [Publish to LinkedIn](https://github.com/adeebnoor/adeebnoor.github.io/issues/new?template=linkedin-publish.yml) issue form. More detail: [docs/linkedin-feed.md](docs/linkedin-feed.md).
