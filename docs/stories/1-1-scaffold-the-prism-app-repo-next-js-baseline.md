# Story 1.1: Scaffold the Prism app repo (Next.js baseline)

Status: ready-for-dev

## Story

As a developer,  
I want a Next.js TypeScript application scaffolded with the agreed defaults,  
so that all subsequent stories build on a consistent foundation.

## Acceptance Criteria

1. The app is scaffolded using `create-next-app` with TypeScript, ESLint, Tailwind, App Router, and `src/`.
2. The app runs locally and renders a basic home page.
3. The repository includes `.env.example` and `docs/` committed.
4. Baseline folder structure aligns with architecture: `src/app`, `src/components`, `src/server`, `src/jobs` exist.

## Tasks / Subtasks

- [ ] Scaffold Next.js app using the documented initialization command (AC: 1, 2)
- [ ] Add `.env.example` with placeholders for future services (DB/Redis/Auth) (AC: 3)
- [ ] Ensure `docs/` is present and committed (AC: 3)
- [ ] Create baseline directories (`src/components`, `src/server`, `src/jobs`) if not generated (AC: 4)
- [ ] Add a minimal CI smoke check (install + build) (AC: 2)

## Dev Notes

- Use the exact scaffold command captured in `docs/architecture.md`.
- Keep this story intentionally minimal: scaffold only, no auth/db yet.

### Project Structure Notes

- Align the repository skeleton to the structure in `docs/architecture.md` (especially `src/app`, `src/components`, `src/server`, `src/jobs`).

### References

- [Source: docs/epics.md#Story 1.1: Scaffold the Prism app repo (Next.js baseline)]
- [Source: docs/architecture.md#Project Initialization]
- [Source: docs/architecture.md#Project Structure]

## Dev Agent Record

### Context Reference

- `docs/stories/1-1-scaffold-the-prism-app-repo-next-js-baseline.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
