# Kinetic HR Pilot Extension Dictionary — v1.1

This file extends `KHDC-v0.9` for the strategic-partner pilot layer.

## 1. Service Impact fields

These fields translate a workforce gap into a service or citizen-facing effect.

| Field | Meaning |
|---|---|
| `service_impact_per_gap_fte` | Service-impact quantity associated with one uncovered FTE |
| `service_impact_label_ar/en` | Human-readable outcome statement |
| `service_impact_unit_ar/en` | Unit, e.g. students, inspection tasks/week, clinical coverage hours/week |
| `service_impact_target_ref_ar/en` | Target/source reference or explicit note that the value is a synthetic pilot assumption |

**Governance rule:** the public demo uses synthetic assumptions only. They are not presented as official Saudi national targets.

## 2. Pilot reference cost presets

The file `pilot_reference_presets_v11.json` contains illustrative sector presets for:
- hire unit cost,
- internal-transfer unit cost,
- upskill unit cost,
- contract unit cost,
- uncovered FTE-day cost,
- approval latency.

These values are **not official benchmarks**. The product labels them as reference presets and requires production deployments to replace them with verified HR/Finance data.

## 3. Opportunity Cost / Do Nothing

For the public pilot:

`Cost of inaction = active gap FTE × horizon days × uncovered FTE-day cost`

This is a reference financial exposure, not an accounting expense unless the entity defines the FTE-day cost accordingly.

The scenario lab also reports the portion of this exposure avoided by the intervention using the simulated avoided gap-days.

## 4. Advanced HR event types

In addition to the original event set, the pilot supports:

| Event | Default capacity effect | Notes |
|---|---:|---|
| `long_term_absence` | -1 FTE | Temporary gap; e.g. extended absence / sabbatical |
| `return_from_absence` | +1 FTE | Restores capacity after a temporary absence |
| `internal_promotion` | -1 FTE in source group | Destination movement should be represented explicitly if tracked |
| `role_transformation` | 0 headcount | May carry `skill_gap_fte` to represent a skills rather than numeric capacity gap |

`role_transformation` is deliberately not forced into headcount logic.

## 5. Skills Substitution Map

The public demo includes a small illustrative mapping layer to test the workflow:

**target occupation → potential substitute → illustrative skill match → missing skills → upskill duration → eligibility/licensing check**

These mappings are not official Saudi Skills Taxonomy mappings and must not be treated as authorization for transfer, credentialing, or clinical/professional substitution.

## 6. Decision Delivery

The public site can generate Decision Card previews. It does not send messages.

Production integrations are designed for:
- Microsoft Teams
- Slack
- Email

A production action requires authenticated identity, RBAC, action-state persistence, and audit logging.

## 7. Executive export

The public pilot provides:
- Print / Save PDF
- Word-compatible `.doc`
- PowerPoint-compatible `.ppt`

The Word/PowerPoint exports are committee-friendly presentation documents generated from the current executive brief. Production deployments may replace these with organization-branded OOXML templates.
