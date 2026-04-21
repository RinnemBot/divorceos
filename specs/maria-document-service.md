# Maria Document Service

## Goal
Create a reusable server-side document service that lets Maria generate PDF files, store them in the existing secure vault, and make them appear in the user dashboard Saved Files flow without creating a separate storage system.

## Requirements
- Reuse the existing Supabase vault bucket used by `api/vault-upload.ts` and `api/vault-documents.ts`.
- Support server-side PDF generation from structured content, starting with simple text/section-based documents.
- Save generated files under the authenticated user's vault path.
- Return document metadata in the same shape the dashboard already expects (`id`, `name`, `uploadedAt`, `size`, `downloadUrl`).
- Keep the implementation reusable so future Maria actions can generate declarations, summaries, checklists, and packet covers.
- Do not require the browser to upload the file back after generation.

## First implementation scope
- Add a reusable service module for:
  - ensuring vault bucket access
  - generating safe filenames and storage paths
  - uploading buffers
  - creating signed URLs
- Add a reusable PDF generator module for basic document composition.
- Add an authenticated API route to create a Maria-generated PDF directly from content.
- Add client API helpers for the new route.
- Do not yet wire the chat UI button flow unless the backend path is complete and validated.

## Acceptance criteria
- Server can generate a PDF from a title + content payload.
- PDF is stored in the same secure vault bucket as manual uploads.
- Generated document appears in Dashboard Saved Files after refresh.
- Build passes.
