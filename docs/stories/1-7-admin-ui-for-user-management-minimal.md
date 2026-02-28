# Story 1.7: Admin UI for user management (minimal)

Status: done

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
- 2026-02-28: Code review approved; marked done

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — acceptance criteria met with RBAC-enforced APIs, audit logging for role changes, and minimal correct UX.

### Summary

Story 1.7 delivers a minimal admin user-management screen at `/admin` that lists users and allows role changes between `ADMIN` and `POWER_USER`. The underlying operations are implemented in a server-side service (`usersService`) that enforces RBAC via `requireRole`, and the role-update operation writes an `audit_event` using the shared audit logger with an explicit event type (`admin.user.role_change`) and safe metadata. Tests validate RBAC denial and audit logging behavior.

### Key Findings

**HIGH**

- None.

**MEDIUM**

- Admin API route handlers duplicate the same error envelope mapping logic; consider extracting a small helper for consistency as more admin endpoints are added. (Evidence: `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[id]/role/route.ts`)

**LOW**

- UX is intentionally minimal; later iterations may add optimistic UI with rollback and clearer per-row error messages, but current behavior is correct and safe. (Evidence: `src/app/admin/UserRoleSelect.tsx`)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin can view users and set role | IMPLEMENTED | `src/app/admin/page.tsx`, `src/server/admin/usersService.ts`, `GET /api/admin/users`, `PATCH /api/admin/users/:id/role` |
| 2 | Role changes are audit-logged | IMPLEMENTED | `src/server/admin/usersService.ts` (`auditLog` in transaction), `src/server/audit/eventTypes.ts` |
| 3 | UX minimal but correct | IMPLEMENTED | `src/app/admin/UserRoleSelect.tsx` success/error feedback; forbidden access shows safe error |

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| --- | --- | --- | --- |
| Admin page gated by RBAC | Completed | VERIFIED COMPLETE | `/admin` uses `adminPing` and safe error rendering (`src/app/admin/page.tsx`) |
| List-users + update-role services/APIs | Completed | VERIFIED COMPLETE | `src/server/admin/usersService.ts`, `src/app/api/admin/users/*` |
| RBAC + audit_event on updates | Completed | VERIFIED COMPLETE | `requireRole` in service; `auditLog` in `$transaction` |
| UI feedback | Completed | VERIFIED COMPLETE | `src/app/admin/UserRoleSelect.tsx` |
| Tests for role update RBAC + audit write | Completed | VERIFIED COMPLETE | `src/server/admin/usersService.test.ts` |

### Security Notes

- Role changes are enforced server-side (service layer) and cannot be bypassed by client-side UI manipulation.
- Audit metadata avoids sensitive fields (no email/password content), focusing on role transition + entity pointer.

