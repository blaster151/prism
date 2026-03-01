# Story 4.2: Implement embedding generation service (LLM provider pluggable)

Status: done

## Story

As a developer,
I want a provider-based embedding generation service,
So that we can swap embedding providers if compliance/vendor constraints change.

## Acceptance Criteria

1. An `EmbedProvider` interface exists at `src/server/search/embedProvider.ts` with `name: string`, `dimensions: number`, and `embed(text: string): Promise<number[]>`.
2. A `NoopEmbedProvider` returns deterministic 1536-dim vectors (same logic currently in `indexService.deterministicEmbeddingVector`) and is the default when `EMBED_PROVIDER` is unset or `"noop"`.
3. An `OpenAiEmbedProvider` calls the OpenAI embeddings API (`text-embedding-3-small`, 1536 dims) using `EMBED_PROVIDER_API_KEY`. It throws `AppError(MISCONFIGURED)` if the API key is missing.
4. A factory function `getEmbedProvider()` returns the correct provider based on `EMBED_PROVIDER` env var (`"noop"` | `"openai"`).
5. `indexService.runIndexForCandidate` is updated to call `getEmbedProvider().embed(ftsText)` instead of the inline `deterministicEmbeddingVector()` function.
6. The `embedding_model` written to the database matches the provider's `name` property. `embedding_version` is `1` for all providers initially.
7. Provider API keys are never logged. Audit events log provider name and embedding dimensions — not the raw text input.
8. Existing unit tests continue to pass (noop provider is default in test environment).

## Tasks / Subtasks

- [ ] Task 1: Create EmbedProvider interface and types (AC: 1)
  - [ ] 1.1: Create `src/server/search/embedProvider.ts` with `EmbedProvider` interface, `EmbedResult` type, and `getEmbedProvider()` factory
  - [ ] 1.2: Define `EmbedResult = { provider: string; dimensions: number; vector: number[] }`
- [ ] Task 2: Implement NoopEmbedProvider (AC: 2)
  - [ ] 2.1: Create `src/server/search/noopEmbedProvider.ts` — move `deterministicEmbeddingVector()` logic from indexService
  - [ ] 2.2: Class implements `EmbedProvider`, `name = "noop"`, `dimensions = 1536`
- [ ] Task 3: Implement OpenAiEmbedProvider (AC: 3)
  - [ ] 3.1: Create `src/server/search/openaiEmbedProvider.ts`
  - [ ] 3.2: Use `fetch()` to call `https://api.openai.com/v1/embeddings` (no extra SDK dependency)
  - [ ] 3.3: Validate response shape, return 1536-dim vector
  - [ ] 3.4: Throw `AppError(MISCONFIGURED)` if `EMBED_PROVIDER_API_KEY` is missing
  - [ ] 3.5: Throw `AppError(UPSTREAM_ERROR)` on API failure with status/message (no PII)
- [ ] Task 4: Wire factory function (AC: 4)
  - [ ] 4.1: `getEmbedProvider()` reads `EMBED_PROVIDER` env var, returns `NoopEmbedProvider` for `"noop"` or unset, `OpenAiEmbedProvider` for `"openai"`
- [ ] Task 5: Update indexService to use provider (AC: 5, 6, 7)
  - [ ] 5.1: Replace inline `deterministicEmbeddingVector()` with `getEmbedProvider().embed(ftsText)`
  - [ ] 5.2: Set `embeddingModel` from `provider.name`, `embeddingVersion = 1`
  - [ ] 5.3: Ensure audit metadata logs `provider.name` and `provider.dimensions` — not raw text
- [ ] Task 6: Add audit event type for embedding generation (AC: 7)
  - [ ] 6.1: Add `EmbedGenerate: "embed.generate"` to `AuditEventTypes` (optional — can reuse `IndexRun`)
- [ ] Task 7: Write unit tests (AC: 8)
  - [ ] 7.1: Test `getEmbedProvider()` defaults to noop
  - [ ] 7.2: Test `getEmbedProvider()` returns openai when `EMBED_PROVIDER=openai`
  - [ ] 7.3: Test noop provider returns deterministic 1536-dim vectors
  - [ ] 7.4: Test noop provider returns same vector for same input
  - [ ] 7.5: Test openai provider throws MISCONFIGURED without API key
  - [ ] 7.6: Test indexService tests still pass (noop is default)

## Dev Notes

- **Follow existing provider pattern**: mirror `src/server/ocr/provider.ts` and `src/server/extract/provider.ts` structure exactly — interface, noop class, real class, factory function.
- **No new npm dependencies**: use native `fetch()` for OpenAI API calls (Node 24 has native fetch). Avoid adding `openai` SDK to keep the dependency surface minimal.
- **1536 dimensions**: matches `text-embedding-3-small`. The noop provider must also produce 1536-dim vectors to keep the pgvector column consistent.
- **indexService refactoring**: the `deterministicEmbeddingVector()` function in indexService becomes dead code after this story. Move the logic to `NoopEmbedProvider` and remove it from indexService.
- **Async embed**: the real provider is async (API call), so `indexService.runIndexForCandidate` already operates inside a transaction — the embed call should happen *before* the transaction (compute vector, then write in tx). This avoids holding a DB transaction open during an HTTP call.
- **Security**: `EMBED_PROVIDER_API_KEY` must never appear in logs, error messages, or audit events. The OpenAI provider should validate response shape defensively.

### Project Structure Notes

- New files in `src/server/search/` (directory doesn't exist yet — create it)
- Provider tests in `src/server/search/embedProvider.test.ts`
- Follows same flat-file provider pattern as OCR/extract

### Learnings from Previous Story

**From Story 4.1 (Status: done)**

- Prisma `Unsupported` types require raw SQL for writes — `$executeRawUnsafe` with parameterized queries. The pattern in `indexService.ts` is established and working.
- `deterministicEmbeddingVector()` uses an XorShift PRNG seeded from FNV-1a hash of text. Move this exact logic to `NoopEmbedProvider.embed()`.
- Vector literal format is `[${vector.join(",")}]` — passed as a bind parameter to `$executeRawUnsafe`.
- The `embeddingModel` and `embeddingVersion` fields are already written in `indexService`. Just change the source from hardcoded string to `provider.name`.

[Source: stories/4-1-define-embedding-strategy-and-data-plumbing-pgvector-model-metadata.md#Dev-Agent-Record]

### References

- [Source: docs/tech-spec-epic-4.md#AC-4.2]
- [Source: docs/tech-spec-epic-4.md#Services and Modules — embedProvider, noopEmbedProvider, openaiEmbedProvider]
- [Source: docs/architecture.md#ADR-001 — Vector storage strategy]
- [Source: src/server/ocr/provider.ts — existing provider pattern]
- [Source: src/server/extract/provider.ts — existing provider pattern]

## Dev Agent Record

### Context Reference

- `docs/tech-spec-epic-4.md`
- `docs/architecture.md`
- `src/server/ocr/provider.ts` (pattern reference)
- `src/server/extract/provider.ts` (pattern reference)
- `stories/4-1-define-embedding-strategy-and-data-plumbing-pgvector-model-metadata.md`

### Agent Model Used

Claude Opus 4.6 (GitHub Copilot)

### Debug Log References

2026-03-01:
- Created `src/server/search/embedProvider.ts`:
  - `EmbedProvider` interface with `name`, `dimensions`, `embed(text)` contract
  - `EmbedResult` type for structured results
  - `NoopEmbedProvider` — deterministic 1536-dim vector via FNV-1a + XorShift (moved from `indexService.deterministicEmbeddingVector`)
  - `OpenAiEmbedProvider` — calls `https://api.openai.com/v1/embeddings` via native `fetch()`, model defaults to `text-embedding-3-small`, throws `MISCONFIGURED` without API key, throws `UPSTREAM_ERROR` on API failure with defensive response validation
  - `getEmbedProvider()` factory reads `EMBED_PROVIDER` env var (case-insensitive), defaults to `"noop"`
- Updated `src/server/index/indexService.ts`:
  - Replaced hardcoded `deterministicEmbeddingVector()` + `"deterministic-stub"` with `getEmbedProvider().embed(ftsText)`
  - Embed call moved BEFORE transaction to avoid holding DB tx during HTTP calls
  - `embeddingModel` now sourced from `provider.name`, `embeddingVersion = 1`
  - Audit metadata now includes `dimensions: provider.dimensions`
  - Kept legacy `deterministicEmbeddingVector()` in `__private` exports for backward-compatible indexService tests
- Created `src/server/search/embedProvider.test.ts` (12 tests):
  - Factory: defaults to noop, returns noop explicitly, returns openai, case-insensitive
  - Noop: deterministic 1536-dim, different inputs → different vectors, value range [-1,1)
  - OpenAI: throws MISCONFIGURED without key, throws UPSTREAM_ERROR on 429, throws on malformed response, returns vector on success, does not leak API key in errors
- All 83 tests pass across 22 files, `tsc --noEmit` clean

### Completion Notes List

- ✅ `EmbedProvider` interface created following existing OCR/Extract provider pattern
- ✅ `NoopEmbedProvider` — deterministic stub, 1536 dims, same algorithm as Story 4.1
- ✅ `OpenAiEmbedProvider` — uses native `fetch()` (no SDK dependency), model configurable via `EMBED_OPENAI_MODEL` env var
- ✅ Factory `getEmbedProvider()` reads `EMBED_PROVIDER` env var (`"noop"` default, `"openai"`)
- ✅ `indexService` updated to use provider — embed call happens before DB transaction
- ✅ API key never logged or included in error details (verified by test)
- ✅ Audit metadata includes provider name + dimensions, never raw text input
- ✅ 12 new tests for embedProvider, all existing tests continue to pass (83 total)
- ⚠️ Note for Story 4.3: `getEmbedProvider().embed(query)` can be used to embed search queries for cosine similarity matching
- ⚠️ Note for future: to add Vertex AI provider, add a `VertexEmbedProvider` class and extend the factory switch

### File List

- NEW: `src/server/search/embedProvider.ts`
- NEW: `src/server/search/embedProvider.test.ts`
- MODIFIED: `src/server/index/indexService.ts`

## Code Review Record

### Reviewer

Claude Opus 4.6 (GitHub Copilot) — automated senior-developer code review

### Review Date

2026-03-01

### Files Reviewed

- `src/server/search/embedProvider.ts`
- `src/server/search/embedProvider.test.ts`
- `src/server/index/indexService.ts`
- `src/server/index/indexService.test.ts`

### Findings

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | Low-Med | Dead code: `deterministicEmbeddingVector` duplicated in indexService + NoopEmbedProvider | ✅ Fixed — removed from indexService, migrated tests to use buildFtsText only; vector tests live in embedProvider.test.ts |
| 2 | Info | `EmbedResult` type exported but unused | Accepted — available for Story 4.3 `embedService` |
| 3 | Info | `EMBED_OPENAI_MODEL` env var not in tech spec | Noted — good addition for model flexibility |
| 4 | Info | Provider instantiation on every call (no singleton) | Accepted — stateless providers, no connection setup needed |
| 5 | Minor | `EMBED_DIMENSIONS` env var from tech spec not wired | Noted for later — 1536 is correct for text-embedding-3-small |
| 6 | Good | Embed-before-transaction pattern | ✅ Correct — avoids holding DB tx during HTTP calls |
| 7 | Good | API key never leaked in errors | ✅ Verified by explicit test |

### Verdict

**PASS** — 1 finding fixed (dead code removal), 3 informational items noted, 2 positive observations. All 83 tests pass, `tsc --noEmit` clean. Implementation follows the existing provider pattern (OCR/Extract) consistently, test coverage is comprehensive including error paths and security.
