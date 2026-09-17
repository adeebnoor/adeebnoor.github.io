# Kinetic HR Data Dictionary — KHDC-v0.9

This dictionary is part of the public demo contract. Codes are never assumed to be self-explanatory.

## 1. Workforce snapshot `position_snapshot`

| Field | Required | Meaning | Valid / example values |
|---|---|---|---|
| `source_row` | Yes | Immutable source-row identifier | `demo-001` |
| `as_of_date` | Yes | Snapshot effective date | ISO date |
| `position_group_id` | Yes | Stable workforce-group key and primary link to events | `PG-EDU-001` |
| `sector` | Yes | Sector code | `EDU`, `HLT`, `MUN`, `GOV` |
| `location` | Yes | Sector-local location code | See UI dictionary |
| `ssco` | Yes | Saudi Standard Classification of Occupations code | Six-digit SSCO |
| `level` | Yes | Sector-specific level code | See level-prefix table below |
| `category` | Yes | Sector-specific operating category | See category table below |
| `demand_basis` | Yes | Basis for Required FTE | `workload-derived`, `service-standard`, `strategic-scenario`, `approved-establishment` |
| `needed_fte` | Yes | Required capacity | FTE |
| `available_fte` | Yes | Available capacity | FTE |
| `gap_onset_date` | Conditional | Start date of active stock gap | ISO date |
| `event_history_start_date` | Required for surveillance | First date for which the event log is declared complete for this group | ISO date |
| `funded_fte` | Recommended | Financially approved capacity | FTE |
| `utilization_rate` | Recommended | Current team utilization | Decimal, e.g. 0.95 |
| `overtime_hours_per_fte_month` | Recommended | Overtime burden | Hours / FTE / month |
| `sick_leave_rate` | Recommended | Sick-leave ratio | Decimal |
| `cost_per_uncovered_fte_day` | Optional | Verified financial exposure for one uncovered FTE-day | SAR |
| `financial_cost_source` | Required if cost is supplied | Finance/HR source for the cost assumption | Free text / source ID |

## 2. Category codes

`category` is sector-specific. The same letter must never be interpreted without `sector`.

| Sector | Code | Arabic meaning | English meaning |
|---|---|---|---|
| EDU | A | مسار أ | Track A |
| EDU | B | مسار ب | Track B |
| HLT | H | مستشفى | Hospital |
| HLT | C | مركز | Center |
| MUN | F | ميداني | Field |
| MUN | O | مكتبي | Office |
| GOV | C | مركزي | Central |
| GOV | R | إقليمي | Regional |

**Important:** `G`, `J`, `L`, and `P` are level prefixes, not category values.

## 3. Level prefixes

| Sector | Prefix | Meaning | Current demo values |
|---|---|---|---|
| EDU | L | Educational stage | L1 Primary, L2 Intermediate, L3 Secondary |
| HLT | G | Professional grade | G1 Practitioner, G2 Specialist, G3 Senior Specialist |
| MUN | J | Job level | J1, J2, J3 |
| GOV | P | Government/corporate level | P1 Professional, P2 Leadership |

Cross-sector comparisons must compare the semantic level label, not the raw prefix.

## 4. HR event log `hr_event_log`

| Field | Required | Meaning |
|---|---|---|
| `event_id` | Yes | Immutable event identifier |
| `position_id` | Yes | Source position/person-slot identifier |
| `position_group_id` | Yes | Direct foreign key to `position_snapshot.position_group_id` |
| `event_type` | Yes | `resignation`, `termination`, `retirement`, `transfer_out`, `hire`, `transfer_in`, `demand_increase`, `demand_decrease`, `position_created_unfilled`, `position_closed` |
| `event_date` | Yes | Effective event date |
| `sector/location/ssco/level/category` | Yes | Redundant descriptors used to detect coding drift; they must match the linked position group |
| `separation_nature` | Conditional | Required for exit events: `voluntary`, `involuntary`, `statutory`, `internal_mobility` |
| `separation_reason` | Conditional | Actionable reason when known, e.g. `compensation`, `career_growth`, `workload`, `performance`, `probation`, `retirement`, `internal_transfer` |
| `capacity_delta_fte` | Yes/inferred | Capacity change caused by event |
| `demand_delta_fte` | Yes/inferred | Demand change caused by event |

## 5. Surveillance sufficiency rule

A cell is shown as **Insufficient data** rather than **Healthy/Normal** when its declared `event_history_start_date` does not cover the complete current 30-day window and all three preceding 30-day baseline windows. A true 0/0 is shown as **No new gap activity** only when that coverage is complete.

Every surveillance card must disclose:
- observed days in the current window,
- required-FTE-month exposure,
- number of gap-creating events,
- number of complete baseline windows.

This prevents a short or partial history from being presented with the same visual meaning as a genuinely quiet workforce cell.
