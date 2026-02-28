# Story 1.2: Create Cloud Run deployment skeleton (app + worker)

Status: drafted

## Story

As a developer,  
I want Dockerfiles and baseline Cloud Run deployment configuration for the app and worker,  
so that we can deploy early and iterate with confidence.

## Acceptance Criteria

1. Dockerfiles exist for `prism-app` and `prism-worker`.
2. Both images build successfully.
3. Deployment instructions exist for deploying each as a separate Cloud Run service.
4. Environment variables are sourced from secrets/config and are not committed.
5. Worker can be a placeholder process (Redis later), but runs as a distinct service.

## Tasks / Subtasks

- [ ] Add `docker/Dockerfile.app` for the Next.js service (AC: 1, 2)
- [ ] Add `docker/Dockerfile.worker` for the worker service (AC: 1, 2, 5)
- [ ] Add minimal deploy instructions (README or `docs/`) for two Cloud Run services (AC: 3)
- [ ] Define required env vars in `.env.example` only (AC: 4)
- [ ] Confirm no secrets are introduced into git history (AC: 4)

## Dev Notes

- The architecture expects a single repo, deployed as two Cloud Run services (`prism-app` and `prism-worker`).
- Keep the worker as a placeholder until Redis/BullMQ wiring exists.

### Project Structure Notes

- Target the `docker/` folder structure shown in `docs/architecture.md` (`docker/Dockerfile.app`, `docker/Dockerfile.worker`).

### References

- [Source: docs/epics.md#Story 1.2: Create Cloud Run deployment skeleton (app + worker)]
- [Source: docs/architecture.md#Project Structure]
- [Source: docs/architecture.md#Deployment Architecture]

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
