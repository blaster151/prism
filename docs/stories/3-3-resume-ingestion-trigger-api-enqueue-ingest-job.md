# Story 3.3: Resume ingestion trigger API (enqueue ingest job)

Status: done

## Story

As a PowerUser,  
I want to trigger ingestion for a Dropbox path (or the default folder),  
so that new/updated resumes can be processed into Data Records.

## Acceptance Criteria

1. Given I am authenticated, when I call the ingestion trigger endpoint, then an ingestion job is enqueued and I receive a job id.
2. The trigger action is audit-logged.

## Tasks / Subtasks

- [x] Implement ingestion trigger route handler (AC: 1)
- [x] Add service-layer method that validates request, enqueues job, and returns job id (AC: 1)
- [x] Enforce RBAC + audit log in the service layer (AC: 2)
- [x] Add tests (mocks/stubs only; no external calls) (AC: 1-2)

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

- `docs/stories/3-3-resume-ingestion-trigger-api-enqueue-ingest-job.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-03-01:
- Added ingestion trigger endpoint `POST /api/ingestion/trigger` that enqueues a BullMQ job and returns the job id.
- Implemented service layer `enqueueDropboxIngest` with RBAC (PowerUser) + audit logging (`ingestion.trigger`).
- Wired ingestion queue name (`ingest-dropbox`) and added placeholder worker processor.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

 - ✅ Authenticated PowerUser can enqueue ingestion and receive a job id.
 - ✅ Trigger action is audit-logged.
 - ✅ Tests are mocked/stubbed (no Redis/Dropbox network calls required).

### File List

 - NEW: `src/app/api/ingestion/trigger/route.ts`
 - NEW: `src/server/ingestion/ingestionService.ts`
 - NEW: `src/server/ingestion/ingestionService.test.ts`
 - MODIFIED: `src/jobs/queues.ts`
 - MODIFIED: `src/jobs/worker.ts`
 - MODIFIED: `src/server/audit/eventTypes.ts`

## Change Log

- 2026-03-01: Draft created
 - 2026-03-01: Implemented ingestion trigger API + enqueue service, audit logging, and tests; marked for review
 - 2026-03-01: Code review approved; story complete

## Senior Developer Review (AI)

### Review Outcome

Approve ✅

### Notes

- **AC1** satisfied via `POST /api/ingestion/trigger` returning a BullMQ job id for authenticated PowerUsers.
- **AC2** satisfied via audit event `ingestion.trigger` written in the service layer.

