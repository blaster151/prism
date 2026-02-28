# Story 1.4: Implement NextAuth login (local auth baseline)

Status: drafted

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

- [ ] Configure NextAuth in the App Router (`src/app/api/auth/[...nextauth]/route.ts`) (AC: 1, 2, 3)
- [ ] Add app-level auth gate/redirect behavior for protected pages (AC: 1, 2)
- [ ] Store/lookup users in Postgres and attach role data to the session (AC: 4)
- [ ] Add basic audit events for sign-in/sign-out (ties into audit story if implemented later) (AC: 2)

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

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
