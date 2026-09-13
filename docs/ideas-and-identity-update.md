# Ideas and shared identity — 13 September 2026

Run `python scripts/build_site.py` for the complete bilingual site. The old patch
entry points delegate to this build instead of maintaining competing headers.
CI validates identity, page pairs, navigation, article bodies and local links,
then rebuilds and rejects any difference from the committed output.

## Content sources

- `data/site_identity.json`: the public email, experience wording, Contact label,
  CV purposes and per-metric scope/provenance notes.
- `data/site-navigation.json`: the peer Executive / Ideas navigation hierarchy.
- `data/ideas-content.json`: the position, four essays, bilingual article bodies,
  evidence destinations and prospective editorial cadence.
- `data/master_cv.json`: the owner-authored professional record. It is not an
  independent audit of the figures. The CV builder reads the public email from
  the identity record.

The existing `/writing/same-scores-different-decisions.html` URL is retained.
`/writing/` now contains the actual four-essay archive. `/ideas/position.html`
is the permanent position page. All have equivalent Arabic routes and identical
section identifiers where cross-language anchors are used.

## Claim boundaries

The 540,000+ figure describes owner-reported program coverage during the
November 2021–November 2024 ministry role; it does not measure improved outcomes.
The 1,000,000+ figure is owner-reported aggregate platform reach: the available
record does not supply its counting method or period. The site no longer assigns
that entire figure specifically to SHIFAA. Mixed-stage ventures are not presented
as five validated AI products.

The institutional email and historical SHIFAA/ministry/hospital roles have public
support in the [KAUST profile](https://cemse.kaust.edu.sa/profiles/adeeb-noor).
That profile does not independently substantiate the reach figures.

RIDI's public demonstration is described as a replay of a specific SciFact case,
not a fresh experiment or a population-wide estimate of harm. The essays state
personal arguments and explicitly hypothetical examples, not new research results.

Available IMAM material describes educational development and a Saudi GenAI
learning ecosystem. The Ideas section discusses sovereignty over learning goals,
knowledge and assessment in that context. It does not claim a separate digital
identity or authentication product. A distinct initiative would need its own
description, role, stage and source before being added.

All four essays show the current edition date; no historical publishing schedule
is invented. A substantial essay every two months is an editorial intention.
