# Story 4.8: Playwright E2E — search returns ranked results with explanations

Status: done

## Story

As a developer,
I want an end-to-end test for the search experience,
So that the core "wow" loop is regression-tested.

## Acceptance Criteria

1. A Playwright E2E spec exists at `e2e/search-ranked-results.spec.ts`.
2. The test authenticates as a signed-in POWER_USER using the NextAuth session-cookie pattern (same as `ingest-trigger-status.spec.ts`).
3. The test navigates to the Search page (`/search`) and verifies the page heading and search bar are visible.
4. The test types a natural-language query, submits it, and verifies ranked results appear with scores and explanation summaries.
5. The test expands a result card and verifies evidence-linked explanation details are visible (Record/Resume badges, field names, snippets).
6. The test performs a refinement search and verifies the query context banner appears showing the accumulated context.
7. The test clicks "New Search" and verifies the session is cleared (context banner hidden, results cleared).
8. All API calls are mocked via `page.route()` with realistic fixture data — no real DB or embedding provider needed.
9. The spec runs headless in CI (no flaky external dependencies).
10. `tsc --noEmit` produces zero errors; `npx vitest run` — all existing tests still pass (no regressions).

## Tasks / Subtasks

- [ ] Task 1: Create E2E spec with auth setup (AC: 1, 2, 3)
  - [ ] 1.1: Create `e2e/search-ranked-results.spec.ts`
  - [ ] 1.2: Set up NextAuth session cookie injection (POWER_USER)
  - [ ] 1.3: Navigate to `/search`, assert heading + search bar visible
- [ ] Task 2: Search flow — submit query and verify results (AC: 4, 8)
  - [ ] 2.1: Mock `POST /api/search` with fixture data (ranked results + explanations)
  - [ ] 2.2: Type query in search bar, click Search
  - [ ] 2.3: Assert result count, candidate names, scores, explanation summaries visible
- [ ] Task 3: Expand result — evidence details (AC: 5)
  - [ ] 3.1: Click "Show evidence" on first result card
  - [ ] 3.2: Assert Evidence heading, Record/Resume badges, field names, snippets visible
- [ ] Task 4: Refinement flow — session context (AC: 6, 7, 8)
  - [ ] 4.1: Mock second search with sessionId in request body, updated results + queryContext
  - [ ] 4.2: Type refinement query, submit
  - [ ] 4.3: Assert query context banner visible with arrow-separated context
  - [ ] 4.4: Click "New Search", assert context banner hidden and results cleared
- [ ] Task 5: Verify no regressions (AC: 9, 10)
  - [ ] 5.1: `tsc --noEmit` — zero errors
  - [ ] 5.2: `npx vitest run` — all tests pass
  - [ ] 5.3: `npx playwright test` — spec passes headless

## Dev Notes

- **Mock pattern**: Follow `ingest-trigger-status.spec.ts` — use `page.route("**/api/search", ...)` to intercept POST requests and return fixture JSON. Track request bodies to verify sessionId is sent on refinement.
- **Auth pattern**: Use `next-auth/jwt` `encode()` to create a session cookie and inject via `context.addCookies()`.
- **Fixture data**: Return 3 candidates with realistic scores, explanation summaries, and evidence items. Include both "record" and "resume" source types.
- **UI selectors**: Use `getByRole`, `getByText`, `getByPlaceholder` for resilient selectors. Avoid brittle CSS class selectors.
- **Refinement verification**: Track the request body of the second search call to verify `sessionId` is included.

### Learnings from Previous Story

**From Story 4.7 (Status: done)**

- All 209 unit/integration tests pass. The search pipeline (hybridSearch → explainService → searchSessionService) is thoroughly unit-tested.
- Fixture data patterns from groundingInvariants.test.ts can be reused for E2E mock responses.

[Source: stories/4-7-unit-integration-tests-for-hybrid-search-explainability-grounding.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-4.md#E2E tests (playwright)]
- [Source: docs/epics.md#Story-4.8 — Acceptance Criteria]
- [Source: e2e/ingest-trigger-status.spec.ts — existing E2E pattern]
- [Source: playwright.config.ts — Playwright configuration]
- [Source: src/app/search/SearchPage.tsx — search UI]
- [Source: src/components/SearchResultCard.tsx — result card with expand]
- [Source: src/components/ExplanationPanel.tsx — evidence display]

---

## Dev Agent Record

### Implementation Summary

All 10 acceptance criteria met. Created a comprehensive Playwright E2E spec covering the full search experience: page navigation, query submission with ranked results, evidence expansion/collapse, iterative refinement with query context banner, session clearing via "New Search", and error handling. All API calls are mocked via `page.route()` with realistic fixture data.

### Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `e2e/search-ranked-results.spec.ts` | **New** | 6 Playwright E2E tests covering full search → explain → refine → clear flow |

### Test Results

- **29 vitest files, 209 unit/integration tests — all passing** (zero regressions)
- **6 Playwright E2E tests — all passing** headless in Chromium
- `tsc --noEmit` — zero errors

### E2E Test Coverage

| # | Test | Verifies |
|---|------|----------|
| 1 | Page accessible | Heading, search bar, submit button visible |
| 2 | Submit query | Ranked results with scores, names, summaries, rank indicators |
| 3 | Expand evidence | Record/Resume badges, field names, snippets; collapse works |
| 4 | Refinement | sessionId sent on 2nd call, query context banner with arrow notation |
| 5 | New Search | Clears context banner, results, session state |
| 6 | Error handling | Displays server error message gracefully |

### Technical Decisions

1. **Form-scoped button selectors**: Used `page.locator("form").getByRole("button", { name: "Search" })` to avoid ambiguity with the page heading.
2. **Exact text matching**: Used `{ exact: true }` and `.first()` for score percentages that also appear in explanation summaries.
3. **Request body assertions**: Verified `sessionId` is undefined on first call and populated on refinement call.
4. **Fixture realism**: Mock data mirrors actual `SearchResponse` shape with multi-source evidence (record + resume).

---

## Code Review Record

### Review Checklist

| # | Check | Pass | Notes |
|---|-------|------|-------|
| 1 | All AC met | ✅ | All 10 criteria verified |
| 2 | TypeScript strict clean | ✅ | `tsc --noEmit` zero errors |
| 3 | Unit tests pass | ✅ | 29 files, 209 tests |
| 4 | E2E tests pass | ✅ | 6/6 Playwright headless |
| 5 | Auth pattern correct | ✅ | Matches ingest-trigger-status.spec.ts |
| 6 | No external dependencies | ✅ | All API calls mocked |
| 7 | Selectors resilient | ✅ | Uses semantic selectors, no brittle CSS |

### Findings

- No issues found. Spec is comprehensive and stable.
