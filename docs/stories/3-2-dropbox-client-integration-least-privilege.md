# Story 3.2: Dropbox client integration (least-privilege)

Status: review

## Story

As a developer,  
I want a Dropbox integration client with clear configuration boundaries,  
so that Prism can read resume files from the repository securely.

## Acceptance Criteria

1. Given Dropbox credentials are configured via env vars, when the system lists a configured Dropbox folder, then it can enumerate resume files and retrieve metadata.
2. Access tokens are never logged.
3. Dropbox failures are handled gracefully and audit-logged when user-triggered.

## Tasks / Subtasks

- [x] Add Dropbox config/env vars and document (AC: 1, 2)
- [x] Implement Dropbox client wrapper under `src/server/dropbox/*` (AC: 1)
- [x] Implement “list folder + metadata” method(s) (AC: 1)
- [x] Ensure token redaction/no-logging (AC: 2)
- [x] Add error handling that produces safe errors and audit logs for user-triggered actions (AC: 3)
- [x] Add tests with stubs/mocks (no network calls) (AC: 1-3)

## Dev Notes

- Keep “change detection” approach flexible (polling/webhooks later).

### Project Structure Notes

- Isolate Dropbox code in `src/server/dropbox/*`. [Source: docs/epics.md#Epic 3]

### References

- [Source: docs/epics.md#Story 3.2: Dropbox client integration (least-privilege)]
- [Source: docs/architecture.md#Implementation Patterns]
- [Source: docs/PRD.md#Resume Repository Integration (Dropbox)]

## Dev Agent Record

### Context Reference

- `docs/stories/3-2-dropbox-client-integration-least-privilege.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-03-01:
- Added Dropbox integration under `src/server/dropbox/*` with env config (`DROPBOX_ACCESS_TOKEN`, `DROPBOX_ROOT_PATH`).
- Added API endpoint `GET /api/dropbox/root` that lists the configured folder and returns normalized metadata.
- Implemented safe error handling (`DROPBOX_ERROR`) and audit logging (`dropbox.list_folder`) without ever logging tokens.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

 - ✅ Lists configured root folder and returns file/folder metadata.
 - ✅ Token is never logged (kept inside client factory; errors are normalized).
 - ✅ Failures are surfaced as safe errors and audited for user-triggered actions.
 - ✅ Tests stub Dropbox SDK; no network calls required.

### File List

 - NEW: `src/server/dropbox/dropboxConfig.ts`
 - NEW: `src/server/dropbox/dropboxClient.ts`
 - NEW: `src/server/dropbox/dropboxTypes.ts`
 - NEW: `src/server/dropbox/dropboxService.ts`
 - NEW: `src/server/dropbox/dropboxService.test.ts`
 - NEW: `src/app/api/dropbox/root/route.ts`
 - MODIFIED: `src/server/audit/eventTypes.ts`
 - MODIFIED: `.env.example`
 - MODIFIED: `package.json`
 - MODIFIED: `package-lock.json`

## Change Log

- 2026-03-01: Draft created
 - 2026-03-01: Implemented Dropbox client integration + root listing API, safe error handling, audit logging, and tests; marked for review

