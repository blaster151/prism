# Story 1.2: Create Cloud Run deployment skeleton (app + worker)

Status: in-progress

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

### Review Follow-ups (AI)

- [ ] [AI-Review][Med] Add a CI step to build `docker/Dockerfile.app` and `docker/Dockerfile.worker` so AC #2 (“images build successfully”) is verifiable. (AC: 2) [file: .github/workflows/ci.yml]
- [ ] [AI-Review][Med] Update Cloud Run deployment docs to show an image-based deploy flow (or explicitly state `--source` uses buildpacks and may not exercise the Dockerfiles). (AC: 3) [file: README.md]
- [ ] [AI-Review][Low] Fix README edit path to `src/app/page.tsx` (not `app/page.tsx`). [file: README.md]

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
- 2026-02-28: Senior Developer Review (AI) notes appended (Changes Requested)

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Changes Requested — acceptance criteria and tasks are largely satisfied, but AC #2 (“Both images build successfully”) is not verifiably proven in CI or in this environment.

### Summary

This story adds a reasonable Cloud Run packaging skeleton: Dockerfiles for an app and a placeholder worker, a worker entrypoint that binds to `$PORT`, and a `.dockerignore` to keep builds clean. Deployment guidance exists in the README, and secret handling is consistent with the `.env.example` + `.gitignore` posture. The remaining gap is **verifiable evidence** that both Docker images build (AC #2) in an automated way.

### Key Findings

**HIGH**

- None.

**MEDIUM**

- AC #2 (“Both images build successfully”) is not currently verifiable in CI and cannot be proven in this dev environment (no container runtime available). Add a CI step that runs `docker build` for both Dockerfiles. (Evidence: `docs/stories/1-2-create-cloud-run-deployment-skeleton-app-worker.md:14-17`, `.github/workflows/ci.yml:1-23`)
- README deploy examples use `gcloud run deploy --source .`, which generally uses buildpacks and may not exercise the Dockerfiles you added. Adjust docs to either (a) show an image-based flow using Cloud Build + `--image`, or (b) explicitly call out the difference. (Evidence: `README.md:33-57`, `docker/Dockerfile.app:1-35`, `docker/Dockerfile.worker:1-11`)

**LOW**

- README suggests editing `app/page.tsx`, but this repo uses `src/app/page.tsx`. (Evidence: `README.md:13-15`)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Dockerfiles exist for `prism-app` and `prism-worker` | IMPLEMENTED | `docker/Dockerfile.app:1-35`, `docker/Dockerfile.worker:1-11` |
| 2 | Both images build successfully | PARTIAL | Dockerfiles exist, but no CI build step and no local container runtime to prove builds. (See Key Findings) |
| 3 | Deployment instructions exist for deploying each as a separate Cloud Run service | IMPLEMENTED (with caveat) | `README.md:17-57` |
| 4 | Env vars sourced from secrets/config and are not committed | IMPLEMENTED | `.env.example:1-17`, `.gitignore:33-36` |
| 5 | Worker is placeholder but runs as distinct service | IMPLEMENTED | `docker/Dockerfile.worker:1-11`, `scripts/worker.mjs:1-23` |

**AC Coverage Summary:** 4 of 5 acceptance criteria fully implemented; AC #2 requires verification.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| --- | --- | --- | --- |
| Add `docker/Dockerfile.app` for the Next.js service (AC: 1, 2) | Completed | VERIFIED COMPLETE | `docker/Dockerfile.app:1-35` |
| Add `docker/Dockerfile.worker` for the worker service (AC: 1, 2, 5) | Completed | VERIFIED COMPLETE | `docker/Dockerfile.worker:1-11`, `scripts/worker.mjs:1-23` |
| Add minimal deploy instructions (README or `docs/`) for two Cloud Run services (AC: 3) | Completed | VERIFIED COMPLETE | `README.md:17-57` |
| Define required env vars in `.env.example` only (AC: 4) | Completed | VERIFIED COMPLETE | `.env.example:1-17` |
| Confirm no secrets are introduced into git history (AC: 4) | Completed | VERIFIED COMPLETE (bounded) | `.gitignore:33-36`, `.env.example:1-17` (cannot prove all history here, but no secrets are present in committed env files) |

**Task Summary:** 5 of 5 completed tasks verified, 0 questionable, 0 false completions.

### Test Coverage and Gaps

- CI verifies Node build/lint, but does not build Docker images yet. (Evidence: `.github/workflows/ci.yml:12-22`)

### Architectural Alignment

- Aligns with the architecture’s expectation of `docker/Dockerfile.app` and `docker/Dockerfile.worker` and a two-service Cloud Run model. (Evidence: `docs/architecture.md:117-121`, `docs/architecture.md:457-463`)

### Security Notes

- `.env*` files are ignored with a safe exception for `.env.example`. (Evidence: `.gitignore:33-36`)
- `.dockerignore` avoids copying `.env*` and excludes `docs/` and `bmad/` from container builds. (Evidence: `.dockerignore:1-13`)

### Best-Practices and References

- `create-next-app` CLI: `https://nextjs.org/docs/app/api-reference/cli/create-next-app`
- GitHub Actions `setup-node` caching: `https://github.com/actions/setup-node`

### Action Items

**Code Changes Required:**

- [ ] [Med] Add a CI step that builds both Dockerfiles (AC #2). [file: .github/workflows/ci.yml]
- [ ] [Med] Adjust README deployment instructions to explicitly cover Dockerfile-based builds/deploys. [file: README.md]

**Advisory Notes:**

- Note: Fix README edit path to `src/app/page.tsx` for accuracy. [file: README.md]
