# Story 3.5: Document OCR step (Document AI) behind provider interface

Status: review

## Story

As a developer,  
I want an OCR provider interface with a Document AI implementation,  
so that scanned PDFs can be converted to text in a pluggable way.

## Acceptance Criteria

1. Given a scanned PDF resume is ingested, when the OCR job runs, then OCR text output is produced and stored/associated with the ResumeDocument.
2. Provider calls are isolated behind `src/server/ocr/provider.ts`.
3. Failures are retried and surfaced in job status.

## Tasks / Subtasks

- [x] Define OCR provider interface (`src/server/ocr/provider.ts`) (AC: 2)
- [x] Implement Document AI provider (AC: 1, 2)
- [x] Persist OCR text output association to `ResumeDocument` (AC: 1)
- [x] Wire OCR job processor with retries/backoff (AC: 3)
- [x] Ensure no raw document content is logged; record only safe metadata/counters (AC: 1-3)
- [x] Add tests using stubs/mocks in CI (AC: 2-3)

## Dev Notes

- Instrument per-page costs/usage counters for estimates; do not log raw document content.

### References

- [Source: docs/epics.md#Story 3.5: Document OCR step (Document AI) behind provider interface]
- [Source: docs/architecture.md#Decision Summary]
- [Source: docs/PRD.md#OCR]

## Dev Agent Record

### Context Reference

- `docs/stories/3-5-document-ocr-step-document-ai-behind-provider-interface.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-03-01:
- Added OCR provider interface and provider selection (`src/server/ocr/provider.ts`) with `noop` and Document AI (`@google-cloud/documentai`) implementations.
- Added `ocrProvider` + `ocrText` to `ResumeDocument` and created migration `20260301000100_add_resume_document_ocr_text`.
- Added OCR service (`src/server/ocr/ocrService.ts`) to run OCR and persist output, marking `ocrStatus` COMPLETE/FAILED.
- Added BullMQ OCR queue wiring (`ocr-resume`) and API endpoints to enqueue and query job status.
- Worker (`scripts/worker.mjs`) processes `ocr-resume` jobs by calling internal app endpoint (`/api/internal/ocr/run`) protected by `PRISM_INTERNAL_WORKER_TOKEN`.
- Verified `npm test`, `npm run lint -- --max-warnings=0`, and `npm run build` pass.

### Completion Notes List

 - ✅ OCR output text is stored on `ResumeDocument.ocrText` and provider is recorded.
 - ✅ Provider calls are isolated behind `src/server/ocr/provider.ts`.
 - ✅ OCR jobs retry with backoff (BullMQ attempts/backoff) and job state is queryable via API.
 - ✅ No raw document content is logged (only safe counters like byteCount/charCount/pageCount).

### File List

 - NEW: `src/server/ocr/provider.ts`
 - NEW: `src/server/ocr/ocrService.ts`
 - NEW: `src/server/ocr/ocrQueue.ts`
 - NEW: `src/server/ocr/ocrJobsService.ts`
 - NEW: `src/app/api/internal/ocr/run/route.ts`
 - NEW: `src/app/api/ocr/enqueue/route.ts`
 - NEW: `src/app/api/ocr/jobs/[id]/route.ts`
 - NEW: `prisma/migrations/20260301000100_add_resume_document_ocr_text/migration.sql`
 - MODIFIED: `prisma/schema.prisma`
 - MODIFIED: `scripts/worker.mjs`
 - MODIFIED: `src/jobs/queues.ts`
 - MODIFIED: `src/middleware.ts`
 - MODIFIED: `.env.example`

## Change Log

- 2026-03-01: Draft created
 - 2026-03-01: Implemented OCR provider interface, Document AI provider, OCR persistence, queue/job wiring, internal worker execution, and tests; marked for review

