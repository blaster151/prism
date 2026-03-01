# Story 3.1: Configure Redis + BullMQ plumbing (local + env)

Status: done

## Story

As a developer,  
I want the queue infrastructure wired up for local development,  
so that ingestion and indexing work can run asynchronously via a worker.

## Acceptance Criteria

1. The app can enqueue a test job and the worker can receive and complete it.
2. Failures are retried with backoff.
3. Job status is queryable (queued/running/succeeded/failed).

## Tasks / Subtasks

- [x] Add Redis connection configuration via env (`REDIS_URL`) (AC: 1)
- [x] Define BullMQ queues and a minimal noop processor (`src/jobs/queues.ts`, `src/jobs/worker.ts`) (AC: 1)
- [x] Add a minimal route/service to enqueue a test job (AC: 1)
- [x] Configure retries + backoff for the test job (AC: 2)
- [x] Add a minimal status endpoint/UI stub to query job status (AC: 3)
- [x] Add tests for queue wiring using stubs/mocks where needed (AC: 1-3)

## Dev Notes

- Keep a minimal “noop” processor for validation.
- Ensure the worker is deployable as a distinct service (Cloud Run worker exists already; real queue wiring comes now).

### Project Structure Notes

- Use `src/jobs/queues.ts` + `src/jobs/worker.ts` as the primary wiring locations. [Source: docs/epics.md#Epic 3]

### References

- [Source: docs/epics.md#Story 3.1: Configure Redis + BullMQ plumbing (local + env)]
- [Source: docs/architecture.md#Decision Summary]
- [Source: docs/architecture.md#Project Structure]

## Dev Agent Record

### Context Reference

- `docs/stories/3-1-configure-redis-bullmq-plumbing-local-env.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-03-01:
- Added BullMQ queue wiring (`src/jobs/queues.ts`) and worker (`src/jobs/worker.ts`).
- Updated worker entrypoint (`scripts/worker.mjs`) to run the noop processor while still serving `/healthz`.
- Added enqueue endpoint (`POST /api/jobs/test/enqueue`) and job status endpoint (`GET /api/jobs/test/status/:id`).
- Configured retries/backoff (attempts=3, exponential backoff) and an optional intentional-failure mode for validating retry behavior.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

 - ✅ App can enqueue a test noop job and worker can complete it (requires running Redis + worker).
 - ✅ Failures retried with backoff (attempts=3, exponential backoff); worker supports intentional failure for validation.
 - ✅ Job status queryable via API endpoint.
 - ✅ Tests do not require Redis network access (stubs/mocks).

### File List

 - NEW: `src/jobs/queues.ts`
 - NEW: `src/jobs/worker.ts`
 - NEW: `src/server/jobs/testNoopQueue.ts`
 - NEW: `src/server/jobs/testNoopQueue.test.ts`
 - NEW: `src/app/api/jobs/test/enqueue/route.ts`
 - NEW: `src/app/api/jobs/test/status/[id]/route.ts`
 - MODIFIED: `scripts/worker.mjs`
 - MODIFIED: `package.json`
 - MODIFIED: `package-lock.json`

## Change Log

- 2026-03-01: Draft created
 - 2026-03-01: Implemented Redis + BullMQ plumbing with noop worker/queue, enqueue + status APIs, retries/backoff, and tests; marked for review
 - 2026-03-01: Code review approved; story complete

## Senior Developer Review (AI)

### Review Outcome

Approve ✅

### What I Reviewed

- Queue wiring and Redis env boundary (`REDIS_URL`)
- Job enqueue/status APIs and state mapping
- Retry/backoff configuration and intentional failure mode
- Worker entrypoint behavior (health endpoint + processing loop)
- Unit test strategy (mocked BullMQ)

### Notes / Follow-ups

- Consider adding a small UI stub in Epic 3.4 (job status visibility) that calls the status endpoint, instead of adding UI here.
- When we start using additional queues, prefer a single shared connection/options helper (already started via `createRedisConnectionOptions`).

