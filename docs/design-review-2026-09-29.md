# Design review — 29 September 2026

Goal: make the homepage work as a business front door while keeping every existing claim, link and validator intact.

## Changes
- **Design layer (`polish.css`)** loaded last on all public pages by `scripts/polish_site.py` (final step of `build_site.py`, marker-delimited and idempotent).
- **Typography:** Arial/Tahoma replaced by a modern system sans stack; homepage body text moves from Georgia to sans with serif headings kept. Arabic pages use self-hosted Cairo (subset WOFF2, ~25 KB per weight, OFL in `assets/fonts/`).
- **Homepage flow:** "Ways to work together" now follows the four capabilities instead of sitting at the bottom of the page; a closing call-to-action links to the inquiry form and Executive CV.
- **Removed visual duplication:** the second small portrait in "Executive focus" is hidden (the hero already shows it).
- **Layout fixes:** services show 3 + 2 instead of an orphan card; audience cards use 3 columns instead of 4 + 2; the three stacked footer strips read as one footer with privacy last.
- **Mobile:** 2×2 proof numbers, swipeable recognition row, compact capability tiles and audience cards (~1,400 px shorter page).
- **SHIFAA image:** now a locally hosted screenshot of the live patient portal (`assets/shifaa-actual.webp`, supplied by the owner) instead of a hot-linked image from shifaa.kau.edu.sa that could fail or leak visitor requests.
- **One "Start here" section:** "Two ways into my work", "What can we accomplish together?" and "Look behind the work" are merged. The two paths stay; the six audience cards are condensed (title links to the evidence page, promise, contact action) from `data/homepage-audiences.json`; resources become one row of links. `build_homepage_positioning.py` recognises the merge marker.
- **Recommendations:** four public LinkedIn recommendations (Prof. Amin Noaman, Samera Albasri, Hussam Al-Baz, Stela Lupushor) from `data/testimonials.json`. Excerpts are verbatim with omissions marked; the Arabic page shows labelled translations. No photos are used, and no review schema is added (Google treats self-published reviews as ineligible).
- **Hero performance:** the portrait (largest above-the-fold image) is preloaded with high fetch priority.
- **Interaction:** consistent 8–14 px radii, hover lift on cards, visible focus rings, reduced-motion aware smooth scrolling.

## Not changed (owner decisions)
- Content, numbers and claims are unchanged; financial figures stay off the homepage by owner decision. No testimonials or client logos were invented.
- To change or add a recommendation, edit `data/testimonials.json` and run `python scripts/build_site.py`.

## Update — 3 October 2026 (RIDI and iSCARB)
- **RIDI:** current manuscript title *Equal evaluation scores do not certify equivalent AI behaviour* (submission-ready, not peer reviewed); new open dataset on Zenodo (record 22974727, CC BY 4.0) added to latest research, research page, ventures and CV blocks; project card links to the RIDI project page with a real screenshot (`assets/ridi-actual.webp`).
- **iSCARB:** story-led lectures (Chapters 12–20), executable labs, two-minute ownership check and AI study coach reflected on the project card, teaching, ventures and CV blocks; card image is a real Chapter 12 lecture slide (`assets/iscarb-lecture.webp`).
- Homepage "New questions. Published work." now shows four featured records.
- `supabase/functions/portfolio-collect/index.ts` allows the new Zenodo link. Redeploy `portfolio-collect` so clicks on it are counted; the site works without the redeploy.
- **SULTAN 0.13, MIYAR 6.0.1, Kamin 1.0:** cards, ventures and partnerships text reflect the latest releases (three-line start, council review, board packs and strategic services; one-sentence start, two-step sign-in and isolated demo; evidence-backed capability network). Cards use real screenshots in each language (`assets/{sultan,miyar,kamin}-{en,ar}.webp`; `image_ar` in `data/featured-projects.json`).
- **Project order:** products first (SULTAN, MIYAR, Kamin), then research and teaching (RIDI, iSCARB, Kinetic HR), then HEALTHx and the earlier SHIFAA and GenomeFit.
- `/SulTaN/` now redirects to the live SULTAN beta (0.13+) instead of serving the stale 0.7.2 copy; the `sultan-sync.yml` workflow, which could only publish the old single-file release format, is removed (recoverable from git history).
