# Story 1.6: Create audit_event logging primitive

Status: in-progress

## Story

As an admin,  
I want sensitive actions to be captured in an audit trail,  
so that compliance review and debugging are possible.

## Acceptance Criteria

1. Sensitive actions (e.g., sign-in, view page, export attempt) write an `audit_event` record in Postgres with actor, type, optional entity pointer, and non-sensitive metadata.
2. The system never logs raw resume content or sensitive PII to application logs.

## Tasks / Subtasks

- [ ] Ensure `AuditEvent` table/model exists in Prisma (or add it if missing) (AC: 1)
- [ ] Implement an `auditLogger` service with a minimal event type taxonomy (AC: 1)
- [ ] Provide a helper API for writing audit rows alongside mutations (AC: 1)
- [ ] Implement at least one end-to-end auditable event (e.g., auth event) (AC: 1)
- [ ] Add tests to verify audit events are written for an example action (AC: 1)
- [ ] Verify application logs avoid raw resume content / sensitive PII (AC: 2)

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

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
