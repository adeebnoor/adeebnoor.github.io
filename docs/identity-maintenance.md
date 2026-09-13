# Shared identity and evidence

`data/site_identity.json` defines the public contact email, experience wording,
navigation Contact label, bilingual CV explanations, and metric scope/source notes.
The public HTML is generated statically; readers do not need JavaScript or a
successful configuration fetch to see correct identity information.

Build order: generate page content, localize all registered pages, then run
`python scripts/sync_identity.py`. The localizer should call
`sync_identity.strip_generated()` on its English inputs and the Arabic homepage
before translation. Tagged blocks are re-created in the correct language by the
final identity pass. The script is idempotent and imports without writing files.

Run `python scripts/validate_identity.py` with the normal site and localization
validators before publishing. It checks public addresses, Contact labels,
experience headlines, visible CV guidance, per-metric source links, and the actual
existence of the linked evidence anchors. Add new personal pages to the existing
`localize_site.PAGES` registry to include both language versions automatically.

The experience total is explicitly self-reported; do not automatically increment
it from the earliest job date because the CV has gaps and overlapping roles.
The 540,000 figure describes national program coverage during 2021–2024. The
1,000,000 figure is aggregated platform reach from the CV, without a published
counting method or measurement period. It must not be described as current active
users, unique people, audited performance or SHIFAA-only reach without further
evidence. The former platform count mixes operating systems, prototypes and
ventures, so the public heading describes research translation instead.

The two CVs describe one career for distinct audiences: executive leadership and
partnerships, versus academic research, teaching and supervision. Their shared
explanations are placed beside the visitor's choice on the homepage, About page,
CV chooser and both CV pages.

Do not use the older one-off patch scripts as a publishing workflow. If importing
an updated historical CV, retain its chronology and evidence but use the canonical
institutional email for all public contact links. `build_cvs.py` reads that email
from the shared identity file, and the final sync also normalizes legacy content.
