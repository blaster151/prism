# Story 1.7: Admin UI for user management (minimal)

Status: in-progress

## Story

As an admin,  
I want a minimal admin screen to manage users and roles,  
so that access can be managed without developer intervention.

## Acceptance Criteria

1. Admin can view users and set their role to Admin or PowerUser.
2. Role changes are audit-logged.
3. UX is minimal but correct (focus on correctness + audit logging).

## Tasks / Subtasks

- [ ] Create an admin page (e.g., `src/app/(app)/admin/page.tsx`) gated by RBAC (AC: 1)
- [ ] Implement list-users + update-role server APIs/services (AC: 1)
- [ ] Ensure updates are protected by RBAC and emit `audit_event` entries (AC: 2)
- [ ] Add basic UI feedback for success/failure and unauthorized access (AC: 3)
- [ ] Add unit/integration tests for role update RBAC + audit log write (AC: 1, 2)

## Dev Notes

- Admin-only functionality should be enforced in the service layer and route handlers, not only in UI.
- Audit log role changes with enough metadata for review without leaking sensitive details.

### Project Structure Notes

- Admin page location and API patterns are documented in `docs/architecture.md`.

### References

- [Source: docs/epics.md#Story 1.7: Admin UI for user management (minimal)]
- [Source: docs/architecture.md#Project Structure]
- [Source: docs/architecture.md#ADR-005: Authorization (RBAC) and role model]
- [Source: docs/architecture.md#ADR-006: Audit logging storage]
- [Source: docs/PRD.md#Functional Requirements]

## Dev Agent Record

### Context Reference

- `docs/stories/1-7-admin-ui-for-user-management-minimal.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
