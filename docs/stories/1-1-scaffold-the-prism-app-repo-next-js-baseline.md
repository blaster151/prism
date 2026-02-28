# Story 1.1: Scaffold the Prism app repo (Next.js baseline)

Status: review

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

- [x] Scaffold Next.js app using the documented initialization command (AC: 1, 2)
- [x] Add `.env.example` with placeholders for future services (DB/Redis/Auth) (AC: 3)
- [x] Ensure `docs/` is present and committed (AC: 3)
- [x] Create baseline directories (`src/components`, `src/server`, `src/jobs`) if not generated (AC: 4)
- [x] Add a minimal CI smoke check (install + build) (AC: 2)

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

2026-02-28:
- Plan: scaffold Next.js (TypeScript, ESLint, Tailwind, App Router, src/) using create-next-app, add `.env.example`, ensure baseline `src/*` directories exist, add minimal CI smoke check, then run `npm run build`/`npm run lint`.
- Note: create-next-app refused to scaffold into a non-empty repo; generated into a temporary directory and copied into repo root.
- Lint initially failed because ESLint scanned `bmad/`; fixed by adding ignore patterns for BMAD/docs/Cursor config.

### Completion Notes List

- ✅ Scaffolded Next.js 15.5.12 app (TypeScript, ESLint, Tailwind, App Router, `src/`) and verified `npm run build` succeeds.
- ✅ Added `.env.example` for future DB/Redis/Auth/Dropbox config (no secrets committed).
- ✅ Added baseline `src/components`, `src/server`, `src/jobs` directories (tracked via `.gitkeep`).
- ✅ Added minimal GitHub Actions CI workflow to run `npm ci`, `npm run lint`, and `npm run build`.

### File List

- NEW: `.env.example`
- NEW: `.github/workflows/ci.yml`
- NEW: `eslint.config.mjs`
- NEW: `next-env.d.ts`
- NEW: `next.config.ts`
- NEW: `package.json`
- NEW: `package-lock.json`
- NEW: `postcss.config.mjs`
- NEW: `public/*`
- NEW: `src/app/*`
- NEW: `src/components/.gitkeep`
- NEW: `src/server/.gitkeep`
- NEW: `src/jobs/.gitkeep`
- NEW: `tsconfig.json`
- MODIFIED: `.gitignore`
- MODIFIED: `README.md`
- MODIFIED: `docs/sprint-status.yaml`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented scaffold, env example, baseline dirs, and CI smoke check; validated lint/build; marked ready for review
