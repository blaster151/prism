# Story 3.2: Dropbox client integration (least-privilege)

Status: ready-for-dev

## Story

As a developer,  
I want a Dropbox integration client with clear configuration boundaries,  
so that Prism can read resume files from the repository securely.

## Acceptance Criteria

1. Given Dropbox credentials are configured via env vars, when the system lists a configured Dropbox folder, then it can enumerate resume files and retrieve metadata.
2. Access tokens are never logged.
3. Dropbox failures are handled gracefully and audit-logged when user-triggered.

## Tasks / Subtasks

- [ ] Add Dropbox config/env vars and document (AC: 1, 2)
- [ ] Implement Dropbox client wrapper under `src/server/dropbox/*` (AC: 1)
- [ ] Implement “list folder + metadata” method(s) (AC: 1)
- [ ] Ensure token redaction/no-logging (AC: 2)
- [ ] Add error handling that produces safe errors and audit logs for user-triggered actions (AC: 3)
- [ ] Add tests with stubs/mocks (no network calls) (AC: 1-3)

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

### Completion Notes List

### File List

## Change Log

- 2026-03-01: Draft created

