# Story 3.8: Playwright E2E — ingest trigger → status visible

Status: drafted

## Story

As a developer,  
I want an end-to-end test covering ingestion triggering and status visibility,  
so that the async pipeline is regression-tested.

## Acceptance Criteria

1. Given a signed-in test user, when the user triggers ingestion in the UI, then a job appears in the status view and reaches a terminal state (success or known failure).
2. Test uses mocks/doubles for Dropbox and OCR in CI (no external dependencies).

## Tasks / Subtasks

- [ ] Add Playwright E2E covering ingestion trigger → status view (AC: 1)
- [ ] Provide CI-safe test doubles for Dropbox + OCR provider (AC: 2)
- [ ] Ensure test is non-interactive and stable in CI (AC: 1-2)

## Dev Notes

- Use test doubles/mocks for Dropbox and OCR in CI to avoid external dependencies.

### References

- [Source: docs/epics.md#Story 3.8: Playwright E2E — ingest trigger → status visible]
- [Source: docs/stories/1-8-testing-foundation-unit-playwright-e2e.md]

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

