# Story 3.6: Extraction step (LLM over extracted text) with provenance staging

Status: drafted

## Story

As a PowerUser,  
I want extracted text converted into structured Data Record fields with provenance,  
so that I can review/edit and the system never silently overwrites factual data.

## Acceptance Criteria

1. Given OCR text is available, when extraction runs, then a Data Record is created/updated with field provenance (`EXTRACTED` vs `INFERRED`).
2. Suggested changes to “factual” fields are staged for explicit user confirmation.
3. Extraction actions are audit-logged.

## Tasks / Subtasks

- [ ] Implement extraction processor/job that reads OCR text and produces structured output (AC: 1)
- [ ] Write DataRecord updates with explicit provenance rows per field (AC: 1)
- [ ] Implement staging mechanism for suggested factual field changes (AC: 2)
- [ ] Audit-log extraction run + applied changes with safe metadata (AC: 3)
- [ ] Add tests with stubs/mocks (no network calls) (AC: 1-3)

## Dev Notes

- Keep extraction deterministic where possible via schemas; store model name/version for traceability.

### References

- [Source: docs/epics.md#Story 3.6: Extraction step (LLM over extracted text) with provenance staging]
- [Source: docs/architecture.md#Provenance is modeled, not implied]
- [Source: docs/PRD.md#AI governance (no silent overwrites)]

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

