# Story 4.7: Unit/integration tests for hybrid search + explainability grounding

Status: done

## Story

As a developer,
I want automated tests for search and explainability grounding,
So that regressions don't silently degrade trust or coverage.

## Acceptance Criteria

1. A fixture-based test suite verifies that hybridSearch returns deterministic ordering when given known candidate data.
2. Tests verify Active/Archive lifecycle filtering: ACTIVE-only default, explicit ARCHIVE filter, mixed lifecycle handling.
3. Explainability grounding invariant tests ensure every `EvidenceItem` references only fields/spans that actually exist in the candidate's DataRecord or resume OCR text — never hallucinated evidence.
4. Integration-level tests verify the full search → explain pipeline: query terms → score combination → evidence generation → grounding validation.
5. Edge-case tests cover: empty results, candidates missing embeddings (FTS-only fallback), candidates missing DataRecords, missing resume OCR text, empty query terms, max evidence cap.
6. Embedding provider interface contract tests verify: noop determinism, vector dimensions, value range, provider selection by env var, OpenAI error handling (already exist — verify no regressions).
7. Search session service tests verify: create → append → buildCombinedQuery → buildQueryContext pipeline (already exist — verify no regressions).
8. All tests run without external provider calls (noop stubs for embeddings, no real DB needed for logic tests).
9. `tsc --noEmit` produces zero errors; `npx vitest run` — all tests pass.

## Tasks / Subtasks

- [ ] Task 1: Hybrid search fixture-based ordering tests (AC: 1, 2, 5)
  - [ ] 1.1: Create fixture candidates with known semantic/lexical scores
  - [ ] 1.2: Test deterministic score ranking (highest combined score first)
  - [ ] 1.3: Test Active-only default filter excludes ARCHIVE candidates
  - [ ] 1.4: Test explicit ARCHIVE filter returns only ARCHIVE candidates
  - [ ] 1.5: Test edge cases: empty results, limit clamping, score boundary conditions
- [ ] Task 2: Explainability grounding invariant tests (AC: 3, 5)
  - [ ] 2.1: Test no evidence for non-existent fields (grounding invariant)
  - [ ] 2.2: Test evidence field names are subset of actual DataRecord field names
  - [ ] 2.3: Test resume evidence references real document IDs with actual OCR content
  - [ ] 2.4: Test edge cases: empty DataRecord, null field values, no resume text
  - [ ] 2.5: Test grounding across multiple candidates in batch
- [ ] Task 3: Integration pipeline tests (AC: 4, 8)
  - [ ] 3.1: Test full fixture pipeline: score combination → ranking → explanation → grounding
  - [ ] 3.2: Test combined query from session history feeds into search correctly
  - [ ] 3.3: Test explanation evidence is consistent with search query terms
- [ ] Task 4: Regression verification (AC: 6, 7, 9)
  - [ ] 4.1: Run existing embedProvider tests (12 tests) — verify green
  - [ ] 4.2: Run existing searchSessionService tests (17 tests) — verify green
  - [ ] 4.3: Run full suite — verify zero regressions
  - [ ] 4.4: `tsc --noEmit` — verify zero TypeScript errors

## Dev Notes

- **No external calls**: All tests use the noop embed provider and mock/fixture data. No real DB, no real embedding API.
- **Fixture strategy**: Create typed fixture objects matching `SearchResult`, `DataRecord.fields`, and resume shapes. Test pure functions (`buildExplanation`, `extractQueryTerms`, `buildCombinedQuery`) plus score combination math.
- **Grounding invariant**: The critical property is `∀ evidence ∈ explanation: evidence.field ∈ actualFields ∨ (evidence.source === "resume" ∧ evidence.sourceDocumentId ∈ actualResumeIds)`. Tests assert this for every test case.
- **hybridSearch is raw SQL**: Can't unit-test the actual SQL without a DB. Instead, test the score combination/ranking logic, filter behavior expectations, and type contracts. The SQL itself is integration-tested via E2E (Story 4.8).

### Learnings from Previous Story

**From Story 4.6 (Status: done)**

- Prisma Json fields require `Prisma.InputJsonValue` casts for TypeScript compatibility.
- `SearchResponse` now includes `sessionId` and `queryContext` — all tests must include these fields.
- `buildCombinedQuery` reverses history (newest-first) before joining.

[Source: stories/4-6-iterative-refinement-context-preserved-across-prompts.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-4.md#Test Strategy Summary]
- [Source: docs/epics.md#Story-4.7 — Acceptance Criteria]
- [Source: src/server/search/hybridSearch.ts — hybrid search implementation]
- [Source: src/server/search/explainService.ts — explanation grounding logic]
- [Source: src/server/search/embedProvider.ts — provider interface]

---

## Dev Agent Record

### Implementation Summary

All 9 acceptance criteria met. Created two comprehensive test files covering fixture-based hybrid search ordering (26 tests) and explainability grounding invariants + integration pipeline (31 tests). The core grounding invariant — every evidence item references only fields/spans that actually exist — is verified across all fixture candidates in batch. All tests run without external provider calls.

### Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/server/search/hybridSearchFixtures.test.ts` | **New** | 26 tests: deterministic ordering, lifecycle filtering, score edge cases, limit/empty, shape invariants |
| `src/server/search/groundingInvariants.test.ts` | **New** | 31 tests: grounding invariants, edge cases, integration pipeline, score cross-checks, snippet/term edge cases |

### Test Results

- **29 test files, 209 tests — all passing**
- `tsc --noEmit` — zero errors
- +57 new tests over previous story (152 → 209)
- Zero regressions in pre-existing tests

### Test Coverage by AC

| AC | Tests | Description |
|----|-------|-------------|
| 1 | 8 | Fixture-based deterministic ordering: exact scores, ranking order, idempotency |
| 2 | 4 | Lifecycle filtering: ACTIVE default, ARCHIVE explicit, mixed, ranking within filter |
| 3 | 7 | Grounding invariants: field subset check, doc ID check, snippet grounding, batch grounding |
| 4 | 5 | Integration pipeline: terms → explain → grounding, session history → combined query → terms |
| 5 | 18 | Edge cases: empty results, null fields, numeric/array fields, limits, score clamping, long text |
| 6-7 | 0 (verified) | Existing embedProvider (12) + searchSessionService (17) tests confirmed green |
| 8 | all | No external calls — all fixture/pure-function tests |
| 9 | ✅ | tsc clean, vitest clean |

### Technical Decisions

1. **combineAndRank helper**: Mirrors hybridSearch.ts score combination + ranking logic exactly, enabling fixture-based tests without DB.
2. **Multi-candidate fixture set**: 6 candidates covering all combinations — high/low semantic, high/low lexical, ACTIVE/ARCHIVE, null name, empty fields, no resumes.
3. **Grounding invariant as batch assertion**: Verified for ALL candidates in a single test to catch any edge-case leaks.

---

## Code Review Record

### Review Checklist

| # | Check | Pass | Notes |
|---|-------|------|-------|
| 1 | All AC met | ✅ | All 9 criteria verified |
| 2 | TypeScript strict clean | ✅ | `tsc --noEmit` zero errors |
| 3 | All tests pass | ✅ | 29 files, 209 tests |
| 4 | No external calls | ✅ | Pure fixture/function tests only |
| 5 | Grounding invariant tested | ✅ | Core property verified for all fixtures |
| 6 | No regressions | ✅ | All 152 pre-existing tests still pass |
| 7 | Existing patterns followed | ✅ | Same vitest/import conventions |

### Findings

- No issues found. Test-only story — no production code modified.
- Coverage is comprehensive for the unit/integration level. Raw SQL in hybridSearch.ts is covered by E2E (Story 4.8).
