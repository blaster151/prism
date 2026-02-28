# Story 1.1: Scaffold the Prism app repo (Next.js baseline)

Status: done

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
- ✅ Senior developer review completed; approved (see appended review notes).

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
- 2026-02-28: Senior Developer Review (AI) notes appended

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — all acceptance criteria are implemented and every completed task is verifiably done with evidence.

### Summary

Story 1.1 successfully bootstraps the repo into a standard Next.js App Router project with TypeScript, ESLint, and Tailwind, adds `.env.example`, ensures baseline `src/*` directories exist, and introduces a CI smoke workflow that runs `npm ci`, `npm run lint`, and `npm run build`. Lint/build were executed successfully during implementation (per Dev Agent Record), and the repo now matches the expected early architecture skeleton.

### Key Findings

**HIGH**

- None.

**MEDIUM**

- None.

**LOW**

- CI Node version is set to 22 even though `docs/architecture.md` lists Node.js LTS 24.14.0; consider aligning later to reduce drift. (Evidence: `docs/architecture.md:79-83`, `docs/architecture.md:471-476`, `.github/workflows/ci.yml:12-22`)
- `package.json` name is still the scaffold default (`prism_scaffold`); consider renaming to `prism` for clarity (no functional impact). (Evidence: `package.json:2-4`)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Scaffolded using create-next-app with TypeScript, ESLint, Tailwind, App Router, `src/` | IMPLEMENTED | `README.md:1-2`, `package.json:6-15`, `tsconfig.json:1-27` |
| 2 | App runs locally and renders a basic home page | IMPLEMENTED | `package.json:6-10`, `src/app/page.tsx:3-104` |
| 3 | Repo includes `.env.example` and `docs/` committed | IMPLEMENTED | `.env.example:1-17`, `.gitignore:33-36`, `docs/PRD.md:1-6` |
| 4 | Baseline structure includes `src/app`, `src/components`, `src/server`, `src/jobs` | IMPLEMENTED | `src/app/page.tsx:1-104`, `src/components/.gitkeep:1-2`, `src/server/.gitkeep:1-2`, `src/jobs/.gitkeep:1-2` |

**AC Coverage Summary:** 4 of 4 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| --- | --- | --- | --- |
| Scaffold Next.js app using documented initialization command (AC: 1, 2) | Completed | VERIFIED COMPLETE | `docs/architecture.md:18-27`, `package.json:6-15`, `src/app/layout.tsx:1-35`, `src/app/page.tsx:3-104` |
| Add `.env.example` placeholders (AC: 3) | Completed | VERIFIED COMPLETE | `.env.example:1-17`, `.gitignore:33-36` |
| Ensure `docs/` is present and committed (AC: 3) | Completed | VERIFIED COMPLETE | `docs/PRD.md:1-6`, `docs/architecture.md:1-20` |
| Create baseline dirs `src/components`, `src/server`, `src/jobs` (AC: 4) | Completed | VERIFIED COMPLETE | `src/components/.gitkeep:1-2`, `src/server/.gitkeep:1-2`, `src/jobs/.gitkeep:1-2` |
| Add minimal CI smoke check (AC: 2) | Completed | VERIFIED COMPLETE | `.github/workflows/ci.yml:1-22`, `package.json:5-10` |

**Task Summary:** 5 of 5 completed tasks verified, 0 questionable, 0 false completions.

### Test Coverage and Gaps

- This story establishes a **CI smoke signal** (lint + build) rather than unit/integration tests, which is appropriate for a pure scaffold story.
- CI commands are non-interactive (`npm ci`, `npm run lint -- --max-warnings=0`, `npm run build`). (Evidence: `.github/workflows/ci.yml:17-22`)

### Architectural Alignment

- Aligns with the architecture’s starter recommendation to use `create-next-app` and App Router + `src/`. (Evidence: `docs/architecture.md:12-36`)
- The repo now contains `package.json`, `package-lock.json`, `next.config.ts`, `postcss.config.mjs`, `.env.example`, and `src/` as described in the target structure. (Evidence: `docs/architecture.md:101-116`, `package.json:1-27`, `next.config.ts:1-7`, `postcss.config.mjs:1-5`)

### Security Notes

- `.env*` files are ignored by default, with a safe exception for `.env.example`. (Evidence: `.gitignore:33-36`)
- No secrets are present in `.env.example` (placeholders only). (Evidence: `.env.example:1-17`)

### Best-Practices and References

- Next.js CLI (`create-next-app`) reference: `https://nextjs.org/docs/app/api-reference/cli/create-next-app`
- Next.js 15 ESLint reference: `https://nextjs.org/docs/15/app/api-reference/config/eslint`
- GitHub Actions Node setup / caching (`actions/setup-node`): `https://github.com/actions/setup-node`

### Action Items

**Code Changes Required:**

- None.

**Advisory Notes:**

- Note: Consider aligning CI Node version to the architecture’s selected Node LTS line when you lock the runtime version for real deployments. (See Key Findings.)
