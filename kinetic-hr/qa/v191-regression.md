# v191: one evidence state for every decision surface

The first v190 render validated the demo against an older event-type list. It
quarantined three rows. A deferred expert-panel callback revalidated the same
events after the final validator loaded, accepting all 72, but refreshed only
some cards. The radar and early-warning summary retained the earlier result.
Changing language redrew everything, which hid the defect in previous tests.

Validation now runs once in `init()`, after all validators load and before any
view renders. Dataset imports and demo reset validate their complete input and
then redraw all views. UI enrichment never changes quality state.

`KHMeasurement.forRow(row)` supplies `alert_state`, `event_log_completeness`,
`decision_basis`, the gated surveillance result and a reason code. The radar,
navigation badge and early-warning counts use `KHMeasurement.forSector()`.
Decision copy, scenarios and reports use the same row state through
`KHDecision`. Surveillance callers and priority factors use the shared gate.
The radar counts acceleration alerts; monitoring remains a separate state.

Temporal coverage must be 100% across the current and three baseline windows.
This is declared time coverage, not proof that every source event is present.
Quarantined rows, missing events, an invalid denominator or insufficient group
size independently block incidence. Blocked rates and multipliers are null;
stock-based recommendations remain explicitly labelled prevalence-only.

The browser regression checks the untouched initial Arabic and English render
at three viewport widths, before any language switch or navigation. It also
uploads an otherwise-valid event file with one invalid row, replaces that file,
imports a snapshot missing the final history day, restores valid inputs, changes
the alert threshold, and reloads the persisted policy. Each transition checks
the command recommendation, radar, early-warning summary/card and scenario.
