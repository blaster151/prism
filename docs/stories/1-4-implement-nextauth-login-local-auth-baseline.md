# Story 1.4: Implement NextAuth login (local auth baseline)

Status: review

## Story

As a user,  
I want to authenticate into Prism,  
so that access to resumes and candidate data is gated behind a login.

## Acceptance Criteria

1. Unauthenticated users are prompted to sign in when navigating to the app.
2. After signing in, users can access the main app pages.
3. Authentication state persists across refreshes.
4. The implementation supports role lookup from the database (for later RBAC).

## Tasks / Subtasks

- [x] Configure NextAuth in the App Router (`src/app/api/auth/[...nextauth]/route.ts`) (AC: 1, 2, 3)
- [x] Add app-level auth gate/redirect behavior for protected pages (AC: 1, 2)
- [x] Store/lookup users in Postgres and attach role data to the session (AC: 4)
- [x] Add basic audit events for sign-in/sign-out (ties into audit story if implemented later) (AC: 2)

## Dev Notes

- Use NextAuth v4 per the architecture decision record.
- Keep provider choice simple for internal use, but keep the boundary clean for future SSO evolution.

### Project Structure Notes

- Route handler location is documented in `docs/architecture.md` under `src/app/api/auth/[...nextauth]/route.ts`.

### References

- [Source: docs/epics.md#Story 1.4: Implement NextAuth login (local auth baseline)]
- [Source: docs/architecture.md#ADR-004: Authentication (initial)]
- [Source: docs/architecture.md#Project Structure]
- [Source: docs/PRD.md#Functional Requirements]

## Dev Agent Record

### Context Reference

- `docs/stories/1-4-implement-nextauth-login-local-auth-baseline.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-02-28:
- Added NextAuth credentials-based login with DB-backed role lookup and auth gate middleware.
- Resolved build failure for `useSearchParams()` by splitting sign-in page into server wrapper + client component wrapped in `Suspense`.
- Note: NextAuth v4 peer-deps do not include Next.js 15; installed with `--legacy-peer-deps` to keep architecture alignment.

### Completion Notes List

- ✅ Unauthenticated users are redirected to `/auth/signin` via `src/middleware.ts`.
- ✅ Credentials sign-in is implemented and session includes `user.id` and `user.role` (DB lookup) for future RBAC.
- ✅ Auth state persists across refreshes (JWT session strategy).
- ✅ Basic audit rows are written on sign-in/sign-out using the existing `AuditEvent` model.
- ✅ `npm run lint` and `npm run build` pass.

### File List

- NEW: `src/server/auth.ts`
- NEW: `src/app/api/auth/[...nextauth]/route.ts`
- NEW: `src/middleware.ts`
- NEW: `src/app/auth/signin/page.tsx`
- NEW: `src/app/auth/signin/signin-client.tsx`
- NEW: `src/types/next-auth.d.ts`
- NEW: `src/components/SignOutButton.tsx`
- NEW: `prisma/migrations/20260228200337_add_local_auth_fields/migration.sql`
- MODIFIED: `prisma/schema.prisma`
- MODIFIED: `src/app/page.tsx`
- MODIFIED: `.env.example`
- MODIFIED: `package.json`
- MODIFIED: `package-lock.json`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/1-4-implement-nextauth-login-local-auth-baseline.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented auth gate + local credentials sign-in via NextAuth; attached DB role to session; added basic auth audit events; validated lint/build; marked ready for review
