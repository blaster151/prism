# Story 3.6: Extraction step (LLM over extracted text) with provenance staging

Status: review

## Story

As a PowerUser,  
I want extracted text converted into structured Data Record fields with provenance,  
so that I can review/edit and the system never silently overwrites factual data.

## Acceptance Criteria

1. Given OCR text is available, when extraction runs, then a Data Record is created/updated with field provenance (`EXTRACTED` vs `INFERRED`).
2. Suggested changes to “factual” fields are staged for explicit user confirmation.
3. Extraction actions are audit-logged.

## Tasks / Subtasks

- [x] Implement extraction processor/job that reads OCR text and produces structured output (AC: 1)
- [x] Write DataRecord updates with explicit provenance rows per field (AC: 1)
- [x] Implement staging mechanism for suggested factual field changes (AC: 2)
- [x] Audit-log extraction run + applied changes with safe metadata (AC: 3)
- [x] Add tests with stubs/mocks (no network calls) (AC: 1-3)

## Dev Notes

- Keep extraction deterministic where possible via schemas; store model name/version for traceability.

### References

- [Source: docs/epics.md#Story 3.6: Extraction step (LLM over extracted text) with provenance staging]
- [Source: docs/architecture.md#Provenance is modeled, not implied]
- [Source: docs/PRD.md#AI governance (no silent overwrites)]

## Dev Agent Record

### Context Reference

- `docs/stories/3-6-extraction-step-llm-over-extracted-text-with-provenance-staging.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-03-01:
- Added extraction provider interface (`src/server/extract/provider.ts`) and deterministic default provider (`noop`) to produce structured fields from OCR text.
- Implemented extraction service (`src/server/extract/extractService.ts`) that updates/creates `DataRecord`, writes per-field provenance (`EXTRACTED`/`INFERRED`), and stages factual-field overwrites as `ExtractionSuggestion` rows (no silent overwrites).
- Added extraction queue (`extract-resume`) with internal worker execution via `POST /api/internal/extract/run` protected by `PRISM_INTERNAL_WORKER_TOKEN`; also added enqueue + job status endpoints.
- Added extraction audit events (`extract.run`, `extract.apply`) with safe metadata only (no raw OCR text logged).
- Verified `npm test`, `npm run lint -- --max-warnings=0`, and `npm run build` pass.

### Completion Notes List

 - ✅ With OCR text, extraction applies safe updates to `DataRecord.fields` and writes provenance rows per applied field.
 - ✅ Factual-field overwrites are staged in `ExtractionSuggestion` for explicit user confirmation.
 - ✅ Extraction runs are audit-logged and job failures retry via BullMQ.

### File List

 - NEW: `src/server/extract/provider.ts`
 - NEW: `src/server/extract/extractService.ts`
 - NEW: `src/server/extract/extractionLogic.ts`
 - NEW: `src/server/extract/extractQueue.ts`
 - NEW: `src/server/extract/extractJobsService.ts`
 - NEW: `src/app/api/internal/extract/run/route.ts`
 - NEW: `src/app/api/extract/enqueue/route.ts`
 - NEW: `src/app/api/extract/jobs/[id]/route.ts`
 - NEW: `prisma/migrations/20260301000200_extraction_suggestions/migration.sql`
 - MODIFIED: `prisma/schema.prisma`
 - MODIFIED: `src/server/audit/eventTypes.ts`
 - MODIFIED: `src/jobs/queues.ts`
 - MODIFIED: `src/jobs/worker.ts`
 - MODIFIED: `scripts/worker.mjs`
 - MODIFIED: `.env.example`

## Change Log

- 2026-03-01: Draft created
 - 2026-03-01: Implemented extraction w/ provenance + staging suggestions, queue/job wiring, audit logging, and tests; marked for review

