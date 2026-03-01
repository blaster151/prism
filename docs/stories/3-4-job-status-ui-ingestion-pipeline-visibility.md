# Story 3.4: Job status UI (ingestion pipeline visibility)

Status: done

## Story

As a PowerUser,  
I want to see ingestion job status and errors,  
so that I can trust the system and recover from failures without guesswork.

## Acceptance Criteria

1. Given ingestion jobs exist, when I open the ingestion/status screen, then I can see job states (queued/running/succeeded/failed) and basic error info.
2. I can retry failed jobs (authorized users only).
3. Retries are audit-logged.

## Tasks / Subtasks

- [x] Add API endpoints to query job status by id/list recent jobs (AC: 1)
- [x] Add minimal UI screen to display job states and safe error info (AC: 1)
- [x] Add retry endpoint/action (service-layer mutation) with RBAC enforcement (AC: 2)
- [x] Audit-log retries (AC: 3)
- [x] Add tests using mocks/stubs (AC: 1-3)

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

2026-03-01:
- Added ingestion job status APIs:
  - `GET /api/ingestion/jobs` (list recent)
  - `GET /api/ingestion/jobs/:id` (single job)
  - `POST /api/ingestion/jobs/:id/retry` (retry failed job)
- Added minimal UI screen at `/ingestion` with polling, safe error display, and retry action.
- Added audit event type `ingestion.retry` and audit-logged retries in service layer.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

 - ✅ Job states are visible (queued/running/succeeded/failed) with basic error info.
 - ✅ Failed jobs can be retried by authorized users (PowerUser+).
 - ✅ Retries are audit-logged.
 - ✅ Tests are mocked/stubbed (no Redis required).

### File List

 - NEW: `src/server/ingestion/ingestionJobsService.ts`
 - NEW: `src/server/ingestion/ingestionJobsService.test.ts`
 - NEW: `src/server/ingestion/ingestionQueue.ts`
 - NEW: `src/app/api/ingestion/jobs/route.ts`
 - NEW: `src/app/api/ingestion/jobs/[id]/route.ts`
 - NEW: `src/app/api/ingestion/jobs/[id]/retry/route.ts`
 - NEW: `src/app/ingestion/page.tsx`
 - NEW: `src/app/ingestion/status-client.tsx`
 - MODIFIED: `src/server/audit/eventTypes.ts`
 - MODIFIED: `src/server/ingestion/ingestionService.ts`

## Change Log

- 2026-03-01: Draft created
 - 2026-03-01: Implemented ingestion job status APIs + `/ingestion` UI with retry + audit logging; marked for review
 - 2026-03-01: Code review approved; story complete

## Senior Developer Review (AI)

### Review Outcome

Approve ✅

### Notes / Follow-ups

- UI is intentionally minimal; further UX polish (filters, details panels) can land in later Epic 3 stories.
- Retry is RBAC-gated and audit-logged (`ingestion.retry`), meeting AC2/AC3.

