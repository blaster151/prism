# Story 1.5: Enforce RBAC with two roles (Admin, PowerUser)

Status: drafted

## Story

As an admin,  
I want role-based access control enforced consistently,  
so that only authorized users can access admin features and audit logs.

## Acceptance Criteria

1. A signed-in user with role `POWER_USER` is denied access to admin-only routes/APIs with a clear error.
2. A signed-in user with role `ADMIN` can access admin routes/APIs.
3. RBAC is enforced in the service layer (not only in the UI).

## Tasks / Subtasks

- [ ] Define role model (`ADMIN`, `POWER_USER`) in the DB and app types (AC: 1, 2)
- [ ] Implement `requireRole`/RBAC helpers in the server layer (AC: 3)
- [ ] Apply RBAC checks to admin route handlers and admin UI entry points (AC: 1, 2)
- [ ] Ensure unauthorized attempts are handled consistently (error envelope + no sensitive leakage) (AC: 1)
- [ ] Add unit tests for RBAC helper(s) and one protected route (AC: 1, 2, 3)

## Dev Notes

- The architecture pattern is “service layer first”: enforce RBAC inside `src/server/*` services that route handlers call.
- Keep the initial role model minimal (Admin, PowerUser).

### Project Structure Notes

- RBAC helpers are expected under `src/server/auth/` (e.g., `rbac.ts`, `requireRole.ts`) per the architecture structure.

### References

- [Source: docs/epics.md#Story 1.5: Enforce RBAC with two roles (Admin, PowerUser)]
- [Source: docs/architecture.md#ADR-005: Authorization (RBAC) and role model]
- [Source: docs/architecture.md#Implementation Patterns]
- [Source: docs/PRD.md#Functional Requirements]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
