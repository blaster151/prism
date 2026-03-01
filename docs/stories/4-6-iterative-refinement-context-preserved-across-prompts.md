# Story 4.6: Iterative refinement (context preserved across prompts)

Status: done

## Story

As a PowerUser,
I want to refine searches iteratively without losing context,
So that I can converge on the best shortlist quickly.

## Acceptance Criteria

1. A `SearchSession` Prisma model exists that stores refinement state server-side: query history, aggregated context, and timestamps.
2. A `searchSessionService` at `src/server/search/searchSessionService.ts` provides:
   a. `createSession(userId, query, filters)` — creates a new session with the first query.
   b. `getSession(sessionId)` — retrieves a session by ID.
   c. `appendRefinement(sessionId, query, filters)` — adds a refinement query to the session's history.
   d. `buildCombinedQuery(session)` — returns a combined query string incorporating the full query history.
3. The `POST /api/search` request schema accepts an optional `sessionId` field.
4. When `sessionId` is provided, the route handler:
   a. Loads the existing session.
   b. Appends the new query as a refinement.
   c. Builds a combined query from the full history.
   d. Runs hybridSearch with the combined query.
5. When `sessionId` is omitted, a new session is created and its ID is returned.
6. The response includes `sessionId` and `queryContext` (human-readable description of the accumulated context).
7. A `search.refine` audit event is logged for refinement queries (non-sensitive metadata only).
8. The SearchPage UI tracks the current `sessionId` and passes it on subsequent searches.
9. The UI shows the current query context (accumulated queries) above the search bar.
10. A "New Search" button clears the session and starts fresh.
11. Existing tests continue to pass; new tests are added for `searchSessionService` logic.

## Tasks / Subtasks

- [ ] Task 1: Add SearchSession model to Prisma schema (AC: 1)
  - [ ] 1.1: Add `SearchSession` model with `id`, `userId`, `queryHistory` (Json), `currentContext` (Text?), `createdAt`, `updatedAt`
  - [ ] 1.2: Add relation from User to SearchSession
  - [ ] 1.3: Create migration SQL
- [ ] Task 2: Implement searchSessionService (AC: 2)
  - [ ] 2.1: Create `src/server/search/searchSessionService.ts`
  - [ ] 2.2: `createSession(userId, query, filters)` — insert new SearchSession
  - [ ] 2.3: `getSession(sessionId)` — retrieve by ID
  - [ ] 2.4: `appendRefinement(sessionId, query, filters)` — add to queryHistory array
  - [ ] 2.5: `buildCombinedQuery(session)` — concatenate query history into a combined search string
- [ ] Task 3: Update types and route handler (AC: 3, 4, 5, 6, 7)
  - [ ] 3.1: Update `SearchRequest` and `SearchResponse` types with sessionId/queryContext
  - [ ] 3.2: Add `sessionId` to Zod schema in route handler
  - [ ] 3.3: Integrate session create/append logic in route handler
  - [ ] 3.4: Return sessionId + queryContext in response
  - [ ] 3.5: Add `SearchRefine: "search.refine"` audit event type
- [ ] Task 4: Update SearchPage UI (AC: 8, 9, 10)
  - [ ] 4.1: Track `sessionId` and `queryContext` in state
  - [ ] 4.2: Pass `sessionId` in fetch body on subsequent searches
  - [ ] 4.3: Show queryContext above the search bar
  - [ ] 4.4: Add "New Search" button to clear session
- [ ] Task 5: Write tests (AC: 11)
  - [ ] 5.1: Test searchSessionService — create, append, buildCombinedQuery
  - [ ] 5.2: Test updated route schema with sessionId
  - [ ] 5.3: Test SearchPage session/refinement logic

## Dev Notes

- **SearchSession is server-side only**: No client-only state for refinement context. The server is the source of truth for query history.
- **Combined query strategy**: For the deterministic MVP approach, `buildCombinedQuery` concatenates query history entries (newest-first weighted) so hybridSearch searches against the accumulated intent. No LLM needed for context interpretation yet.
- **queryHistory is JSON**: Stored as `Json` column — array of `{ query, filters, timestamp }` objects.
- **queryContext is human-readable**: Built from query history for display in the UI, e.g. "Senior engineer with TS/SCI → narrowed to satellite experience".
- **Session lifecycle**: Sessions are lightweight and disposable. No cleanup job needed for MVP (~5 users).
- **User relation**: `SearchSession.userId` references `User.id` for ownership. One user can have multiple sessions.

### Learnings from Previous Story

**From Story 4.5 (Status: done)**

- `POST /api/search` calls `hybridSearch` then `explainResults`. The combined query from the session should be passed to `hybridSearch`.
- Response currently returns `{ data: { results, resultCount } }`. Need to add `sessionId` and `queryContext`.
- Two audit log calls already exist (search.query + search.explain). Add search.refine for refinement queries.

[Source: stories/4-5-evidence-linked-explainability-data-record-fields-resume-spans.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-4.md#SearchSession model]
- [Source: docs/tech-spec-epic-4.md#SearchRequest/SearchResponse types]
- [Source: docs/epics.md#Story-4.6 — Acceptance Criteria]
- [Source: src/app/api/search/route.ts — current route handler]
- [Source: src/app/search/SearchPage.tsx — current UI]

---

## Dev Agent Record

### Implementation Summary

All acceptance criteria met. Server-side SearchSession model persists iterative refinement state, the searchSessionService provides create/get/append/buildCombinedQuery APIs, the route handler integrates session management with audit logging, and the UI tracks sessionId + displays query context with a "New Search" reset.

### Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Added SearchSession model + User relation |
| `prisma/migrations/20260301200000_search_session/migration.sql` | **New** | DDL for search_session table with FK + index |
| `src/server/search/searchSessionService.ts` | **New** | Session CRUD + buildCombinedQuery + buildQueryContext |
| `src/server/search/types.ts` | Modified | Added sessionId/queryContext to SearchRequest/SearchResponse |
| `src/server/audit/eventTypes.ts` | Modified | Added SearchRefine: "search.refine" |
| `src/app/api/search/route.ts` | Modified | Session create/append, combined query, response enrichment |
| `src/app/search/SearchPage.tsx` | Modified | sessionId/queryContext state, context banner, New Search button |
| `src/server/search/searchSessionService.test.ts` | **New** | 17 tests: buildCombinedQuery, buildQueryContext, schema validation, UI logic |
| `src/app/api/search/route.test.ts` | Modified | Updated Zod schema with sessionId |
| `src/server/search/hybridSearch.test.ts` | Modified | Updated SearchResponse shape test with new required fields |

### Test Results

- **27 test files, 152 tests — all passing**
- `tsc --noEmit` — zero errors
- New tests cover: combined query logic (4), query context formatting (4), type shape (2), Zod validation (4), UI session tracking (3)

### Technical Decisions

1. **Server-side sessions**: No client-only state — server is source of truth for query history.
2. **Combined query strategy**: Newest-first concatenation (newest query carries highest embedding weight).
3. **Prisma Json field**: Used `Prisma.InputJsonValue` cast for interface→Json type compatibility.
4. **Lightweight sessions**: No cleanup needed for ~5 users — sessions are disposable.
5. **Audit granularity**: `search.refine` separate from `search.query` for analytics.

---

## Code Review Record

### Review Checklist

| # | Check | Pass | Notes |
|---|-------|------|-------|
| 1 | All AC met | ✅ | All 11 acceptance criteria verified |
| 2 | TypeScript strict clean | ✅ | `tsc --noEmit` zero errors |
| 3 | All tests pass | ✅ | 27 files, 152 tests |
| 4 | No security regressions | ✅ | Sessions scoped by userId, no PII in audit logs |
| 5 | Migration is additive | ✅ | New table only, no ALTER on existing tables |
| 6 | No hardcoded secrets | ✅ | Clean |
| 7 | Error handling | ✅ | AppError NOT_FOUND for missing sessions |
| 8 | Existing patterns followed | ✅ | Matches route.ts, service, and test patterns |

### Findings

- **P2 — SearchResponse.sessionId is non-optional**: Currently `string`, which means callers who mock a SearchResponse must provide a session ID. If hybridSearch is ever called outside the route handler, this could be awkward. Acceptable for MVP since the only consumer is the route handler. Could be changed to `string | null` in a future refactor.
- **No issues blocking merge.** All tests pass, types are clean, patterns are consistent.
