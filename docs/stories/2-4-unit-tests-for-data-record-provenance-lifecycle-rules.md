# Story 2.4: Unit tests for Data Record provenance + lifecycle rules

Status: done

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

- [x] Add unit/integration tests for provenance transition logic (AC: 1, 5)
- [x] Add unit/integration tests for lifecycle transition logic (AC: 2, 5)
- [x] Add tests ensuring RBAC helpers block/allow as expected (AC: 3)
- [x] Add tests verifying audit events are written for lifecycle/edit mutations (AC: 4)
- [x] Use stubs/mocks for any provider integrations; no network calls in CI (AC: 5)

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

2026-02-28:
- Added/extended tests covering provenance transitions, lifecycle transitions, RBAC gating, and audit logging for sensitive mutations.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

- ✅ Provenance transition covered via Data Record edit tests (`EXTRACTED/INFERRED` → `USER_EDITED` behavior enforced).
- ✅ Lifecycle transition covered via candidate lifecycle mutation tests (Active → Archive) with audit logging.
- ✅ RBAC gating covered via helper tests and mutation denial tests.
- ✅ Audit events verified for both lifecycle and edit mutations.
- ✅ Tests use mocks/stubs only; no network calls.

### File List

- MODIFIED: `src/server/records/dataRecordService.test.ts`
- MODIFIED: `src/server/candidates/candidatesService.test.ts`
- (Existing coverage) `src/server/auth/requireRole.test.ts`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/2-4-unit-tests-for-data-record-provenance-lifecycle-rules.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Added trust-primitive test coverage for provenance/lifecycle/RBAC/audit; validated test/lint/build; marked ready for review
- 2026-02-28: Code review approved; marked done

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — trust-primitive tests are in place for provenance, lifecycle, RBAC gating, and audit logging without external dependencies.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Provenance transition coverage | IMPLEMENTED | `src/server/records/dataRecordService.test.ts` |
| 2 | Lifecycle transition coverage | IMPLEMENTED | `src/server/candidates/candidatesService.test.ts` |
| 3 | RBAC gating coverage | IMPLEMENTED | `src/server/auth/requireRole.test.ts`, mutation denial tests |
| 4 | Audit event creation coverage | IMPLEMENTED | `dataRecordService.test.ts`, `candidatesService.test.ts` (auditLog asserted) |
| 5 | Fast/deterministic/no network | IMPLEMENTED | Vitest mocks only; no network calls |

