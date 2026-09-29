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
- **Hero performance:** the portrait (largest above-the-fold image) is preloaded with high fetch priority.
- **Interaction:** consistent 8–14 px radii, hover lift on cards, visible focus rings, reduced-motion aware smooth scrolling.

## Not changed (owner decisions)
- Content, numbers and claims are unchanged; financial figures stay off the homepage by owner decision. No testimonials or client logos were invented.
- Testimonials still require genuine, approved quotations.
