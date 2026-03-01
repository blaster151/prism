# Story 1.6: Create audit_event logging primitive

Status: done

## Story

As an admin,  
I want sensitive actions to be captured in an audit trail,  
so that compliance review and debugging are possible.

## Acceptance Criteria

1. Sensitive actions (e.g., sign-in, view page, export attempt) write an `audit_event` record in Postgres with actor, type, optional entity pointer, and non-sensitive metadata.
2. The system never logs raw resume content or sensitive PII to application logs.

## Tasks / Subtasks

- [x] Ensure `AuditEvent` table/model exists in Prisma (or add it if missing) (AC: 1)
- [x] Implement an `auditLogger` service with a minimal event type taxonomy (AC: 1)
- [x] Provide a helper API for writing audit rows alongside mutations (AC: 1)
- [x] Implement at least one end-to-end auditable event (e.g., auth event) (AC: 1)
- [x] Add tests to verify audit events are written for an example action (AC: 1)
- [x] Verify application logs avoid raw resume content / sensitive PII (AC: 2)

## Dev Notes

- Audit logging is a first-class architectural requirement for an “audit-ready” posture.
- Prefer writing audit rows in the same transaction as sensitive mutations when feasible.

### Project Structure Notes

- Audit service is expected under `src/server/audit/` (e.g., `auditLogger.ts`, `eventTypes.ts`) per the architecture structure.

### References

- [Source: docs/epics.md#Story 1.6: Create audit_event logging primitive]
- [Source: docs/architecture.md#ADR-006: Audit logging storage]
- [Source: docs/architecture.md#Implementation Patterns]
- [Source: docs/PRD.md#Audit Logging and Reporting]

## Dev Agent Record

### Context Reference

- `docs/stories/1-6-create-audit-event-logging-primitive.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-02-28:
- Added `src/server/audit/auditLogger.ts` + `eventTypes.ts` and updated auth/admin paths to use the audit logger.
- Added unit test verifying audit writes via mocked Prisma client (`src/server/audit/auditLogger.test.ts`).
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

- ✅ Audit logger primitive writes `audit_event` rows with actor/type/entity pointer and JSON metadata.
- ✅ Auth sign-in/sign-out and admin access now emit audit events using the shared audit logger.
- ✅ No raw resume content is logged; metadata is constrained to non-sensitive JSON.
- ✅ Tests validate audit writes without requiring a DB.

### File List

- NEW: `src/server/audit/auditLogger.ts`
- NEW: `src/server/audit/eventTypes.ts`
- NEW: `src/server/audit/auditLogger.test.ts`
- MODIFIED: `src/server/auth.ts`
- MODIFIED: `src/server/admin/adminService.ts`
- MODIFIED: `src/app/api/admin/ping/route.ts`
- MODIFIED: `src/app/admin/page.tsx`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/1-6-create-audit-event-logging-primitive.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented audit logging primitive + taxonomy; wired into auth/admin; added tests; validated test/lint/build; marked ready for review
- 2026-02-28: Code review approved; marked done

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — audit logging primitive is implemented with verifiable writes and safe metadata handling.

### Summary

Story 1.6 delivers the audit logging primitive under `src/server/audit/`: a small, reusable `auditLog()` helper and a minimal taxonomy in `eventTypes.ts`. Auth sign-in/sign-out events and an example admin access event now emit audit rows through the shared logger, satisfying the “end-to-end auditable event” requirement. Tests validate audit writes via a mocked Prisma client, and the implementation avoids logging raw resume content or sensitive PII in application logs.

### Key Findings

**HIGH**

- None.

**MEDIUM**

- Consider tightening the audit taxonomy and metadata schema over time (e.g., per-event metadata allowlists) to avoid unbounded growth and reduce the risk of accidental sensitive data capture. (Evidence: `src/server/audit/auditLogger.ts`, `src/server/audit/eventTypes.ts`)

**LOW**

- `adminPing` currently writes an audit event on access; later admin actions (role changes, audit log viewing) should also emit explicit events with entity pointers for stronger traceability. (Evidence: `src/server/admin/adminService.ts`)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Sensitive actions write `audit_event` with actor/type/entity/metadata | IMPLEMENTED | `src/server/audit/auditLogger.ts`, `src/server/auth.ts`, `src/server/admin/adminService.ts`, `prisma/schema.prisma` |
| 2 | Never logs raw resume content or sensitive PII to app logs | IMPLEMENTED | No logging added; metadata constrained to JSON-safe values in `auditLog` usage (`src/server/audit/auditLogger.ts`) |

**AC Coverage Summary:** 2 of 2 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| --- | --- | --- | --- |
| Ensure `AuditEvent` exists | Completed | VERIFIED COMPLETE | `prisma/schema.prisma:32-45` |
| Implement `auditLogger` + taxonomy | Completed | VERIFIED COMPLETE | `src/server/audit/auditLogger.ts`, `src/server/audit/eventTypes.ts` |
| Helper API for audit rows alongside mutations | Completed | VERIFIED COMPLETE | `auditLog(input, { tx })` signature in `src/server/audit/auditLogger.ts` |
| End-to-end auditable event | Completed | VERIFIED COMPLETE | `auth` events use audit logger in `src/server/auth.ts` |
| Tests verify audit write | Completed | VERIFIED COMPLETE | `src/server/audit/auditLogger.test.ts` |
| Verify logs avoid PII | Completed | VERIFIED COMPLETE | No raw resume content/logging introduced; safe metadata guidance adhered to |

### Test Coverage and Gaps

- Unit test verifies audit row write call contract without DB dependency.
- Additional integration coverage (DB-backed) can be added later once CI provisions Postgres.

