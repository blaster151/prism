# Story 3.3: Resume ingestion trigger API (enqueue ingest job)

Status: drafted

## Story

As a PowerUser,  
I want to trigger ingestion for a Dropbox path (or the default folder),  
so that new/updated resumes can be processed into Data Records.

## Acceptance Criteria

1. Given I am authenticated, when I call the ingestion trigger endpoint, then an ingestion job is enqueued and I receive a job id.
2. The trigger action is audit-logged.

## Tasks / Subtasks

- [ ] Implement ingestion trigger route handler (AC: 1)
- [ ] Add service-layer method that validates request, enqueues job, and returns job id (AC: 1)
- [ ] Enforce RBAC + audit log in the service layer (AC: 2)
- [ ] Add tests (mocks/stubs only; no external calls) (AC: 1-2)

## Dev Notes

- Route handler calls service layer which enqueues job + writes audit event.

### Project Structure Notes

- Implement as Route Handler under `src/app/api/ingestion/trigger` (or similar) and enqueue via BullMQ. [Source: docs/epics.md#Epic 3]

### References

- [Source: docs/epics.md#Story 3.3: Resume ingestion trigger API (enqueue ingest job)]
- [Source: docs/architecture.md#API Contracts]
- [Source: docs/architecture.md#Implementation Patterns]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-03-01: Draft created

