# Ralph Loop Progress

## Iteration 2 – Advanced gross-mode calculator (2026-03-29 08:55 PT)

### Status
- [x] Complete

### What Was Done
- Replaced the placeholder Advanced tab with a working gross-income workflow for both parents (wages + additional income + deduction capture).
- Added simple but explicit heuristics for federal/state taxes and FICA (single filer, 2024 brackets) plus manual overrides for every line.
- Fed the computed net disposable income directly into the guideline estimator when Advanced mode is active while keeping Quick mode untouched.
- Added per-parent breakdown cards, inline helper text, warning alert, and shared parenting-time/add-on controls accessible from both tabs.
- Updated `specs/child-support-gross-mode.md` and `IMPLEMENTATION_PLAN.md` to reflect the delivered behavior and next iteration.

### Blockers
- No automated test suite yet (`npm run test` script is still undefined); noted for follow-up.

### Validation
- `npx eslint src/components/ChildSupportEstimator.tsx`
- `npm run test` → script missing (expected; documented here).
- `npm run build`

### Files Touched
- `src/components/ChildSupportEstimator.tsx`
- `specs/child-support-gross-mode.md`
- `IMPLEMENTATION_PLAN.md`
- `PROGRESS.md`

### Next Step
- Kick off Iteration 3: spousal support estimate card + ATRO reminder + email summary flow (per plan).
