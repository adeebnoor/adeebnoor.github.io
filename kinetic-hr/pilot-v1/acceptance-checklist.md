# P0 acceptance and rollout boundaries

Release: KHDC-v1.0 / KH-MEASURE-v1.0 / KH-SURV-v1.0.

## One-session acceptance

- Select a sector and download its two synthetic example files.
- Import snapshot; verify imported-data label and incidence unavailable until events arrive.
- Import matching events; verify accepted counts, complete history and at least one data-driven alert.
- Explain current shortfall separately from gross newly uncovered work; identify its contributing events.
- Change a sector or cell threshold, apply it, verify reclassification and a policy audit entry.
- Switch among 30/90/180 days. When history is shortened, incidence must become unavailable.
- Open tomorrow’s action for the highest-priority cell; inspect owner, deliverable, time, costs and risks.
- Open Scenario Lab, review source-attributed cost and approval inputs, compare action against no action, and save a scenario.
- Export actual DOCX and PPTX files; use Print / Save PDF for a PDF. Verify Arabic and English content, cell identity, source type, method version, policy revision and fingerprint.
- Reload or repeat calculations with the same data and policy; verify identical metrics and fingerprint. Timestamps and export container metadata are not measurement outputs.

## Implemented in this evaluation build

P0: documented CSV and typed-row contracts; standard four-part cells; data quality and temporal coverage gates; 30/90/180 monitoring; editable sector/cell thresholds; policy revision and audit history; current gap/funding/age and rate/baseline/change; next-day action; constrained scenarios; native Word and PowerPoint plus print-to-PDF; bilingual five-step trial; separate synthetic/imported labels.

Priority explanation exposes the contributions of the existing v0.8 model. Funding remains an execution constraint. This does not claim a new calibrated Case-Mix model.

## Entity gates still required before a real operational pilot

- Approve purpose, dataset access, hosting environment, access control, retention and sharing rules.
- Provide anonymised/aggregated data, a maintained occupation/location dictionary and verified event completeness.
- Approve the operating cost assumptions, alert thresholds, escalation owners and acceptance criteria.
- Validate outputs against known historical cases and sign off the pilot results.

The public build provides local evaluation and is not a shared multi-tenant SaaS deployment. There is no live API connection, source write-back, automated alert delivery, enterprise identity, tenant isolation or guaranteed server audit retention.

## After the first pilot

P1: calibrated KH-CASEMIX-v1 weights and cost effects; KH-BURDEN-v1 affected-unit × duration × criticality with agreed sector units; comparison against the existing priority model. Existing demo weights must not be presented as validated replacements.

P2: authenticated multi-tenancy and isolation, private hosting, notifications, scheduled/live read-only connectors and optional sentinel sites. Search and filters already exist locally; a shared enterprise memory service remains later work.
