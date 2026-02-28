# Story 1.8: Testing foundation (unit + Playwright E2E)

Status: review

## Story

As a developer,  
I want a test framework in place for unit/integration tests and Playwright E2E tests,  
so that each subsequent story can ship with automated coverage and we can run an end-to-end regression suite each sprint.

## Acceptance Criteria

1. There is a standard way to run unit/integration tests locally and in CI.
2. There is a standard way to run Playwright E2E tests locally (headless) and in CI.
3. The first minimal Playwright E2E test validates the auth gate (unauthenticated users are prompted to sign in).
4. Test runs are non-interactive (no “press q to quit” prompts).

## Tasks / Subtasks

- [x] Select and configure a lightweight unit/integration test runner for the Next.js codebase (AC: 1)
- [x] Add baseline unit test example + CI command (AC: 1, 4)
- [x] Install/configure Playwright and add a headless CI run command (AC: 2, 4)
- [x] Implement a minimal E2E test covering the auth gate flow (AC: 3)
- [x] Document the exact commands in the repo (README or `docs/`) (AC: 1, 2)

## Dev Notes

- Future stories should add/extend tests rather than relying on manual verification.
- The architecture explicitly calls for E2E coverage of key user flows (auth gate is the first).

### Project Structure Notes

- Keep test tooling consistent and CI-friendly; avoid interactive/watch defaults in CI runs.

### References

- [Source: docs/epics.md#Story 1.8: Testing foundation (unit + Playwright E2E)]
- [Source: docs/PRD.md#Web App Specific Requirements]
- [Source: docs/architecture.md#Development Environment]

## Dev Agent Record

### Context Reference

- `docs/stories/1-8-testing-foundation-unit-playwright-e2e.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-02-28:
- Added Playwright configuration and first E2E test validating auth-gate redirect.
- Wired CI to run unit tests, lint/build, and headless Playwright.
- Verified runs are non-interactive (`vitest run`, `playwright test --reporter=line`).

### Completion Notes List

- ✅ Unit tests: `npm test` (Vitest, non-interactive).
- ✅ E2E tests: `npm run test:e2e` (Playwright, headless, non-interactive).
- ✅ First E2E asserts unauthenticated navigation to `/` redirects to `/auth/signin`.
- ✅ CI runs unit + lint/build + E2E.

### File List

- NEW: `playwright.config.ts`
- NEW: `e2e/auth-gate.spec.ts`
- MODIFIED: `package.json`
- MODIFIED: `package-lock.json`
- MODIFIED: `.github/workflows/ci.yml`
- MODIFIED: `README.md`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/1-8-testing-foundation-unit-playwright-e2e.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Added unit test command + Playwright E2E baseline; added auth-gate E2E; wired CI; documented commands; validated test/lint/build; marked ready for review
