# Story 3.5: Document OCR step (Document AI) behind provider interface

Status: drafted

## Story

As a developer,  
I want an OCR provider interface with a Document AI implementation,  
so that scanned PDFs can be converted to text in a pluggable way.

## Acceptance Criteria

1. Given a scanned PDF resume is ingested, when the OCR job runs, then OCR text output is produced and stored/associated with the ResumeDocument.
2. Provider calls are isolated behind `src/server/ocr/provider.ts`.
3. Failures are retried and surfaced in job status.

## Tasks / Subtasks

- [ ] Define OCR provider interface (`src/server/ocr/provider.ts`) (AC: 2)
- [ ] Implement Document AI provider (AC: 1, 2)
- [ ] Persist OCR text output association to `ResumeDocument` (AC: 1)
- [ ] Wire OCR job processor with retries/backoff (AC: 3)
- [ ] Ensure no raw document content is logged; record only safe metadata/counters (AC: 1-3)
- [ ] Add tests using stubs/mocks in CI (AC: 2-3)

## Dev Notes

- Instrument per-page costs/usage counters for estimates; do not log raw document content.

### References

- [Source: docs/epics.md#Story 3.5: Document OCR step (Document AI) behind provider interface]
- [Source: docs/architecture.md#Decision Summary]
- [Source: docs/PRD.md#OCR]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-03-01: Draft created

