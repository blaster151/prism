# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story’s `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
| ---- | ----- | ---- | ---- | -------- | ----- | ------ | ----- |
| 2026-02-28 | 1.2 | 1 | Enhancement | Med | TBD | Open | Add CI step to build `docker/Dockerfile.app` and `docker/Dockerfile.worker` to verify AC #2. Files: `.github/workflows/ci.yml`. |
| 2026-02-28 | 1.2 | 1 | Documentation | Med | TBD | Open | Update README to document Dockerfile-based build/deploy flow (or clarify `gcloud run deploy --source` vs Dockerfile usage). Files: `README.md`. |
