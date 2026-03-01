# Story 1.4: Implement NextAuth login (local auth baseline)

Status: done

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
- 2026-02-28: Code review approved; marked done

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — all acceptance criteria are implemented and the completed tasks are verifiably done with evidence.

### Summary

Story 1.4 adds a minimal local-auth baseline using NextAuth credentials provider, gates app routes via middleware redirect to a sign-in page, persists auth state using JWT sessions, and surfaces `user.id` + `user.role` from Postgres into the session token for later RBAC. Basic audit rows are written on sign-in/sign-out using the existing `AuditEvent` model. Lint/build are green.

### Key Findings

**HIGH**

- None.

**MEDIUM**

- NextAuth v4 does not currently declare peer support for Next.js 15, so it was installed using `--legacy-peer-deps`. This is workable short-term but should be revisited to avoid silent incompatibilities as dependencies evolve. (Evidence: `package.json`)

**LOW**

- The bootstrap mechanism `PRISM_ALLOW_USER_CREATE=true` is convenient for initial setup but may be better replaced by a one-time admin/bootstrap command later to reduce accidental account creation in shared environments. (Evidence: `src/server/auth.ts`, `.env.example`)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Unauthenticated users are prompted to sign in | IMPLEMENTED | `src/middleware.ts`, `src/app/auth/signin/page.tsx` |
| 2 | After signing in, users can access the main app pages | IMPLEMENTED | `src/app/api/auth/[...nextauth]/route.ts`, `src/app/page.tsx` |
| 3 | Authentication state persists across refreshes | IMPLEMENTED | `src/server/auth.ts` (`session.strategy = "jwt"`) |
| 4 | Supports role lookup from DB for later RBAC | IMPLEMENTED | `src/server/auth.ts` (JWT callback role lookup), `src/types/next-auth.d.ts` |

**AC Coverage Summary:** 4 of 4 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| --- | --- | --- | --- |
| Configure NextAuth route handler | Completed | VERIFIED COMPLETE | `src/app/api/auth/[...nextauth]/route.ts`, `src/server/auth.ts` |
| Add app-level auth gate | Completed | VERIFIED COMPLETE | `src/middleware.ts`, `src/app/auth/signin/page.tsx` |
| Store/lookup users and attach role to session | Completed | VERIFIED COMPLETE | `src/server/auth.ts`, `prisma/schema.prisma`, `prisma/migrations/20260228200337_add_local_auth_fields/migration.sql` |
| Add basic audit events for sign-in/sign-out | Completed | VERIFIED COMPLETE | `src/server/auth.ts` (events hooks), `prisma/schema.prisma` (`AuditEvent`) |

### Test Coverage and Gaps

- `npm run lint` and `npm run build` pass, providing baseline correctness signals for the new routes/middleware/types.
- Playwright auth-gate E2E is deferred to Story 1.8, as planned in the epic sequencing.

### Security Notes

- No secrets were committed; `.env.example` documents required env vars (`NEXTAUTH_SECRET`, etc.). (Evidence: `.env.example`)
- Disabled accounts are blocked from signing in (`User.status` must be `ACTIVE`). (Evidence: `src/server/auth.ts`)

