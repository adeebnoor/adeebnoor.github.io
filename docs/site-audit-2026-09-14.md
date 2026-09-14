# Site audit implementation — 14 September 2026

## Scope

The supplied audit prioritizes qualified professional opportunities and a consistent public identity. The implementation preserves the existing site, bilingual content, CV evidence notes and private visitor analytics. It does not invent endorsements, testimonials, commercial results or third-party profile corrections.

## Website changes

Shared navigation uses Leadership / Ideas consistently. The existing two homepage paths and MIYAR/RIDI extra links are preserved in both languages. IMAM GenAI is added as the seventh featured project, explicitly marked in development. Existing portrait, sitemap, robots file and Person markup were present before this work; these were checked rather than claimed as wholly new features.

Five named engagement types appear on the homepage and Contact: strategic advisory, boards and expert committees, talks and workshops, applied research, and venture/product collaboration. A real qualified inquiry form asks for the audience, problem, desired timeline and decision role. The three Selected Engagements narratives are derived from the existing CV and linked public records, with financial and scope caveats retained. Company names describe the owner's institutional counterpart experience, not personal clients or endorsements.

GitHub and four public repositories are linked. Eight language-specific essay pages have Article markup, distinct 1200×630 social cards, and visible first-recorded dates backed by the site's main-branch history in data/essay-dates.json. The English and Arabic RSS feeds each contain four essays. The dates are repository provenance, not journal publication dates.

## Owner inbox and privacy

Open /inquiries/ or /ar/inquiries/ using the existing private analytics owner key. No new key was generated or published. The dashboard shows the latest 100 requests, supports status changes, replies through the owner's email application and deletion. Access is kept in browser memory, expires after 30 minutes and is removed on locking/leaving the page.

Inquiry and update requests are stored in private Supabase tables with RLS enabled and no anonymous/authenticated direct table privileges. Only the server's service role can access these tables. The public endpoint accepts validated submissions; private reads and changes also require the owner key. Form fields never enter visitor analytics, public repository files or query parameters.

This is a manual-review inbox, not an email notification service. Essay-update requests remain pending confirmation; no automated newsletter is sent. RSS is the immediately available subscription mechanism. Before sending any future newsletter, confirm addresses and provide a working unsubscribe mechanism.

The form notice discloses storage in Australia, voluntary consent, avoidance of confidential/health information, and retention cleanup after 180 days on subsequent submissions or owner access. Cleanup is not a continuously running scheduled job. Short-lived keyed abuse-control fingerprints are used; raw IP addresses are not stored in the inquiry tables. This implementation is not a legal compliance certification.

## Verification

Run python scripts/build_site.py and the existing site/localization/identity/ideas/analytics validators plus scripts/validate_audit.py. The Node suite contains 39 checks for analytics, owner access, request validation and privacy boundaries. Browser QA captures 390px and 1440px views, checks overflow and WCAG AA rules, and tests form retry/preservation and owner locking with synthetic mocked data. Live API QA tests real synthetic submissions, idempotent retries and anonymous access denial. Synthetic records must be deleted by exact test IDs after review; real visitor records must not be modified.

The audit workflow retains screenshots and detailed results. The separate published-site workflow compares 17 public pages/assets against the exact main-branch bytes after GitHub Pages releases them. Workflow results, not this document, establish whether a particular revision passed.

## Not completed by editing this repository

Search Console ownership verification and sitemap submission require the owner's connected Google account. Improved markup does not guarantee ranking or a Knowledge Panel. KAUST and other third-party profile changes require their owners/editors; their current biographies must not be silently treated as corrected. Testimonials require genuine approved quotations. LinkedIn redistribution requires editorial review and authorization to post. No such messages or posts were sent as part of these website changes.
