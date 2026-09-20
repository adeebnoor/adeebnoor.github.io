# Kinetic HR pilot data contract — KHDC-v1.0

This specification governs the local evaluation build. The browser validates CSV inputs using the same rules described here. JSON schemas describe individual typed rows; cross-row and historical checks are additionally enforced in code. This is not a live HR connector or a multi-tenant production service.

## Import order and source ownership

1. Import `position_snapshot` for a single effective date.
2. Review accepted, quarantined and warning counts.
3. Import the matching `hr_event_log`. Uploading a new snapshot invalidates the previous event log.
4. Review the alert, open a scenario and export a decision brief.

Original HR and finance systems retain records and approvals. There is no write-back or automatic execution. A file import is local processing, not authenticated live integration. Saved scenarios and policy settings remain in the current browser; production access control, retention and hosting require entity approval.

## Standard cell dictionary

The analytical unit is `sector × location × ssco × level`. `category` is descriptive metadata, not a fifth dimension. There must be one snapshot row per standard cell and a unique `position_group_id`. Aggregate multiple source positions into this row before import; do not upload duplicate cells split by category.

`position_group_id` joins an event to a snapshot. `source_row` and `event_id` must remain stable across repeated exports. Occupation codes must exist in the installed SSCO demo subset. The public build does not claim the full official occupation catalog. Unknown codes are quarantined until the maintained catalog is extended.

| Sector | Locations | Levels | Category metadata | Example service units |
|---|---|---|---|---|
| EDU — Education | 07 Al-Jawf; 02 Makkah; 01 Riyadh | L1 primary; L2 intermediate; L3 secondary | A/B track | Students |
| HLT — Operational health | 01 Riyadh; 02 Jeddah; 03 Dammam | G1 practitioner; G2 specialist; G3 senior specialist | H hospital; C centre | Coverage hours/week |
| MUN — Municipal services | 01 Riyadh; 02 Jeddah; 03 Al Khobar | J1/J2/J3 job levels | F field; O office | Service transactions |
| GOV — Shared services | 01 headquarters; 02 western; 03 eastern | P1 professional; P2 leadership | C central; R regional | Internal service units |

The published locations and occupations are configuration limits of this build. Entity-specific dictionaries must be agreed and loaded before an operational pilot.

## Snapshot fields

Required: `source_row`, `as_of_date`, `position_group_id`, `sector`, `location`, `ssco`, `level`, `category`, `demand_basis`, `needed_fte`, `available_fte`.

Capacity values are nonnegative numbers. All rows in a snapshot share one valid ISO calendar date. `funded_fte`, when supplied, is nonnegative and cannot exceed required capacity. A missing funding value is unknown, not zero. `gap_onset_date` identifies the start of an existing shortfall; unknown age remains unknown.

To publish an incidence rate, both `event_history_start_date` and `event_history_end_date` must declare a complete exported history covering the current window and three immediately preceding windows. This is a data-owner declaration, not proof that an external source was exhaustively queried. Start/end dates cannot lie after `as_of_date` or be reversed. Missing declarations retain current-gap analysis but block incidence.

Financial scenario fields (optional, recommended for a one-session pilot):

- `{hire,transfer,upskill,contract}_unit_cost_sar`
- `{hire,transfer,upskill,contract}_approval_days`
- `scenario_budget_sar`
- `cost_per_uncovered_fte_day`
- `financial_cost_source` — required when any cost is supplied

Zero is valid, including zero-day approval. Blanks remain unknown. Sector demo defaults are illustrative and never silently copied into imported entity data. Supply the entity’s approved assumptions in the CSV, or enter them in the scenario form.

Optional service/priority inputs retain their existing meanings: `median_time_to_fill_days`, `scarcity_index`, `internal_substitute_fte`, `service_criticality_weight`, `service_units_per_gap_fte`, team workload inputs, and service impact labels/units. These do not constitute a validated Case-Mix model or causal outcome estimates.

## Event contract

Required: `event_id`, `position_id`, `position_group_id`, `event_type`, `event_date`, `sector`, `location`, `ssco`, `level`, `category`. Descriptors must match the linked snapshot. Dates must be valid calendar days no later than the linked snapshot.

| Event types | Capacity delta | Demand delta |
|---|---:|---:|
| resignation, termination, retirement, transfer_out | Negative | 0 |
| long_term_absence, internal_promotion, coverage_end | Negative | 0 |
| hire, transfer_in, return_from_absence, coverage_start | Positive | 0 |
| demand_increase, position_created_unfilled | 0 | Positive |
| demand_decrease, position_closed | 0 | Negative |
| role_transformation | 0 | 0; optional skill_gap_fte identifies a skills need |

A missing delta receives the documented single-unit event default with a warning; explicit amounts are strongly preferred. An unsupported type, incorrect sign or invalid numeric value is quarantined. Exit events additionally require consistent `separation_nature` and a `separation_reason`: resignation/voluntary, termination/involuntary, retirement/statutory, transfer_out/internal_mobility.

Events are ordered by date, then optional nonnegative integer `event_sequence`, then stable `event_id`. Supply `event_sequence` where same-day order matters. This canonical order makes row-order permutations reproducible; it cannot recover unknown intraday chronology. Duplicate event IDs and reconstructed negative historical capacity/demand are rejected.

## Measurements — KH-MEASURE-v1.0

- Gap = max(0, required − available).
- Matched coverage = sum(min(required, available)) / sum(required). Surplus in another cell does not mask a local gap.
- Funded gap = max(0, min(required, funded) − available); unfunded gap = total gap − funded gap. Unknown funding is explicitly unknown.
- Each replayed event creates `max(0, gap_after − gap_before)` newly uncovered full-time-equivalent capacity. Recoveries do not subtract from gross new shortfall; net stock change is a different quantity.
- Required exposure = sum(required capacity × observed days) / 30.4375.
- Incidence rate = 100 × newly uncovered capacity / required exposure.
- Baseline = mean rate in three preceding windows of the selected length.
- Ratio = current / baseline. Positive current with a zero baseline is not reported as a finite multiplier. Zero/zero has no computed ratio.

## Monitoring policy — KH-SURV-v1.0

Select 30, 90 or 180 days per sector, requiring at least 120, 360 or 720 days respectively including baselines. Cell overrides can change thresholds while retaining the sector time window. Defaults are a 1.5× alert ratio, a minimum 2 new full-time equivalents when the baseline is zero, and a minimum required cell capacity of 10.

An alert also requires complete history and a positive new shortfall meeting the baseline-volume safeguard. A higher rate below the alert threshold is monitored. No unusual rise is a normal state; it does not imply that an existing shortfall has disappeared. Insufficient history, missing events, an ineligible size, or quarantined records results in unavailable incidence, not a final zero.

Threshold changes immediately reclassify current records and are stored with a policy revision and audit entry. Policy inputs participate in the SHA-256 measurement fingerprint. A hash supports change detection; browser storage is not an immutable enterprise audit system.

## Samples and failures

Each sector has a matching snapshot/event pair with synthetic costs. The example history declares 720 complete days by construction; the early portion before the listed events is intentionally quiet. These are test data, not national benchmarks.

- `invalid_snapshot.csv`: negative required capacity and an unknown level; must be rejected.
- `invalid_events.csv`: a resignation with positive capacity; must be quarantined and incidence blocked.
- `position_snapshot_template.csv`, `hr_event_log_template.csv`: column headers only; fill with entity-approved data before import.
- Legacy v0.9/v1.1 samples without an end-of-history declaration remain importable, but incidence is unavailable until the missing declaration is supplied.
