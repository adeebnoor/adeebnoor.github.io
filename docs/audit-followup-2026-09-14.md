# Focused audit follow-up — 14 September 2026

## What the direct recheck found

The live pre-follow-up check began at 12:29:07 UTC (15:29:07 Asia/Riyadh). Its evidence is retained in workflow run 34843474154. Ten ordinary public URLs and the same ten URLs with a fresh query parameter matched the repository HTML exactly. Rendered desktop navigation used the same Leadership / Ideas labels on Home, Contact, Essays and Ideas. Mobile navigation was also consistent.

Both homepages displayed the two entry paths, seven projects including IMAM GenAI, the MIYAR position-request link and the RIDI idea link. The real inquiry form was present in both Contact pages. These reported omissions were not reproduced on those live pages. The check does not establish why the review saw a different result; a stale page, an earlier review snapshot or another cache is possible but unproven.

A real omission remained: the Essays and Ideas archive cards lacked visible dates, and both archives still contained the old future-tense dating promise. Dates had only been added inside the individual articles. The top Contact buttons also still led to email, while the real form sat below five service cards.

## Changes in this follow-up

- Date all four essay cards in both the Essays and Ideas archives in English and Arabic (16 dated card instances).
- Preserve the recorded per-language timestamps in data/essay-dates.json. Label these as first-recorded dates on this site, not independently verified publication or journal dates. Do not replace existing dates with today's date.
- Replace the old dating promise in the bilingual source with an explanation of the dates now displayed.
- Put the actual inquiry form first in Contact content and make the prominent hero button open that form. Keep email as an explicitly labeled alternative.
- Align the Ideas-page footer label with Leadership; preserve the distinct Executive CV document name.
- Add reader-visible regression checks to the normal build and a live-site check covering ordinary URLs, fresh URLs, JavaScript-disabled pages and mobile views. The live check asserts navigation, both homepage paths, all seven projects, additional MIYAR/RIDI links, form fields and each archive date.

## Scope and verification

This follow-up does not add another backend, change any owner key, send inquiries, activate a newsletter, edit third-party profiles or claim improved search ranking. Existing backend tests use synthetic mocked data in this run. Workflow results and captured screenshots establish whether a revision passes; this document alone is not a test certificate.
