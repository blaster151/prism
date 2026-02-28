# Story 1.7: Admin UI for user management (minimal)

Status: review

## Story

As an admin,  
I want a minimal admin screen to manage users and roles,  
so that access can be managed without developer intervention.

## Acceptance Criteria

1. Admin can view users and set their role to Admin or PowerUser.
2. Role changes are audit-logged.
3. UX is minimal but correct (focus on correctness + audit logging).

## Tasks / Subtasks

- [x] Create an admin page (e.g., `src/app/(app)/admin/page.tsx`) gated by RBAC (AC: 1)
- [x] Implement list-users + update-role server APIs/services (AC: 1)
- [x] Ensure updates are protected by RBAC and emit `audit_event` entries (AC: 2)
- [x] Add basic UI feedback for success/failure and unauthorized access (AC: 3)
- [x] Add unit/integration tests for role update RBAC + audit log write (AC: 1, 2)

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

2026-02-28:
- Added admin APIs (`GET /api/admin/users`, `PATCH /api/admin/users/:id/role`) backed by service layer RBAC.
- Implemented minimal `/admin` UI to list users and update roles with basic success/error feedback.
- Role changes write `audit_event` entries using the shared audit logger + event taxonomy.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

- ✅ Admin can view users and update roles (Admin/PowerUser) from `/admin`.
- ✅ Role changes are RBAC-protected server-side and audit-logged (`admin.user.role_change`).
- ✅ Minimal UI feedback provided for save success/failure; forbidden access shows safe error.
- ✅ Unit tests validate RBAC + audit write behavior on role updates.

### File List

- NEW: `src/server/admin/usersService.ts`
- NEW: `src/app/api/admin/users/route.ts`
- NEW: `src/app/api/admin/users/[id]/role/route.ts`
- NEW: `src/app/admin/UserRoleSelect.tsx`
- NEW: `src/server/admin/usersService.test.ts`
- MODIFIED: `src/app/admin/page.tsx`
- MODIFIED: `src/server/audit/eventTypes.ts`
- MODIFIED: `package.json`
- MODIFIED: `package-lock.json`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/1-7-admin-ui-for-user-management-minimal.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented minimal admin user management UI + APIs with RBAC and audit logging; added tests; validated test/lint/build; marked ready for review
