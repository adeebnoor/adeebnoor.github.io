# Illustrations and the RIDI mark

All artwork is original line art in the site palette (ink `#141414`, green `#005a36`, lilac `#c88cff`, sand `#e2d1bf`), drawn as SVG in `assets/illustrations/` and placed inline by `scripts/illustrate_site.py` (the last build step). Inline SVG keeps the localization check's one-`<img>`-per-project rule intact. Edit an SVG and run `python scripts/build_site.py` to update every page.

| File | Motif | Where |
|---|---|---|
| `hero-network.svg` | network of evidence with a person at the centre | behind the homepage portrait |
| `ico-ideas.svg` / `ico-leadership.svg` | balance of score vs evidence; institution with nodes | the two homepage paths |
| `ico-years/people/map/users.svg` | glyphs | key numbers |
| `ico-research.svg` | brain circuit | latest research heading |
| `human-loop.svg` | human in the loop with a verified decision | leadership section |
| `question-nodes.svg` | a question built from nodes | closing call to action |
| `art-decision/research/advisory/ideas/health.svg` | evidence → verified decision; brain; compass; balance; heart circuit | inner-page heroes, chosen by page |

`assets/brand/` holds the RIDI mark: a ring (the identical score) split in two, each half holding the same number of dots arranged differently (the same evaluation, a different selection). `ridi-mark.svg` (green tile), `ridi-mark-outline.svg` (for light backgrounds), `ridi-wordmark.svg`, and PNG exports at 512, 1024 and 1280×320.
