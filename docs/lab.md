# Adeeb Lab = the Research & Lab page

Adeeb Lab (Responsible Decision Intelligence) and the research page were one subject on two pages, so on 8 November 2026 they were merged into `research.html` / `ar/research.html`, in the site's own design. The menu item is "Research & Lab / الأبحاث والمختبر".

**Sources**
- `data/research-program.json` → `en.lab` / `ar.lab`: hero, vision, question and mission, method (five questions), ways to work, engagement steps, principles, joining the lab, contact. The three pillars keep their ethics content and anchors (`#justice`, `#accountability`, `#human-agency`) and add the Lab pillar name, question and projects.
- `data/lab-projects.json`: the six projects (anchors `#ridi`, `#ridi-pdpl`, `#clinical-knowledge-sharing`, `#requirement-ledger`, `#image-provenance`, `#genomic-reanalysis`) with their full stories and illustrations. Each story is a `<details>` block; opening a project's anchor opens its story.
- `scripts/build_research_program.py` renders the page; `research.css` holds its styles (site theme tokens; project illustrations keep the Lab palette).

**Page order (compact, Nov 2026):** hero with four buttons (projects, students, funders, partners) → vision → projects (two flagships RIDI and HEALTHx, five supporting projects, MIYAR as one line) → `#join` one table per project with the open thesis topic and the fundable next step (`#funders` is the table), apply and funding buttons → `#work` six ways to work, engagement steps, one "how we work" line and contact → pillars → method → research arc → records not shown elsewhere → open work (added by `build_audit.py`). Visible text is about 2,000 words in English with stories closed; each project's full story sits inside its card.

**Calls to action** open the contact form with the audience pre-selected: students `?audience=student&engagement=other`, funders `?audience=institution&engagement=venture`, partners `?audience=institution&engagement=research`. Thesis topics live in `data/lab-projects.json` (`topics`, proposed and derived from each project; the invention project has none before filing); the funding table uses each project's `next` and first `gains` item, with no budgets or durations.

**/lab/** is a redirect page only (noindex). It keeps the Lab share card for LinkedIn previews of links already shared, sends `?lang=en` or a saved English choice to `/research.html` and everything else to `/ar/research.html`, and maps the old anchors (`#story-ridi` → `#ridi`, `#story-pdpl` → `#ridi-pdpl`, `#story-invention` → `#clinical-knowledge-sharing`, `#story-ledger` → `#requirement-ledger`, `#story-phd` → `#image-provenance`, `#story-genomics` → `#genomic-reanalysis`, `#arc` → `#research-lineage`, `#pubs` → `#research-record`, `#contact` → `#lab-contact`, `#adeeb` → About).

**Elsewhere:** `scripts/build_lab_links.py` adds the Lab teaser on both homepages and a pointer on Students and Partnerships, all linking to `research.html#projects`.

**Analytics:** the `portfolio-collect` edge function now lists the new anchors and the PyPI and OSF links. Until it is redeployed, links to those anchors and destinations carry `data-analytics-ignore` (see `NEW_ANCHORS` and `NEW_DESTINATIONS` in the renderer); remove that once the function is live.

**Wording rules** (also in `docs/content-sources.md`): RIDI figures exactly as on the RIDI page; "not yet peer reviewed" (لم تخضع للتحكيم بعد); HEALTHx is a framework in research and development, "invention disclosure under review", and the mandatory sentence stays verbatim; no student or collaborator names in Lab project stories; no technical detail of the invention before filing and no disclosure numbers; keep boundary statements; any new figure needs a published source or Prof. Noor's approval.
