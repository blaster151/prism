# Story 2.4: Unit tests for Data Record provenance + lifecycle rules

Status: ready-for-dev

## Story

As a developer,  
I want automated tests around provenance and lifecycle behavior,  
so that future ingestion and search changes do not break correctness or auditability.

## Acceptance Criteria

1. Test suite includes coverage for provenance source transitions (e.g., `EXTRACTED` → `USER_EDITED`).
2. Test suite includes coverage for lifecycle transitions (Active/Archive).
3. Test suite includes coverage for RBAC gating for restricted actions.
4. Test suite includes coverage for audit event creation for sensitive mutations.
5. Tests are fast, deterministic, and avoid external API calls.

## Tasks / Subtasks

- [ ] Add unit/integration tests for provenance transition logic (AC: 1, 5)
- [ ] Add unit/integration tests for lifecycle transition logic (AC: 2, 5)
- [ ] Add tests ensuring RBAC helpers block/allow as expected (AC: 3)
- [ ] Add tests verifying audit events are written for lifecycle/edit mutations (AC: 4)
- [ ] Use stubs/mocks for any provider integrations; no network calls in CI (AC: 5)

## Dev Notes

- These tests are intended to protect “trust primitives” (provenance + lifecycle + audit + RBAC) before ingestion/search complexity grows.

### Project Structure Notes

- Keep tests CI-friendly and non-interactive.

### References

- [Source: docs/epics.md#Story 2.4: Unit tests for Data Record provenance + lifecycle rules]
- [Source: docs/architecture.md#Implementation Patterns]
- [Source: docs/PRD.md#Non-Functional Requirements]

## Dev Agent Record

### Context Reference

- `docs/stories/2-4-unit-tests-for-data-record-provenance-lifecycle-rules.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
