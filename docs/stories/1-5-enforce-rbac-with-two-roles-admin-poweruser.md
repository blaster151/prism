# Story 1.5: Enforce RBAC with two roles (Admin, PowerUser)

Status: done

## Story

As an admin,  
I want role-based access control enforced consistently,  
so that only authorized users can access admin features and audit logs.

## Acceptance Criteria

1. A signed-in user with role `POWER_USER` is denied access to admin-only routes/APIs with a clear error.
2. A signed-in user with role `ADMIN` can access admin routes/APIs.
3. RBAC is enforced in the service layer (not only in the UI).

## Tasks / Subtasks

- [x] Define role model (`ADMIN`, `POWER_USER`) in the DB and app types (AC: 1, 2)
- [x] Implement `requireRole`/RBAC helpers in the server layer (AC: 3)
- [x] Apply RBAC checks to admin route handlers and admin UI entry points (AC: 1, 2)
- [x] Ensure unauthorized attempts are handled consistently (error envelope + no sensitive leakage) (AC: 1)
- [x] Add unit tests for RBAC helper(s) and one protected route (AC: 1, 2, 3)

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

- `docs/stories/1-5-enforce-rbac-with-two-roles-admin-poweruser.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-02-28:
- Implemented RBAC helpers under `src/server/auth/` and a minimal `AppError` envelope to standardize unauthorized responses.
- Added a protected admin service (`adminPing`), a protected API route (`GET /api/admin/ping`), and an admin page entrypoint (`/admin`) that displays a safe forbidden message.
- Added non-interactive unit tests using Vitest (`npm test`).

### Completion Notes List

- ✅ POWER_USER receives a consistent 403 error envelope on admin API access; admin-only checks live in the service layer.
- ✅ ADMIN is allowed to access the admin API and admin page.
- ✅ Unit tests cover RBAC helper and a protected admin service.
- ✅ `npm test`, `npm run lint`, and `npm run build` pass.

### File List

- NEW: `src/server/auth/rbac.ts`
- NEW: `src/server/auth/requireRole.ts`
- NEW: `src/server/admin/adminService.ts`
- NEW: `src/app/api/admin/ping/route.ts`
- NEW: `src/app/admin/page.tsx`
- NEW: `src/lib/errors.ts`
- NEW: `vitest.config.ts`
- NEW: `src/server/auth/requireRole.test.ts`
- NEW: `src/server/admin/adminService.test.ts`
- MODIFIED: `package.json`
- MODIFIED: `package-lock.json`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/1-5-enforce-rbac-with-two-roles-admin-poweruser.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented RBAC helpers + service-layer enforcement; added protected admin API/page; added unit tests; validated test/lint/build; marked ready for review
- 2026-02-28: Code review approved; marked done

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — acceptance criteria are implemented and the RBAC enforcement is verifiable in both service and route layers.

### Summary

Story 1.5 establishes the RBAC enforcement pattern for Prism: a small server-side helper (`requireRole`) based on the `UserRole` enum, a consistent error envelope (`AppError`) used by a protected admin API route, and a service-layer protected admin function (`adminPing`) that UI and API call. Unit tests verify both the helper and the protected service behavior, and the implementation is aligned with the “service layer first” architecture guidance.

### Key Findings

**HIGH**

- None.

**MEDIUM**

- The API error envelope is implemented in-line in `GET /api/admin/ping`; consider centralizing this mapping as more endpoints are added to reduce duplication and drift. (Evidence: `src/app/api/admin/ping/route.ts`)

**LOW**

- The admin page currently displays a safe error message for forbidden access; later, it may be preferable to redirect to a dedicated forbidden page for a more polished UX. (Evidence: `src/app/admin/page.tsx`)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | POWER_USER denied access to admin-only routes/APIs with clear error | IMPLEMENTED | `src/server/auth/requireRole.ts`, `src/app/api/admin/ping/route.ts`, `src/app/admin/page.tsx` |
| 2 | ADMIN can access admin routes/APIs | IMPLEMENTED | `src/server/admin/adminService.ts`, `src/app/api/admin/ping/route.ts` |
| 3 | RBAC enforced in the service layer | IMPLEMENTED | `src/server/admin/adminService.ts` (`adminPing`), `src/server/auth/requireRole.ts` |

**AC Coverage Summary:** 3 of 3 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| --- | --- | --- | --- |
| Define role model in DB/app types | Completed | VERIFIED COMPLETE | `prisma/schema.prisma` (`UserRole`), `src/types/next-auth.d.ts` |
| Implement RBAC helper(s) in server layer | Completed | VERIFIED COMPLETE | `src/server/auth/rbac.ts`, `src/server/auth/requireRole.ts` |
| Apply checks to admin route handlers + UI entrypoints | Completed | VERIFIED COMPLETE | `src/app/api/admin/ping/route.ts`, `src/app/admin/page.tsx` |
| Consistent unauthorized handling | Completed | VERIFIED COMPLETE | `src/lib/errors.ts`, API error response envelope in `src/app/api/admin/ping/route.ts` |
| Unit tests for RBAC helper + protected route/service | Completed | VERIFIED COMPLETE | `src/server/auth/requireRole.test.ts`, `src/server/admin/adminService.test.ts`, `vitest.config.ts`, `package.json` (`test` script) |

### Test Coverage and Gaps

- Unit tests cover role gating behavior at the helper and service level.
- E2E coverage for auth-gated flows remains planned for Story 1.8.

### Security Notes

- Forbidden responses use a generic, user-safe message and do not leak sensitive details.
- RBAC is enforced server-side and cannot be bypassed by client-side routing alone.

