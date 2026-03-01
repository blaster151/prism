# Epic Technical Specification: Epic 4 — Semantic Search + Explainability Experience (Meaning-based "Wow")

Date: 2026-03-01
Author: BMad
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 delivers Prism's core differentiator: meaning-based ranked candidate search with evidence-linked explainability and iterative refinement. Building on the ingestion pipeline (Epic 3) and candidate data models (Epic 2), this epic replaces the deterministic placeholder embedding with a real (pluggable) embedding provider, implements a hybrid search API combining pgvector similarity with Postgres FTS, builds the search UI with ranked results and explanations, and adds iterative refinement that preserves context across prompts.

The "wow" moment is when a power user types a natural-language role need and sees fast, ranked results with concise, evidence-grounded explanations of *why* each candidate matched—linked to concrete Data Record fields and resume text spans.

## Objectives and Scope

### In-scope

- Upgrade the `Embedding` model to use real pgvector column storage (migration from `Json` to native `vector` type).
- Add `embedding_model` and `embedding_version` metadata tracking so embeddings can be regenerated safely.
- Implement a pluggable embedding generation service (`src/server/search/embedProvider.ts`) behind a provider interface, with a noop/deterministic stub for CI and a real provider (e.g., OpenAI `text-embedding-3-small` or Vertex AI) for production.
- Build a hybrid search service (`src/server/search/hybridSearch.ts`) combining:
  - Semantic retrieval via pgvector cosine distance.
  - Lexical fallback via Postgres FTS on `CandidateSearchDocument.ftsText`.
  - Structured filters (lifecycle state, optional field filters).
- Build a ranked search API endpoint (`POST /api/search`).
- Implement an explainability service that generates evidence-linked "why matched" explanations grounded in Data Record fields and/or resume text spans.
- Build the Search UI page (`src/app/(app)/search/page.tsx`) with:
  - Natural-language search input.
  - Ranked results list with score and explanation summary per candidate.
  - Expandable evidence detail panel (Data Record fields + resume spans).
- Implement iterative refinement: subsequent prompts are interpreted in context of the prior query, preserving filters and user intent.
- Store refinement state server-side (tied to a search session or shortlist context).
- Unit/integration tests for hybrid search, embedding generation, and explainability grounding.
- Playwright E2E test for the search → results → explanation flow.

### Out-of-scope (deferred to later epics)

- Shortlist curation actions (pin/keep/exclude) and intent persistence (Epic 5).
- Shortlist/resume exports (Epics 5, 6).
- CEC resume generation (Epic 6).
- Reconciliation/duplicate detection (Epic 7).
- Token/usage monitoring and cost guardrails (Epic 8).
- Advanced feedback-informed ranking and bias monitoring (post-MVP).

## System Architecture Alignment

- **Service layer first**: all search/embedding/explainability logic lives in `src/server/search/` and is called only from Route Handlers or job processors. No direct DB access from UI components.
- **Pluggable provider pattern**: embedding generation uses the same provider-interface pattern as OCR (`src/server/ocr/provider.ts`) and extraction (`src/server/extract/provider.ts`).
- **Jobs integration**: the existing `index-candidate` BullMQ job (Story 3.7) already triggers on Data Record changes. Epic 4 upgrades its embedding logic from the deterministic stub to the real provider.
- **RBAC + audit**: search endpoints enforce `POWER_USER` minimum role. Search actions are audit-logged (non-sensitive metadata only—no raw query PII in audit events).
- **pgvector in Postgres**: vectors stored in the same database as the canonical Data Record (ADR-001). The `embedding` table's `embedding_vector` column will be migrated from `Json` to a native pgvector `vector(N)` type.

## Detailed Design

### Services and Modules

| Module / Path | Responsibility | Inputs | Outputs |
|---|---|---|---|
| `src/server/search/embedProvider.ts` | Provider interface + factory for embedding generation | `EmbedProviderConfig` env vars | `EmbedProvider` instance |
| `src/server/search/noopEmbedProvider.ts` | Deterministic stub for CI/tests | text string | fixed-dim vector |
| `src/server/search/openaiEmbedProvider.ts` | Real embedding via OpenAI API | text string, API key | `vector(1536)` |
| `src/server/search/embedService.ts` | Orchestrate embed generation + storage for a candidate | candidateId | updated Embedding row |
| `src/server/search/hybridSearch.ts` | Combine pgvector similarity + FTS + filters into ranked results | query, filters, session context | ranked `SearchResult[]` |
| `src/server/search/explainService.ts` | Generate evidence-linked explanations for each result | candidateId, query, DataRecord fields | `Explanation { summary, evidence[] }` |
| `src/server/search/searchSessionService.ts` | Manage refinement state (prior query context, filters) | userId, sessionId | `SearchSession` |
| `src/app/api/search/route.ts` | Route Handler for `POST /api/search` | session, body | `{ data: { results, sessionId } }` |
| `src/app/(app)/search/page.tsx` | Search UI with input, results list, explanation panel | — | rendered page |
| `src/components/SearchBar.tsx` | Natural-language search input | — | query submission |
| `src/components/SearchResultCard.tsx` | Single result with score + summary | `SearchResult` | rendered card |
| `src/components/ExplanationPanel.tsx` | Expandable evidence detail | `Explanation` | rendered panel |

### Data Models and Contracts

#### Schema migration: `Embedding.vector` from `Json` to pgvector

**Current** (Epic 3 stub):
```prisma
model Embedding {
  vector Json @map("embedding_vector")
  ...
}
```

**Target** (Epic 4):
```sql
-- Migration: enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Alter column type (requires data migration for existing rows)
ALTER TABLE embedding
  ALTER COLUMN embedding_vector TYPE vector(1536)
  USING embedding_vector::vector(1536);

-- Add HNSW index for approximate nearest neighbor
CREATE INDEX embedding_vector_cosine_idx
  ON embedding USING hnsw (embedding_vector vector_cosine_ops);
```

Prisma does not natively support `vector` types yet; use `Unsupported("vector(1536)")` in the schema and raw SQL for vector queries.

```prisma
model Embedding {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  candidateId String   @db.Uuid @map("candidate_id")
  vector      Unsupported("vector(1536)") @map("embedding_vector")
  model       String   @map("embedding_model")
  version     Int      @map("embedding_version")
  createdAt   DateTime @default(now()) @map("created_at")

  candidate Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([candidateId])
  @@map("embedding")
}
```

#### New model: `SearchSession` (refinement state)

```prisma
model SearchSession {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String   @db.Uuid @map("user_id")
  queryHistory  Json     @default("[]") @map("query_history")  // Array of { query, filters, timestamp }
  currentContext String? @db.Text @map("current_context")       // Aggregated context for LLM
  shortlistId   String?  @db.Uuid @map("shortlist_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@map("search_session")
}
```

#### Type contracts

```typescript
// src/server/search/types.ts

export interface EmbedProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

export interface SearchResult {
  candidateId: string;
  score: number;                // 0–1 combined relevance
  semanticScore: number;        // pgvector cosine similarity component
  lexicalScore: number;         // FTS rank component
  explanation: Explanation;
}

export interface Explanation {
  summary: string;              // 1–2 sentence "why matched"
  evidence: EvidenceItem[];
}

export interface EvidenceItem {
  field: string;                // DataRecord field name (e.g., "skills", "clearance")
  snippet?: string;             // highlighted text from resume/record
  source: "record" | "resume";
  sourceDocumentId?: string;
}

export interface SearchFilters {
  lifecycleState?: "ACTIVE" | "ARCHIVE";
  // Extensible for future field-level filters
}

export interface SearchRequest {
  query: string;
  sessionId?: string;           // omit for new search, include for refinement
  filters?: SearchFilters;
}

export interface SearchResponse {
  results: SearchResult[];
  sessionId: string;
  queryContext: string;          // human-readable description of current context
}
```

### APIs and Interfaces

#### `POST /api/search`

**Request:**
```json
{
  "query": "Senior systems engineer with active TS/SCI and satellite experience",
  "sessionId": "optional-uuid-for-refinement",
  "filters": { "lifecycleState": "ACTIVE" }
}
```

**Response (200):**
```json
{
  "data": {
    "results": [
      {
        "candidateId": "uuid",
        "score": 0.92,
        "semanticScore": 0.88,
        "lexicalScore": 0.96,
        "explanation": {
          "summary": "Strong match: 12 years systems engineering, active TS/SCI, 3 satellite programs.",
          "evidence": [
            { "field": "clearance", "snippet": "TS/SCI (active)", "source": "record" },
            { "field": "experience", "snippet": "Lead Systems Engineer, GPS III program (2018-2022)", "source": "resume", "sourceDocumentId": "uuid" }
          ]
        }
      }
    ],
    "sessionId": "uuid",
    "queryContext": "Senior systems engineer with active TS/SCI and satellite experience"
  }
}
```

**Error responses:**
- `401` — unauthenticated
- `403` — insufficient role
- `400` — invalid request body (Zod validation)
- `500` — internal error

#### `GET /api/search/session/[id]`

Returns the current search session state (query history, context). Used by the UI to restore refinement state on page revisit.

### Workflows and Sequencing

```
Story 4.1: Schema migration (pgvector extension + Embedding column type + HNSW index)
    ↓
Story 4.2: EmbedProvider interface + noop + real provider + embedService
    ↓ (update index-candidate job to use real provider)
Story 4.3: hybridSearch service + search API route + SearchSession model
    ↓
Story 4.4: Search UI — SearchBar, results list, SearchResultCard
    ↓
Story 4.5: explainService + ExplanationPanel (evidence-linked)
    ↓
Story 4.6: searchSessionService + iterative refinement (context accumulation)
    ↓
Story 4.7: Unit/integration tests
    ↓
Story 4.8: Playwright E2E
```

Stories 4.1 → 4.2 → 4.3 are strictly sequential (each depends on the prior). Stories 4.4 and 4.5 can overlap once 4.3 is available. Story 4.6 can start once 4.3 is done. Stories 4.7 and 4.8 come last.

## Non-Functional Requirements

### Performance

- **Search latency**: `POST /api/search` should return results in < 2 seconds for the expected corpus size (thousands of candidates, not millions).
- **Embedding generation**: single candidate embedding should complete in < 3 seconds (API call + DB write). Batch re-embedding should be parallelizable via BullMQ jobs.
- **HNSW index**: use `lists = 100` (or similar) for pgvector HNSW; benchmark with representative data and tune `ef_search` / `m` parameters.
- **FTS performance**: Postgres `tsvector` / `ts_rank` on `CandidateSearchDocument.ftsText` should be fast for thousands of rows; add GIN index.

### Security

- **No raw PII in logs**: search queries may contain candidate-identifying info. Audit events log `eventType: "search.query"` with non-sensitive metadata (query length, result count, session ID) — never the raw query text.
- **RBAC enforcement**: `POST /api/search` requires `POWER_USER` or `ADMIN`. Enforced in the service layer via `requireRole`.
- **Embedding provider API keys**: stored in environment variables (`EMBED_PROVIDER_API_KEY`), never logged or returned in API responses.
- **Explanation grounding**: the system must not claim evidence it cannot point to. Explanations are generated from actual Data Record fields and resume text — never hallucinated.

### Reliability

- **Embedding provider failure**: if the embedding API is unavailable, the system should:
  1. Return an error for new embedding generation (not silently skip).
  2. Still allow search over candidates that already have embeddings (graceful degradation).
  3. Retry via BullMQ job retry for batch re-embedding.
- **Search with missing embeddings**: candidates without embeddings are excluded from semantic ranking but can still appear in FTS results (with lower combined score).

### Observability

- **Audit events**: `search.query` (per search), `search.refine` (per refinement), `search.explain` (if explanation generation is a separate action).
- **Structured logs**: log embedding generation duration, search latency, result count, provider used.
- **Error signals**: embedding provider timeouts, pgvector query errors, explanation generation failures — all logged with correlation IDs.

## Dependencies and Integrations

| Dependency | Version / Constraint | Purpose |
|---|---|---|
| PostgreSQL + pgvector | 18.3 + pgvector 0.8.2 | Vector storage + HNSW similarity search |
| Prisma | 7.4.1 | ORM (with `Unsupported` type for vector columns + raw SQL for vector queries) |
| OpenAI API (or Vertex AI) | `text-embedding-3-small` (1536 dims) | Production embedding generation |
| BullMQ + Redis | 5.8.2 / 7.2 | Background embedding generation jobs |
| Next.js | 15.5.12 | Route Handlers + App Router pages |
| Zod | 4.3.6 | Request validation |
| React | 19.x | Search UI components |
| Tailwind CSS | 4.2.0 | UI styling |

**New environment variables:**
- `EMBED_PROVIDER` — `"noop"` (default/CI) or `"openai"` or `"vertex"`
- `EMBED_PROVIDER_API_KEY` — API key for the embedding provider (not needed for noop)
- `EMBED_DIMENSIONS` — vector dimensionality override (default: `1536` for OpenAI)

## Acceptance Criteria (Authoritative)

1. **AC-4.1**: The `embedding` table uses a native pgvector `vector(N)` column with an HNSW index. Existing placeholder embeddings are migrated or regenerated. `embedding_model` and `embedding_version` are populated for every row.
2. **AC-4.2**: An embedding generation service exists behind a provider interface. The noop provider returns deterministic vectors. At least one real provider (OpenAI or Vertex) is implemented and configurable via `EMBED_PROVIDER` env var. Provider configuration is isolated; swapping providers requires only env var changes.
3. **AC-4.3**: A `POST /api/search` endpoint accepts a query + optional filters, returns ranked results combining semantic (pgvector) and lexical (FTS) scores, and filters by lifecycle state (default: ACTIVE).
4. **AC-4.4**: The Search UI displays a natural-language input, submits queries, and renders a ranked results list with score and a concise explanation summary per candidate.
5. **AC-4.5**: Each result's explanation includes an evidence list linking to concrete Data Record fields and/or resume text spans. The system never claims evidence it cannot point to. Explanation generation is audit-logged with non-sensitive metadata.
6. **AC-4.6**: Subsequent search prompts within the same session are interpreted in context of the prior query. The UI shows the current query context and applied filters. Refinement state is stored server-side.
7. **AC-4.7**: Unit/integration tests verify: deterministic ordering on fixture data, Active/Archive filtering, evidence references only existing fields/spans, embedding provider interface contract, hybrid score combination.
8. **AC-4.8**: A Playwright E2E test demonstrates: signed-in user runs a search → sees ranked results → expands a result → sees evidence-linked explanation details.

## Traceability Mapping

| AC | Spec Section | Component(s) / API(s) | Test Idea |
|---|---|---|---|
| AC-4.1 | Data Models — Schema migration | `prisma/schema.prisma`, migration SQL, `Embedding` model | Integration: verify column type is `vector(1536)`, HNSW index exists, old rows migrated |
| AC-4.2 | Services — embedProvider, embedService | `embedProvider.ts`, `noopEmbedProvider.ts`, `openaiEmbedProvider.ts`, `embedService.ts` | Unit: noop returns stable vector; mock real provider; verify model/version stored |
| AC-4.3 | APIs — `POST /api/search`, Services — hybridSearch | `hybridSearch.ts`, `route.ts`, `searchSessionService.ts` | Unit: ranked results with known fixtures; filter by lifecycle; Integration: API contract |
| AC-4.4 | Services — search UI | `search/page.tsx`, `SearchBar.tsx`, `SearchResultCard.tsx` | E2E: submit query → results rendered with scores |
| AC-4.5 | Services — explainService, UI — ExplanationPanel | `explainService.ts`, `ExplanationPanel.tsx` | Unit: evidence cites real fields; never hallucinated; E2E: expand → evidence visible |
| AC-4.6 | Services — searchSessionService | `searchSessionService.ts`, `SearchSession` model | Unit: refinement appends context; API: sessionId round-trip; E2E: refine preserves context |
| AC-4.7 | Test Strategy | All search services | Unit + integration suite covering ACs 4.1–4.6 |
| AC-4.8 | Test Strategy | Playwright | E2E: full search → explain flow |

## Risks, Assumptions, Open Questions

| # | Type | Description | Mitigation / Next Step |
|---|---|---|---|
| R1 | Risk | Prisma does not natively support pgvector `vector` type; raw SQL is required for vector queries and HNSW index creation. | Use `Unsupported("vector(N)")` in schema + `$queryRaw` / `$executeRaw` for vector operations. Encapsulate all raw SQL in `hybridSearch.ts` to minimize blast radius. |
| R2 | Risk | Embedding provider API latency and cost could be higher than expected for batch re-embedding of existing candidates. | Implement batch re-embed as a BullMQ job with configurable concurrency and rate limiting. Monitor token usage (prep for Epic 8). |
| R3 | Risk | Explanation quality depends on the LLM's ability to ground evidence in actual Data Record fields. Hallucinated evidence would undermine user trust. | Implement a validation step in `explainService` that checks every `EvidenceItem.field` exists in the candidate's actual `DataRecord.fields`. Reject/filter any ungrounded claims. |
| A1 | Assumption | The corpus size will remain in the low thousands of candidates for the foreseeable future. HNSW indexing parameters are tuned for this scale. | If scale grows significantly, re-evaluate index parameters or consider AlloyDB/external vector DB (per ADR-001). |
| A2 | Assumption | OpenAI `text-embedding-3-small` (1536 dimensions) is an acceptable default provider. Compliance review has not flagged issues with sending Data Record text to OpenAI. | Confirm with compliance. If restricted, implement Vertex AI embedding as the alternative. The provider interface makes this a config change. |
| A3 | Assumption | The noop embedding provider is sufficient for CI tests. Real embedding quality is validated in a staging environment with representative data. | Add a staging-only test suite if needed. |
| Q1 | Question | Should the search endpoint also support searching by specific fields (e.g., "clearance = TS/SCI") as structured filters, or is natural-language-only sufficient for MVP? | Recommend starting with lifecycle filter only (Active/Archive) and adding field filters in a follow-up if users request them. |
| Q2 | Question | What is the acceptable latency for explanation generation? If LLM-based, it adds 1–3 seconds per result. | Generate explanations in parallel for the top N results (not all). Consider caching explanations for recently searched candidates. |
| Q3 | Question | Should refinement state be tied to an existing Shortlist, or is it a standalone SearchSession? | Start with standalone `SearchSession`. Link to Shortlist in Epic 5 when curation actions are added. |

## Test Strategy Summary

### Unit tests (`vitest`)

- **embedProvider**: noop returns deterministic vector of correct dimensions; provider factory selects correct implementation based on env var.
- **embedService**: mock provider → verify Embedding row created with correct model/version; error handling when provider fails.
- **hybridSearch**: mock DB → verify combined scoring, ranking order, lifecycle filter applied, empty results handled.
- **explainService**: mock DataRecord/resume data → verify evidence items reference real fields; reject ungrounded claims.
- **searchSessionService**: create session → append refinement → verify context accumulation.

### Integration tests (`vitest` with mocked DB layer)

- **Full search flow**: embed query → pgvector similarity → FTS fallback → combine scores → rank → explain → return.
- **Active/Archive filter**: verify candidates with ARCHIVE state excluded by default.
- **Missing embeddings**: candidates without embeddings appear in FTS-only results with lower score.

### E2E tests (`playwright`)

- **Story 4.8**: Signed-in user → navigate to Search page → type query → submit → see ranked results with scores → expand a result → see evidence-linked explanation with Data Record fields.
- **Refinement**: submit initial query → submit refinement → verify results update and context is preserved.

### CI considerations

- All unit/integration tests use the noop embedding provider (no external API calls).
- E2E tests use seeded fixture data with pre-computed noop embeddings.
- Real provider tests run only in staging (manual or scheduled).

---

_Generated by BMAD epic-tech-context workflow v6_
_Date: 2026-03-01_
_For: BMad_
