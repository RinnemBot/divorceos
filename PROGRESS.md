# Ralph Loop Progress

## Iteration 6 – AgentMail intake sync (2026-04-03 23:40 PT)

### Status
- [x] Complete (AgentMail); Paperclip pending source hookup

### What Was Done
- Added a `scripts/sync-concierge.mjs` ingestion script that pulls AgentMail threads via the official SDK, normalizes metadata, uploads attachments into the Supabase vault, and upserts the new queue rows.
- Introduced a `sync:queue` npm script (`npm run sync:queue -- agentmail`) plus `agentmail` + `dotenv` dependencies so the job can run locally or from a cron/worker with minimal setup.
- Extended `FilingQueueDocument` to carry per-document metadata (attachment IDs, content types) so we can skip duplicates and attribute sources in the dashboard.
- Hardened the sync script with `.env.server` loading, bucket uploads, dedupe logic, and a table-existence guard (errors early if the SQL migration hasn’t been applied).

### Blockers / Next Up
- Paperclip feed still needs a defined data source (API or webhook). Once we know where Paperclip emits filings, we can plug that into the same script.
- Supabase table must exist before running the sync; execute `supabase/concierge-queue.sql` if it hasn’t been applied.

### Validation
- `npm run sync:queue -- agentmail` (currently halts early because the concierge table hasn’t been created yet—expected until the SQL migration runs).

### Files Touched
- `scripts/sync-concierge.mjs`
- `package.json`
- `package-lock.json`
- `src/types/concierge.ts`
- `PROGRESS.md`

---

## Iteration 5 – Supabase concierge queue + staff dashboard (2026-04-03 22:30 PT)

### Status
- [x] Complete

### What Was Done
- Defined the `concierge_filing_requests` Supabase table (SQL + trigger) to track intake status, rush priority, deadlines, and attachments for every concierge filing.
- Added a new `/api/filing-queue` route (GET/POST/PATCH) that reads/writes the table with service-role credentials, generates signed document URLs, and exposes summary metrics for the UI.
- Built an internal “Staff” tab inside the dashboard featuring filters, search, live status updates, claim/unclaim actions, and document shortcuts.
- Wired the staff tab to auto-load queue data, display rush/awaiting-client counts, and enforce staff-only visibility using the existing admin email list.

### Blockers
- None. One Legal API is still pending credentials, but this queue is ready to feed that integration.

### Validation
- `npm run build`

### Files Touched
- `api/filing-queue.ts`
- `src/components/ConciergeQueuePanel.tsx`
- `src/pages/DashboardPage.tsx`
- `src/services/auth.ts`
- `src/types/concierge.ts`
- `supabase/concierge-queue.sql`
- `PROGRESS.md`

---

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

---

## Iteration 3 – Spousal support integration (2026-03-29 08:55 PT)

### Status
- [x] Complete

### What Was Done
- Added a “Spousal support snapshot” card that leverages the 40/50 heuristic, syncs with the current child-support numbers, and exposes filing status, dependents, and adjustment inputs.
- Surfaced an ATRO reminder plus an optional email summary form (front-end only for now) to mirror the workflow attorneys expect.
- Wired the child-support outputs up so higher/lower net incomes can populate the spousal estimate with a single click.
- Updated specs + implementation plan to reflect the new behavior and queued Iteration 4 (validation & docs).

### Blockers
- Email delivery is still a stub—awaiting backend/mail service hookup.

### Validation
- `npx eslint src/components/ChildSupportEstimator.tsx`
- `npm run test` → script missing (still pending).
- `npm run build`

### Files Touched
- `src/components/ChildSupportEstimator.tsx`
- `specs/child-support-gross-mode.md`
- `IMPLEMENTATION_PLAN.md`
- `PROGRESS.md`

### Next Step
- Iteration 4: focus on automated validation (lint/test parity) and documentation/marketing copy updates per plan.
