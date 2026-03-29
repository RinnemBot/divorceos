# Implementation Plan – Support Calculators

## Completed
- [x] Draft gross-income + spousal support specs (iteration 0)
- [x] Iteration 1: Quick vs. Advanced tabs + shared estimator state (2026-03-29) — UI split + shared logic ready for gross-mode
- [x] Iteration 2: Gross-mode calculator + breakdown (2026-03-29) — Advanced tab now captures gross income, deductions, and feeds net disposable income into the guideline engine with user overrides and warnings

## In Progress
- [ ] Iteration 3: Add spousal support estimate card (temporary guideline 40/50 rule) + ATRO reminder + optional email share

## Backlog
- [ ] Wire up form validation + unit tests for net/gross parity and edge cases
- [ ] Update docs/marketing copy to explain the two modes and disclaimers
- [ ] Deploy Paperclip mission control (Node server + React UI), register Maria/Ralph agents, and sync goals/tasks for dashboard visibility
