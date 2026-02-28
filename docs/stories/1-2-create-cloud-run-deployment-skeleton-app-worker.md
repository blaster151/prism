# Story 1.2: Create Cloud Run deployment skeleton (app + worker)

Status: review

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

- [x] Add `docker/Dockerfile.app` for the Next.js service (AC: 1, 2)
- [x] Add `docker/Dockerfile.worker` for the worker service (AC: 1, 2, 5)
- [x] Add minimal deploy instructions (README or `docs/`) for two Cloud Run services (AC: 3)
- [x] Define required env vars in `.env.example` only (AC: 4)
- [x] Confirm no secrets are introduced into git history (AC: 4)

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

- `docs/stories/1-2-create-cloud-run-deployment-skeleton-app-worker.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-02-28:
- Added Dockerfiles for app and worker, plus `.dockerignore`.
- Added placeholder worker that listens on `$PORT` for Cloud Run compatibility.
- Docker/container build could not be executed locally (no docker/podman/buildah available in this environment), but Dockerfiles follow standard patterns.
- Verified `npm run lint` and `npm run build` pass.

### Completion Notes List

- ✅ Added `docker/Dockerfile.app` and `docker/Dockerfile.worker` for Cloud Run app+worker services.
- ✅ Added `.dockerignore` to keep builds clean and avoid shipping local artifacts.
- ✅ Added deployment skeleton docs in `README.md` (two service model, secrets via env/Secret Manager).
- ✅ Confirmed secrets remain uncommitted; `.env.example` contains placeholders only.

### File List

- NEW: `.dockerignore`
- NEW: `docker/Dockerfile.app`
- NEW: `docker/Dockerfile.worker`
- NEW: `scripts/worker.mjs`
- NEW: `docs/stories/1-2-create-cloud-run-deployment-skeleton-app-worker.context.xml`
- MODIFIED: `.github/workflows/ci.yml`
- MODIFIED: `package.json`
- MODIFIED: `README.md`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/1-2-create-cloud-run-deployment-skeleton-app-worker.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Added Cloud Run app/worker Dockerfiles, placeholder worker, and deploy instructions; marked ready for review
