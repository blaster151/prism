# Story 3.4: Job status UI (ingestion pipeline visibility)

Status: ready-for-dev

## Story

As a PowerUser,  
I want to see ingestion job status and errors,  
so that I can trust the system and recover from failures without guesswork.

## Acceptance Criteria

1. Given ingestion jobs exist, when I open the ingestion/status screen, then I can see job states (queued/running/succeeded/failed) and basic error info.
2. I can retry failed jobs (authorized users only).
3. Retries are audit-logged.

## Tasks / Subtasks

- [ ] Add API endpoints to query job status by id/list recent jobs (AC: 1)
- [ ] Add minimal UI screen to display job states and safe error info (AC: 1)
- [ ] Add retry endpoint/action (service-layer mutation) with RBAC enforcement (AC: 2)
- [ ] Audit-log retries (AC: 3)
- [ ] Add tests using mocks/stubs (AC: 1-3)

## Dev Notes

- Keep error details non-sensitive; link to AuditEvent ids when applicable.

### References

- [Source: docs/epics.md#Story 3.4: Job status UI (ingestion pipeline visibility)]
- [Source: docs/architecture.md#Logging Strategy]
- [Source: docs/architecture.md#Error Handling]

## Dev Agent Record

### Context Reference

- `docs/stories/3-4-job-status-ui-ingestion-pipeline-visibility.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-03-01: Draft created

