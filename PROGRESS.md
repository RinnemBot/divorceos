# Ralph: Maria Document Service

## Iteration 1 - 2026-04-20T23:09:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Inspected the existing vault upload/list flow.
- Confirmed Saved Files already reads from the Supabase vault bucket via `api/vault-documents.ts`.
- Defined a clean reusable document-service approach instead of creating a parallel storage path.
- Wrote `specs/maria-document-service.md` and initialized `IMPLEMENTATION_PLAN.md`.
- Added shared vault helpers in `api/_vault.ts` so uploads, signed URLs, and bucket initialization are centralized.
- Added reusable PDF generation in `api/_documents.ts` using `pdf-lib`.
- Added authenticated Maria document creation endpoint in `api/maria-documents.ts`.
- Added client helper in `src/services/documents.ts`.
- Refactored `api/vault-upload.ts` and `api/vault-documents.ts` to use the shared vault service.
- Installed `pdf-lib`.
- Added a Maria-side save trigger in chat so replies that fit the workflow can be saved directly to Saved Files.
- Added dashboard refresh handling when a new Maria-generated vault document is created.
- Verified the app still builds successfully.

### Blockers
- None

### Next Step
- Decide whether to auto-suggest Save to Saved Files more narrowly or expand it to more response types.

### Files Changed
- `specs/maria-document-service.md` - feature requirements and acceptance criteria
- `IMPLEMENTATION_PLAN.md` - initial task plan
- `PROGRESS.md` - progress log
- `api/_vault.ts` - shared secure vault storage helpers
- `api/_documents.ts` - reusable PDF generator
- `api/maria-documents.ts` - authenticated Maria PDF creation endpoint
- `api/vault-upload.ts` - refactored to shared vault helpers
- `api/vault-documents.ts` - refactored to shared vault helpers
- `src/services/documents.ts` - client helper for generated documents
- `src/services/api.ts` - Maria save-to-PDF offer logic
- `src/components/ChatInterface.tsx` - Save to Saved Files action in chat
- `src/pages/DashboardPage.tsx` - refresh vault list on new generated document
- `package.json` / lockfile - added pdf-lib

## Iteration 2 - 2026-05-01T15:05:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Wired the existing FW-001 template/field map into the official starter packet generator.
- Appended FW-001 to generated starter packets with caption, party/contact, case number, signature date, Superior Court waiver, no advance-fee lawyer default, and waive-all-fees default prefilled.
- Updated Draft Forms packet readiness/included forms UI so users see FW-001 included in the packet.
- Verified the Vite build and a focused TypeScript check for `api/_starter-packet.ts` both pass.

### Blockers
- None

### Next Step
- Add richer FW-001 financial intake fields if we want Maria to draft the qualification section instead of leaving it for user review.

### Files Changed
- `api/_starter-packet.ts` - FW-001 PDF template loading and starter packet append/fill logic
- `src/pages/DraftFormsPage.tsx` - packet overview now shows FW-001 included

## Iteration 3 - 2026-05-01T16:05:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Added a guided “What do I need?” packet wizard at `/what-do-i-need`.
- Wizard asks case stage, county, minor children, support/fees, filing fee waiver, and DV/safety concerns.
- Wizard recommends the correct workflow: starter packet, response packet, RFO/modification packet, judgment packet, or DV packet.
- Added recommended forms, next steps, and direct CTAs into Draft Forms, Forms, Support Tools, County Concierge, Dashboard, or Maria chat.
- Linked the wizard from navigation, home hero, forms page, and dashboard quick actions.
- Verified the app builds successfully.

### Blockers
- None

### Next Step
- Continue with the next website improvement: clearer dashboard command-center cards and more actionable county concierge flows.

### Files Changed
- `src/pages/PacketWizardPage.tsx` - new guided packet recommendation wizard
- `src/App.tsx` - added wizard route
- `src/components/Navigation.tsx` - added Wizard nav link
- `src/pages/HomePage.tsx` - hero CTA now routes users to the wizard
- `src/pages/FormsPage.tsx` - forms hero includes packet chooser CTA
- `src/pages/DashboardPage.tsx` - dashboard quick actions include packet chooser

## Iteration 4 - 2026-05-01T16:15:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Added dashboard command-center cards for packet wizard, Draft Forms, County Filing, and Saved Files.
- Made the dashboard feel more action-oriented before the detailed tabs.
- Verified the app builds successfully after the dashboard polish.

### Blockers
- None

### Next Step
- Continue with more actionable county concierge flows: “Generate editable packet,” “Download packet,” “E-file instructions,” “Serve papers,” and “Track filing.”

### Files Changed
- `src/pages/DashboardPage.tsx` - added command-center card layer above dashboard overview

## Iteration 5 - 2026-05-01T16:35:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Turned county detail pages into action hubs with five primary cards: Generate editable packet, Download packet, E-file instructions, Serve papers, and Track filing.
- Added a downloadable county packet checklist TXT that includes filing method, fees, clerk info, recommended form PDF links, local resources, and next steps.
- Added dashboard deep-link support for `/dashboard?tab=service` and `/dashboard?tab=county`, so county action cards land users directly on the relevant workstream.
- Verified the app builds successfully.

### Blockers
- None

### Next Step
- Improve the packet download from a checklist TXT into a polished PDF/ZIP packet manifest, and/or add status persistence for filing tracking.

### Files Changed
- `src/pages/CountyConciergePage.tsx` - added actionable county workflow cards and checklist download
- `src/pages/DashboardPage.tsx` - added query-param tab deep links for service/county tracking

## Iteration 6 - 2026-05-01T16:45:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Added a polished printable county packet manifest from each county concierge page.
- Manifest opens in a new tab with print styling, county summary, clerk info, recommended form links, local resources, execution checklist, and disclaimer.
- Users can use browser Print → Save as PDF for a cleaner packet manifest than the TXT checklist.
- Verified the app builds successfully.

### Blockers
- None

### Next Step
- Add persistent filing tracking/statuses in the dashboard so users can mark generated, filed, served, proof-filed, and waiting-for-clerk-review steps complete.

### Files Changed
- `src/pages/CountyConciergePage.tsx` - added print/PDF manifest builder and action card

## Iteration 7 - 2026-05-01T16:55:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Added persistent filing tracker state to the dashboard using per-user localStorage.
- Added filing milestones: Packet generated, Packet filed with court, Other party served, Proof of service filed, Waiting for clerk review, and Accepted/stamped copies received.
- Added filing progress summary to the dashboard overview with next-step guidance.
- Added a full tracker panel in the County Filing tab with checkboxes, completion timestamps, notes field, related-section shortcuts, and reset action.
- Existing county concierge links to `/dashboard?tab=county` and `/dashboard?tab=service` now land users on useful tracker sections.
- Verified the app builds successfully.

### Blockers
- None

### Next Step
- Move filing tracker persistence from localStorage into Supabase when ready, so tracker state follows the account across devices.

### Files Changed
- `src/pages/DashboardPage.tsx` - persistent filing tracker state and UI

## Iteration 8 - 2026-05-01T17:05:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Added Supabase SQL for `site_filing_trackers` so each authenticated user has one account-backed filing tracker row.
- Added authenticated API actions for loading and saving the filing tracker through `/api/auth`.
- Added client auth service methods for `getFilingTracker()` and `saveFilingTracker()`.
- Updated the dashboard tracker to load from Supabase, debounce-save changes back to Supabase, and keep localStorage as a fallback/offline backup.
- Added tracker sync status messaging so users can tell when it is account-backed versus local fallback.
- Verified the app builds successfully.

### Blockers
- Supabase migration must be run before production tracker sync works: `supabase/site-filing-trackers.sql`.

### Next Step
- Apply the Supabase migration, then optionally add a tiny “last synced” timestamp or server-side updated-at display in the dashboard.

### Files Changed
- `supabase/site-filing-trackers.sql` - new filing tracker table
- `api/auth.ts` - authenticated filing tracker get/save actions
- `src/services/auth.ts` - filing tracker API client methods/types
- `src/pages/DashboardPage.tsx` - Supabase-backed tracker sync with local fallback

## Iteration 9 - 2026-05-01T17:15:00-07:00

### Status
- [ ] In Progress
- [ ] Blocked
- [x] Complete

### What Was Done
- Added server `updatedAt` to filing tracker API responses.
- Added dashboard “Last synced” timestamp next to the account sync status.
- Timestamp updates after remote load and after each successful Supabase save.
- Verified the app builds successfully.

### Blockers
- None

### Next Step
- Continue improving user confidence with clearer save feedback/toasts or a tracker activity history.

### Files Changed
- `api/auth.ts` - exposes tracker updated_at as updatedAt
- `src/services/auth.ts` - filing tracker type accepts updatedAt
- `src/pages/DashboardPage.tsx` - last synced timestamp UI
