# Architecture

## Executive Summary

Prism is an internal Next.js web application for ~5 CEC power users to ingest resumes from Dropbox (including scanned PDFs), convert them into structured, editable Data Records with provenance/versioning, and enable meaning-based ranked candidate search with evidence-linked explainability and persistent shortlist curation. The architecture must be audit-ready for an Aerospace/Defense contractor posture (CMMC Level 2 context), emphasizing consistent auth/RBAC/admin operations, audit logging, controlled exports, and governed AI transformations.

Key clarifications captured during architecture kickoff:

- **Background jobs**: required for ingestion/OCR/extraction/index updates (and related reconciliation detection) so the UI stays responsive and can show progress/job status.
- **Encryption/TLS**: OK to defer TLS during local-only milestones. Before any non-local environment (any real user logins over a network), TLS/HTTPS becomes a prerequisite because the system handles authentication and sensitive PII in transit.

## Project Initialization

**Starter template decision:** Use `create-next-app` as the foundation (recommended).

**Rationale:** Keeps the baseline simple and well-supported while we explicitly choose the pieces Prism needs (auth/RBAC/admin, Postgres, background jobs for ingestion/OCR/extraction/indexing, audit logging, explainability UI).

**Initialization command (to be run as the first implementation story):**

```bash
npx create-next-app@latest prism \
  --typescript \
  --eslint \
  --tailwind \
  --app \
  --src-dir
```

**Decisions provided by the starter:**

- Next.js application scaffold (App Router)
- TypeScript configuration
- ESLint configuration
- Tailwind CSS setup
- `src/` directory layout

**Explicitly deferred to architecture decisions (not provided by starter):**

- Authentication strategy (SSO vs local auth; session/MFA posture)
- RBAC model + admin user management UX
- Postgres schema + ORM choice
- Audit logging and retention
- Background job/queue strategy
- Search strategy (semantic + any lexical/FTS)
- OCR/extraction approach and AI vendor constraints

## Decision Identification

Based on the PRD (and CMMC/audit-ready domain posture), BMad Master has identified the architectural decision areas that must be locked to prevent agent drift.

### Critical (blocks everything)

1. **Runtime + framework versions**: Node.js LTS, Next.js major/minor line
2. **Authentication strategy**: enterprise SSO vs local auth; session model
3. **Authorization/RBAC model**: role model + admin operations boundaries
4. **Database + ORM**: Postgres version line + ORM/data access layer
5. **Background jobs**: queue/workers for ingestion/OCR/extraction/indexing
6. **Search architecture**: semantic (vectors) + any lexical/FTS; index update strategy
7. **Audit logging architecture**: event model, retention, and reporting access
8. **Deployment target**: cloud/on-prem posture, networking constraints, and service boundaries

### Important (shapes the system)

1. **OCR/extraction provider strategy**: pluggable providers; compliance constraints
2. **Explainability evidence-linking**: how explanations cite record/resume evidence
3. **Data provenance/versioning**: how extracted/inferred/user-edited data is tracked
4. **Dropbox integration boundary**: sync semantics, credentials, and failure modes

### Nice-to-have (can defer explicitly)

1. Fine-grained retention/redaction policies (unless mandated early)
2. Advanced analytics/reporting beyond audit log viewing

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |

| Runtime | Node.js (LTS) | 24.14.0 | All | Stable LTS baseline for Next.js and tooling |
| Web framework | Next.js (App Router) | 15.5.12 | All | Use current stable LTS line to reduce churn |
| UI runtime | React | 19.2.4 | All | Matches modern Next.js baseline |
| Language | TypeScript | 5.7.3 | All | Latest stable (avoid TS 6 beta) |
| Styling | Tailwind CSS | 4.2.0 | UI | Starter-compatible, current stable |
| Database | PostgreSQL | 18.3 | All data features | System of record; supports relational + extensions |
| DB extension | pgvector | 0.8.2 | Search | Semantic retrieval in Postgres |
| Vector storage strategy | Postgres + pgvector (default) | n/a | Search | Simplest ops + compliance posture; can migrate to AlloyDB/Vertex/external vector DB if scale demands |
| ORM | Prisma | 7.4.1 | All data features | Productive schema + migrations + typed client |
| Cache/queue backend | Redis (Memorystore-compatible) | 7.2 | Ingestion/Search jobs | Managed Redis on GCP; BullMQ-compatible; avoid pinning unsupported versions |
| Background jobs | BullMQ | 5.8.2 | Ingestion/OCR/Indexing | Reliable async pipeline for heavy work |
| Authentication | NextAuth.js (v4) | 4.24.7 | Auth/Admin/RBAC | Stable auth baseline; can evolve to SSO later if needed |
| Authorization | RBAC roles: Admin, PowerUser | n/a | All | Keep roles minimal; all authenticated users can create/curate shortlists |
| Audit logging | Postgres audit_event table | n/a | All sensitive actions | Centralized, queryable audit trail; export later if needed |
| Search | pgvector + Postgres FTS (hybrid) | n/a | Candidate discovery | Semantic retrieval with lexical fallback and structured filters |
| OCR provider (default) | Google Cloud Document AI | n/a | Resume ingestion (scanned PDFs) | Deterministic-ish OCR; separate cost line item |
| LLM extraction (default) | LLM over extracted text | n/a | Data Record creation | Keeps raw OCR separate; vendor swappable; supports provenance controls |
| Deployment (default) | Cloud Run (app + worker) + Cloud SQL Postgres + Memorystore Redis | n/a | All | GCP-native managed services; simple ops; aligns with async job architecture |
| API pattern | Next.js Route Handlers (REST-ish JSON) | n/a | All | Clear request/response contracts; easy to audit/log; consistent RBAC enforcement |

## Project Structure

```
prism/
  # App + worker live in a single repository; deployed as two Cloud Run services
  README.md
  package.json
  package-lock.json
  tsconfig.json
  next.config.ts
  postcss.config.mjs
  tailwind.config.ts
  eslint.config.mjs
  .env.example
  .gitignore
  prisma/
    schema.prisma
    migrations/
  docker/
    Dockerfile.app
    Dockerfile.worker
  scripts/
    dev-worker.ts
  docs/
    PRD.md
    domain-brief.md
    architecture.md
  src/
    app/
      (app)/
        layout.tsx
        page.tsx
        candidates/
          page.tsx
        search/
          page.tsx
        admin/
          page.tsx
      api/
        auth/
          [...nextauth]/
            route.ts
        candidates/
          route.ts
        ingestion/
          route.ts
        search/
          route.ts
        exports/
          route.ts
        audit/
          route.ts
    components/
      CandidateCard.tsx
      SearchBar.tsx
      ExplanationPanel.tsx
    jobs/
      queues.ts
      worker.ts
      processors/
        ingest-resume.ts
        ocr-document.ts
        extract-record.ts
        index-candidate.ts
        reconcile-candidate.ts
    server/
      auth/
        rbac.ts
        requireRole.ts
      db/
        prisma.ts
      audit/
        auditLogger.ts
        eventTypes.ts
      dropbox/
        client.ts
        sync.ts
      ocr/
        provider.ts
        documentAiProvider.ts
      extraction/
        extractor.ts
      search/
        embedder.ts
        hybridSearch.ts
      exports/
        exportShortlist.ts
        renderCecResume.ts
    lib/
      env.ts
      ids.ts
      http.ts
      errors.ts
      logger.ts
      zodSchemas.ts
```

## Epic to Architecture Mapping

Epics have not been generated yet. Once `create-epics-and-stories` is run, map each epic to:

1. `src/app/*` pages
2. `src/app/api/*` route handlers
3. `src/server/*` services
4. `src/jobs/*` processors (for async ingestion/indexing work)

This table should be updated immediately after epics exist to prevent agent drift.

## Technology Stack Details

### Core Technologies

- **Frontend/App**: Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL (system of record)
- **Semantic search**: pgvector in Postgres for embeddings + similarity search
- **ORM**: Prisma (schema, migrations, typed client)
- **Background jobs**: BullMQ + Redis for ingestion/OCR/extraction/index updates and retries
- **Storage integration**: Dropbox (source of original resume files)
- **AI components**: pluggable providers for OCR/extraction + embeddings/ranking (vendor constraints from compliance)

### Integration Points

1. **Dropbox ↔ Prism**
   1. Prism reads source resume files from Dropbox and maintains a structured Data Record in Postgres.
   2. Dropbox access is least-privilege; failures are surfaced and jobs are retryable.
2. **Ingestion pipeline**
   1. Dropbox change detection → job queue → OCR (if needed) → extraction → Data Record update → (re)index embeddings → reconciliation suggestions.
3. **Search pipeline**
   1. Query + refinement → vector retrieval (pgvector) + optional lexical filters → ranking + explainability evidence links → shortlist curation + exports.

### Notes on vector DB alternatives

Prism’s default approach is Postgres + pgvector (keep vectors close to the canonical Data Record for simplicity and compliance posture). Alternatives to consider if scale or performance demands it:

1. **AlloyDB on GCP**: Postgres-compatible managed database with additional vector search indexing options; strong fit if you want to stay “Postgres-first” while improving vector performance on GCP. This is a GCP-managed service and thus cloud-provider-coupled.
2. **Vertex AI Vector Search**: fully managed vector search service; adds a separate system and costs, but can scale well.
3. **External vector DBs (Pinecone/Weaviate/Milvus)**: separate service with its own schema, auth, networking, and cost model. Requires an ingestion/sync pipeline from Postgres/Data Records into the vector DB and clear strategies for consistency and re-indexing.

## Novel Pattern Designs

1. **Meaning-based search with evidence-linked explainability**
   1. Retrieval: pgvector → filtered SQL → ranked results
   2. Explanation artifact: `{ summary, evidence[] }` where evidence links to Data Record fields and/or resume spans
   3. UI: explanation is rendered inline with results and can expand to show evidence
2. **Intent-preserving shortlist refinement**
   1. User actions (pin/keep/exclude) persist across refinements and are stored as `ShortlistItem.state`
   2. Ranking logic must treat pinned/kept/excluded as constraints, not suggestions

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

1. **Service layer first**
   1. Route Handlers and Server Actions call `src/server/*` services only (no direct DB access from UI components).
   2. RBAC checks + audit logging are performed inside the service layer for every sensitive action.

2. **Jobs are explicit and idempotent**
   1. All heavy work (OCR/extraction/indexing/reconciliation) runs in BullMQ processors under `src/jobs/processors/`.
   2. Job payloads are validated with Zod schemas (`src/lib/zodSchemas.ts`).
   3. Processors must be idempotent (safe to retry); retries/backoff configured per queue in `src/jobs/queues.ts`.

3. **Provenance is modeled, not implied**
   1. Every Data Record field has provenance: `extracted | inferred | userEdited`.
   2. Any AI-suggested update to factual fields must be staged for explicit user confirmation.

4. **Explainability is evidence-linked**
   1. “Why matched” explanations must cite concrete evidence: Data Record fields and/or resume spans.
   2. The UI renders evidence links consistently via `ExplanationPanel`.

5. **Audit logging is ubiquitous for sensitive events**
   1. Write an `audit_event` row for auth/session events, record view, search, export, admin actions, ingestion/extraction actions, and reconciliation decisions.
   2. Audit events are written in the same transaction as the sensitive mutation where possible.

## Consistency Rules

### Naming Conventions

1. **Folders**: `kebab-case` (e.g., `src/server/dropbox/`, `src/jobs/processors/`)
2. **React components**: PascalCase component names and files (e.g., `CandidateCard.tsx`)
3. **API routes**: plural nouns; Next Route Handlers at `src/app/api/<resource>/route.ts`
4. **Job/queue names**: `kebab-case` (e.g., `ingest-resume`, `index-candidate`)
5. **Database**
   1. Prisma models: PascalCase singular (e.g., `Candidate`, `AuditEvent`)
   2. Tables/columns: `snake_case` (Prisma maps via `@@map`/`@map`)
   3. Primary keys: `uuid` (prefer time-sortable uuidv7 where practical)
6. **Environment variables**: `UPPER_SNAKE_CASE` (e.g., `DATABASE_URL`, `REDIS_URL`, `DROPBOX_TOKEN`)

### Code Organization

1. UI lives in `src/app/` and `src/components/`.
2. All business logic lives in `src/server/`.
3. Integrations are isolated behind provider interfaces (`src/server/ocr/provider.ts`, `src/server/dropbox/client.ts`).
4. Background job entrypoint lives in `src/jobs/worker.ts` and imports processors only.
5. Shared utilities live in `src/lib/`.

### Error Handling

1. Use a single `AppError` shape in `src/lib/errors.ts` with:
   1. `code` (stable string)
   2. `message` (user-safe)
   3. optional `details` (non-sensitive)
   4. `httpStatus`
2. API error responses use:
   1. `200` only for successful outcomes
   2. otherwise `{ error: { code, message, details? } }`
3. Never return raw stack traces to clients; log them server-side with request correlation.

### Logging Strategy

1. Use structured JSON logs (via a single logger wrapper in `src/lib/logger.ts`).
2. Include correlation fields consistently:
   1. `requestId`
   2. `userId` (if available)
   3. `candidateId` / `jobId` (when relevant)
   4. `auditEventId` (when applicable)
3. Do not log raw resume content or sensitive PII in application logs.

## Data Architecture

### Core data models (high level)

1. **User**
   1. id (uuid)
   2. email
   3. role (`ADMIN` | `POWER_USER`)
   4. status (active/disabled)
   5. created_at / updated_at

2. **Candidate**
   1. id (uuid)
   2. lifecycle_state (`ACTIVE` | `ARCHIVE`)
   3. canonical_person_key (nullable; for reconciliation)
   4. created_at / updated_at

3. **ResumeDocument**
   1. id (uuid)
   2. candidate_id
   3. dropbox_path
   4. content_hash (for change detection)
   5. ocr_status / extraction_status
   6. created_at / updated_at

4. **DataRecord**
   1. id (uuid)
   2. candidate_id (1:1 current record pointer)
   3. fields (structured columns for key fields + JSONB for extensibility)
   4. created_at / updated_at

5. **DataRecordFieldProvenance**
   1. record_id
   2. field_name
   3. source (`EXTRACTED` | `INFERRED` | `USER_EDITED`)
   4. source_document_id (nullable)
   5. last_modified_by_user_id (nullable)
   6. last_modified_at

6. **Embedding**
   1. id (uuid)
   2. candidate_id
   3. embedding_vector (pgvector)
   4. embedding_model
   5. embedding_version
   6. created_at

7. **Shortlist**
   1. id (uuid)
   2. owner_user_id
   3. name
   4. query_context (text)
   5. created_at / updated_at

8. **ShortlistItem**
   1. shortlist_id
   2. candidate_id
   3. state (`PINNED` | `KEPT` | `EXCLUDED` | `SUGGESTED`)
   4. rationale (optional user note)
   5. created_at / updated_at

9. **AuditEvent**
   1. id (uuid)
   2. actor_user_id (nullable for system events)
   3. event_type
   4. entity_type / entity_id
   5. metadata (JSONB, non-sensitive)
   6. created_at

### Relationships

- User 1:N Shortlist
- Candidate 1:N ResumeDocument
- Candidate 1:1 DataRecord (current) + 1:N versions if needed later
- Candidate 1:N Embedding (support embedding version rotation)
- Shortlist 1:N ShortlistItem
- AuditEvent references User + optional entity pointers

## API Contracts

API contracts are defined as REST-ish JSON via Next.js Route Handlers. All sensitive endpoints enforce RBAC and write `AuditEvent` rows.

### Common response envelope

- Success: `{ data: ... }`
- Error: `{ error: { code: string, message: string, details?: object } }`

### Candidate search

- `POST /api/search`
  - Request: `{ query: string, shortlistId?: string, filters?: { lifecycleState?: "ACTIVE"|"ARCHIVE" } }`
  - Response: `{ data: { results: Array<{ candidateId: string, score: number, explanation: { summary: string, evidence: Array<{ field: string, snippet?: string, source: "record"|"resume", sourceDocumentId?: string }> } }> } }`

### Shortlist curation

- `POST /api/exports/shortlist`
  - Request: `{ shortlistId: string, format: "json"|"text" }`
  - Response: `{ data: { downloadUrl: string } }`

### Resume generation

- `POST /api/exports/cec-resume`
  - Request: `{ candidateId: string }`
  - Response: `{ data: { downloadUrl: string } }`

### Ingestion

- `POST /api/ingestion/trigger`
  - Request: `{ dropboxPath?: string }`
  - Response: `{ data: { jobId: string } }`

### Audit log review (Admin only)

- `GET /api/audit?from=...&to=...&eventType=...`
  - Response: `{ data: { events: Array<{ id: string, createdAt: string, actorUserId?: string, eventType: string, entityType?: string, entityId?: string, metadata: object }> } }`

## Security Architecture

Security posture is “audit-ready by default” for an Aerospace/Defense contractor context.

1. **Authentication**: NextAuth v4.
2. **Authorization**: RBAC with two roles (Admin, PowerUser); all sensitive actions enforced in the service layer.
3. **PII/CUI-adjacent handling**
   1. No raw resume content in application logs.
   2. Exports are role-gated and audit-logged.
4. **Auditability**
   1. `audit_event` table records sensitive events and is queryable by Admins.
   2. Mutations and exports should log in the same transaction where practical.
5. **TLS/HTTPS**
   1. Local-only milestones may use HTTP.
   2. Any non-local environment with real user logins and PII must use TLS/HTTPS (deployment prerequisite).

## Performance Considerations

1. **Async ingestion**: OCR/extraction/indexing runs via BullMQ; UI shows job status and does not block.
2. **Hybrid search**: semantic retrieval via pgvector with SQL filters; use Postgres FTS for exact-term fallback.
3. **Caching**: cache hot queries and/or embedding computations where appropriate (ensure cache does not leak sensitive data).
4. **Index maintenance**: embeddings and FTS indexes updated incrementally on record change; support periodic rebuild jobs.

## Deployment Architecture

Default deployment on GCP:

1. **Cloud Run**: `prism-app` (Next.js)
2. **Cloud Run**: `prism-worker` (BullMQ workers)
3. **Cloud SQL for PostgreSQL**: primary DB + pgvector extension
4. **Memorystore for Redis**: queue backend for BullMQ

Networking notes:

- Use private connectivity where possible (Cloud Run ↔ Cloud SQL, Cloud Run ↔ Memorystore).
- Use IAM/service accounts for least privilege.

## Development Environment

### Prerequisites

- Node.js 24.14.0 (LTS)
- Postgres (local Docker) compatible with pgvector
- Redis (local Docker)
- GCP credentials (only needed when testing Document AI OCR or Cloud-hosted components)

### Setup Commands

```bash
# 1) App scaffold
npx create-next-app@latest prism --typescript --eslint --tailwind --app --src-dir

# 2) Local services (example)
# docker compose up -d postgres redis

# 3) Prisma
# npx prisma init
# npx prisma migrate dev

# 4) Start app + worker
# npm run dev
# npm run worker:dev
```

## Architecture Decision Records (ADRs)

### ADR-000: Baseline stack and versions

- **Decision**: Next.js App Router web app, Postgres as system of record, Prisma ORM, pgvector for semantic search, BullMQ+Redis for background jobs.
- **Versions**: captured in the Decision Summary table above.
- **Rationale**: minimizes moving parts while meeting core requirements (meaning-based retrieval + explainability + governed ingestion) and keeps an explicit upgrade path for vector search if needed.

### ADR-001: Vector storage strategy (default)

- **Decision**: store embeddings in Postgres using pgvector (default).
- **Rationale**: simplest operational footprint and easiest consistency with the canonical Data Record, while preserving an upgrade path to AlloyDB/Vertex AI Vector Search/external vector DB if scale demands it.

### ADR-002: Background job architecture

- **Decision**: use BullMQ workers backed by Redis for ingestion/OCR/extraction/indexing and reconciliation detection.
- **Rationale**: keeps the UI responsive, enables retries and observability, and cleanly separates long-running operations from web requests.

### ADR-003: TLS/HTTPS timing

- **Decision**: OK to defer TLS during **local-only milestones**.
- **Constraint**: before any non-local environment with real user logins and PII over a network, TLS/HTTPS becomes a prerequisite.

### ADR-004: Authentication (initial)

- **Decision**: use **NextAuth.js v4** as the initial authentication mechanism.
- **Rationale**: stable, well-understood for Next.js App Router projects; keeps early delivery simple while we build RBAC, audit logging, and core workflows. If enterprise SSO becomes mandatory, revisit and migrate behind a clear auth boundary.

### ADR-005: Authorization (RBAC) and role model

- **Decision**: ship with two roles:
  1. **Admin**
  2. **PowerUser**
- **Rationale**: keep the role system minimal to avoid early complexity; “Viewer” adds limited value if everyone must be able to run searches and build/curate candidate shortlists.
- **Constraints**
  1. All authenticated users (Admin + PowerUser) can search, curate shortlists, and export within their role permissions.
  2. Admin-only capabilities include user/role management and access to audit log review/reporting.

### ADR-006: Audit logging storage

- **Decision**: store audit events in Postgres as a first-class table (e.g., `audit_event`), queryable in-app for Admins.
- **Event coverage**: authentication/session events, record access, searches, exports, admin/role changes, ingestion/extraction actions, and reconciliation/merge decisions.
- **Rationale**: simplest operational footprint, keeps auditability close to the system of record, and supports evidence review/reporting. If a stronger immutability/export requirement emerges, add append-only export (e.g., periodic signed snapshots) as a later enhancement.

### ADR-007: Search architecture (Postgres-first hybrid)

- **Decision**: implement a hybrid search approach:
  1. **Semantic retrieval** via embeddings stored in Postgres using pgvector.
  2. **Lexical search** via Postgres full-text search (FTS) as fallback and for exact-term scenarios.
  3. **Structured filters** (e.g., Active/Archive, role-based visibility, key fields) applied in SQL.
- **Indexing strategy**: ingestion/extraction updates trigger background jobs to:
  1. update Data Record,
  2. (re)generate embeddings,
  3. update vector + FTS indexes.
- **Rationale**: delivers the “meaning-based wow” while retaining deterministic keyword handling and simple ops within Postgres.

### ADR-008: OCR + extraction provider strategy (pluggable)

- **Decision**: adopt a pluggable provider interface and start with:
  1. **OCR default**: Google Cloud Document AI (or Vision OCR as a fallback) for scanned PDFs and document text extraction.
  2. **Extraction default**: an LLM step that operates on the extracted text to populate/normalize the Data Record, with strict provenance (extracted vs inferred vs user-edited).
  3. **Fallback**: vision-based LLM “read the page” is an optional last resort for difficult scans if compliance/vendor constraints allow.
- **Rationale**: gives predictable ingestion quality and a clean cost model while keeping the system adaptable to compliance constraints and future provider changes.
- **Cost note**: Document AI OCR introduces a distinct per-page processing cost; include it explicitly in estimates and instrument ingestion volume.

### ADR-009: Deployment architecture (default)

- **Decision**: deploy on GCP using:
  1. **Cloud Run** for the Next.js application service
  2. **Cloud Run** for a separate **worker** service (BullMQ workers)
  3. **Cloud SQL for PostgreSQL** as the primary database (with pgvector extension enabled)
  4. **Memorystore for Redis** as the queue/cache backend for BullMQ
- **Rationale**: minimizes operational overhead, cleanly supports async ingestion/indexing, and keeps the stack aligned with GCP-native managed services.
- **Cost notes**
  1. Cloud SQL has a baseline monthly cost (often on the order of tens of dollars/month depending on instance size); include this explicitly in estimates.
  2. Memorystore and Cloud Run also introduce baseline/usage-based costs; monitor and right-size based on the small initial user count.

### ADR-010: API pattern (in-app)

- **Decision**: use Next.js **Route Handlers** for JSON APIs (REST-ish) and use Server Actions selectively where they reduce complexity without obscuring audit/RBAC controls.
- **Constraints**
  1. All sensitive mutations and exports must go through a service layer that enforces RBAC and writes audit events.
  2. API responses should be consistent and typed; errors should use a standard envelope.
- **Rationale**: keeps contracts explicit and testable, makes auditing straightforward, and reduces agent disagreement about data flow patterns.

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2026-02-28_
_For: BMad_
