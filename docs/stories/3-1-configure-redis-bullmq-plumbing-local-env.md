# Story 3.1: Configure Redis + BullMQ plumbing (local + env)

Status: drafted

## Story

As a developer,  
I want the queue infrastructure wired up for local development,  
so that ingestion and indexing work can run asynchronously via a worker.

## Acceptance Criteria

1. The app can enqueue a test job and the worker can receive and complete it.
2. Failures are retried with backoff.
3. Job status is queryable (queued/running/succeeded/failed).

## Tasks / Subtasks

- [ ] Add Redis connection configuration via env (`REDIS_URL`) (AC: 1)
- [ ] Define BullMQ queues and a minimal noop processor (`src/jobs/queues.ts`, `src/jobs/worker.ts`) (AC: 1)
- [ ] Add a minimal route/service to enqueue a test job (AC: 1)
- [ ] Configure retries + backoff for the test job (AC: 2)
- [ ] Add a minimal status endpoint/UI stub to query job status (AC: 3)
- [ ] Add tests for queue wiring using stubs/mocks where needed (AC: 1-3)

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

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-03-01: Draft created

