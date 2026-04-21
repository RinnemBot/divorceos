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
