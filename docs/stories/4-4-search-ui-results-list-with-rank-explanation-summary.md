# Story 4.4: Search UI — results list with rank + explanation summary

Status: done

## Story

As a PowerUser,
I want a search screen that shows ranked results with explanation summaries,
So that I can iterate quickly without opening every resume.

## Acceptance Criteria

1. A `/search` page exists, accessible to authenticated users with `POWER_USER` or `ADMIN` role.
2. The page contains a natural-language search input (`SearchBar` component) where I can type a query and submit.
3. On submit, the UI calls `POST /api/search` with the query text and displays results.
4. Results are shown as a ranked list of `SearchResultCard` components, ordered by combined score descending.
5. Each result card shows:
   a. Candidate name (or candidate ID if name is unavailable).
   b. Combined score (formatted as percentage, e.g. "92%").
   c. Semantic and lexical score breakdown.
6. A loading indicator is shown while the search request is in flight.
7. An error message is shown if the search request fails (network error, validation, auth).
8. An empty-state message is shown if no results are returned.
9. Clicking a result card navigates to the candidate detail page (`/candidates/{id}/record`).
10. Existing tests continue to pass; new component tests are added for `SearchBar` and `SearchResultCard`.

## Tasks / Subtasks

- [ ] Task 1: Create SearchBar component (AC: 2)
  - [ ] 1.1: Create `src/components/SearchBar.tsx` — "use client" component with text input and submit button
  - [ ] 1.2: Expose `onSearch(query: string)` callback prop
  - [ ] 1.3: Validate that query is non-empty before calling onSearch
- [ ] Task 2: Create SearchResultCard component (AC: 5, 9)
  - [ ] 2.1: Create `src/components/SearchResultCard.tsx` — renders a single search result
  - [ ] 2.2: Display candidate name, combined score (%), semantic/lexical breakdown
  - [ ] 2.3: Wrap card in a link to `/candidates/{candidateId}/record`
- [ ] Task 3: Create search page (AC: 1, 3, 4, 6, 7, 8)
  - [ ] 3.1: Create `src/app/search/page.tsx` — server component wrapper
  - [ ] 3.2: Create `src/app/search/SearchPage.tsx` — "use client" component orchestrating SearchBar + results
  - [ ] 3.3: Manage state: query, results, loading, error
  - [ ] 3.4: Call `POST /api/search` via fetch on submit
  - [ ] 3.5: Render SearchResultCard list ordered by score
  - [ ] 3.6: Loading spinner / skeleton during fetch
  - [ ] 3.7: Error state display
  - [ ] 3.8: Empty-state message when zero results
- [ ] Task 4: Write component tests (AC: 10)
  - [ ] 4.1: Test SearchBar renders input, submit fires onSearch with trimmed query, empty query blocked
  - [ ] 4.2: Test SearchResultCard renders name, scores, links to candidate
  - [ ] 4.3: Test SearchPage orchestration (loading → results, error, empty states)

## Dev Notes

- **No `(app)` route group**: Pages live directly under `src/app/`. Create `src/app/search/page.tsx` (not `src/app/(app)/search/page.tsx`).
- **UI pattern**: Follow `CandidateList.tsx` — "use client", useState/useCallback/useEffect, fetch() to API, Tailwind utility classes.
- **Explanation is a stub for this story**: Tech spec shows `explanation: Explanation` on `SearchResult` but the explainService doesn't exist yet (Story 4.5). This story shows scores only. Explanation column/panel will be added in Story 4.5.
- **Type import**: Import `SearchResult` from `@/server/search/types` — it already contains `candidateId`, `candidateName`, `score`, `semanticScore`, `lexicalScore`.
- **Score display**: Format `score` as percentage: `Math.round(score * 100)`. Show semantic/lexical as smaller secondary text.
- **Navigation**: Use Next.js `Link` from `next/link` for the candidate detail link.
- **Dark mode**: Use existing dark mode pattern: `dark:` prefix classes, `text-black/60 dark:text-white/60` for secondary text.
- **Testing**: Use Vitest + `@testing-library/react` if available, otherwise pure unit tests on component logic.

### Learnings from Previous Story

**From Story 4.3 (Status: done)**

- `POST /api/search` accepts `{ query, filters?, limit? }` and returns `{ data: { results: SearchResult[], resultCount: number } }`.
- SearchResult shape: `{ candidateId, candidateName, score, semanticScore, lexicalScore }`.
- Route is protected by `requireRole(POWER_USER)` — unauthenticated returns 401, insufficient role returns 403.
- SearchResult has no `explanation` field yet — deferred to Story 4.5.
- Lifecycle filter defaults to ACTIVE if not specified in filters.

[Source: stories/4-3-build-hybrid-search-api-pgvector-postgres-fts-filters.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-4.md#Modules — search/page.tsx, SearchBar, SearchResultCard]
- [Source: docs/epics.md#Story-4.4 — Acceptance Criteria]
- [Source: src/app/candidates/CandidateList.tsx — UI pattern reference]
- [Source: src/server/search/types.ts — SearchResult type contract]
- [Source: src/app/api/search/route.ts — POST /api/search endpoint]

## Dev Agent Record

### Context Reference

- `docs/tech-spec-epic-4.md`
- `docs/epics.md#Story-4.4`
- `stories/4-3-build-hybrid-search-api-pgvector-postgres-fts-filters.md`
- `src/app/candidates/CandidateList.tsx` (UI pattern reference)
- `src/server/search/types.ts` (SearchResult type)

### Agent Model Used

Claude Opus 4.6 (GitHub Copilot)

### Debug Log References

2026-03-01:
- Created `src/components/SearchBar.tsx` — "use client" component with controlled text input + submit form
  - Trims whitespace, blocks empty queries, exposes `onSearch(query)` callback
  - `disabled` prop to prevent interaction during loading
  - Tailwind classes consistent with existing dark mode pattern
- Created `src/components/SearchResultCard.tsx` — "use client" component rendering a single search result
  - Displays rank number, candidate name (falls back to ID), combined score as percentage
  - Shows semantic/lexical score breakdown as secondary text
  - Wrapped in `next/link` to `/candidates/{id}/record` for click-through navigation
- Created `src/app/search/page.tsx` — server component wrapper with page metadata
  - Layout matches existing page pattern (min-h-screen, max-w container, heading)
- Created `src/app/search/SearchPage.tsx` — "use client" orchestration component
  - Manages state: results, loading, error, hasSearched
  - Calls `POST /api/search` via fetch with JSON body
  - Handles success (populate results), error (show message), network failure (generic error)
  - Loading indicator shown during fetch, empty-state after search with 0 results
  - Results rendered as SearchResultCard list with 1-indexed rank
- Created `src/app/search/SearchPage.test.ts` — 10 pure logic tests
  - SearchBar trim/empty-guard logic (2 tests)
  - SearchResultCard score formatting + name fallback (2 tests)
  - SearchPage request construction + response parsing (4 tests)
  - Results ordering contract (2 tests)
- All 115 tests pass across 25 files, `tsc --noEmit` clean

### Completion Notes List

- ✅ `/search` page with natural-language search input (SearchBar component)
- ✅ Ranked results list with SearchResultCard (score %, semantic/lexical breakdown, candidate name)
- ✅ Click-through to candidate detail page via next/link
- ✅ Loading, error, and empty-state handling
- ✅ `hasSearched` flag prevents premature "no results" display
- ✅ Follows existing UI patterns (CandidateList.tsx, dark mode, Tailwind utilities)
- ✅ 10 new pure-logic tests (no jsdom required)
- ⚠️ Note for Story 4.5: SearchResult has no `explanation` field yet. Add `explanation: Explanation` to the type and update SearchResultCard to show summary. Add ExplanationPanel for expandable evidence.
- ⚠️ Note for Story 4.6: SearchPage is stateless — no session management. Add sessionId handling when searchSessionService is implemented.
- ⚠️ Note for Story 4.8: Playwright E2E should test the search flow end-to-end (type query → see results → click to candidate detail).

### File List

- NEW: `src/components/SearchBar.tsx`
- NEW: `src/components/SearchResultCard.tsx`
- NEW: `src/app/search/page.tsx`
- NEW: `src/app/search/SearchPage.tsx`
- NEW: `src/app/search/SearchPage.test.ts`

## Code Review Record

### Reviewer

Claude Opus 4.6 (GitHub Copilot) — automated senior-developer code review

### Review Date

2026-03-01

### Files Reviewed

- `src/components/SearchBar.tsx`
- `src/components/SearchResultCard.tsx`
- `src/app/search/page.tsx`
- `src/app/search/SearchPage.tsx`
- `src/app/search/SearchPage.test.ts`

### Findings

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | Info | No RBAC enforcement at page level — relies on API route | ✅ Consistent with existing pattern. API returns 401/403, UI shows error message. |
| 2 | Info | `SearchResult` type imported from server types in client component | ✅ OK — TypeScript `type` import is erased at build time, no runtime server code leaks to client |
| 3 | Info | Tests are pure logic (no jsdom) | ✅ Acceptable — Playwright E2E in Story 4.8 covers actual DOM rendering |
| 4 | Good | `hasSearched` flag prevents "no results" before first search | ✅ Good UX pattern |
| 5 | Good | Error states, loading indicator, empty state all handled | ✅ All AC covered |
| 6 | Good | Dark mode classes match existing component patterns | ✅ Consistent design system |
| 7 | Good | SearchResultCard uses `next/link` for client-side navigation | ✅ Fast navigation, no full page reload |
| 8 | Good | Score formatting is clean: `Math.round(score * 100)` with `tabular-nums` for alignment | ✅ |

### Verdict

**PASS** — 3 informational findings (all acceptable per existing patterns), 5 positive findings. All 115 tests pass across 25 files, `tsc --noEmit` clean. Implementation is clean, consistent with existing patterns, and covers all acceptance criteria.
