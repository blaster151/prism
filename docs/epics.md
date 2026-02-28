# prism - Epic Breakdown

**Author:** BMad
**Date:** 2026-02-28
**Project Level:** 3
**Target Scale:** small team (~5 power users), high complexity domain

---

## Overview

This document provides the complete epic and story breakdown for prism, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

Proposed epic structure (value-based groupings) and recommended sequencing:

1. **Epic 1 — Foundation: Project Scaffold, Auth/RBAC, Audit Baseline**
   - Establish repo + Next.js scaffold + CI basics
   - Implement NextAuth, role model (Admin/PowerUser), admin user management
   - Create audit logging primitives (`audit_event`) and standard error/logging patterns
   - Set up Cloud Run app+worker deployment skeleton and secrets management approach

2. **Epic 2 — Candidate Data Model + Data Record Editing (Provenance + Versioning)**
   - Define Candidate/DataRecord schema and provenance model (extracted/inferred/userEdited)
   - Build Data Record UI for review/edit with history/provenance indicators
   - Implement lifecycle state (Active/Archive) and RBAC gating for sensitive fields

3. **Epic 3 — Dropbox Integration + Ingestion Pipeline (Jobs, OCR, Extraction)**
   - Integrate Dropbox as source of resume files
   - Implement BullMQ job pipeline: ingest → OCR (Document AI) → extraction → DataRecord update
   - Add job status UI and retry/failure visibility

4. **Epic 4 — Semantic Search + Explainability Experience (Meaning-based “Wow”)**
   - Implement embeddings + pgvector storage, plus Postgres FTS fallback
   - Build ranked search API and UI with evidence-linked “why matched” explanations
   - Support iterative refinement without losing context

5. **Epic 5 — Shortlists: Intent Preservation + Export Outputs (JSON + Human-readable)**
   - Persistent shortlist entity with pin/keep/exclude states
   - Ensure intent persists across refinements and re-ranking
   - Implement controlled exports (RBAC + audit) for shortlist JSON/text outputs

6. **Epic 6 — CEC-formatted Resume Generation + Controlled Export**
   - Generate standardized CEC resume output from Data Records
   - Role-gated export flow with audit logging and (optional) redaction modes

7. **Epic 7 — Reconciliation: Updated/Duplicate Resume Detection + Merge Workflow**
   - Detect likely “same person” resume uploads
   - Provide user-mediated reconciliation/merge with history and provenance preservation

8. **Epic 8 — Observability + Cost Controls**
   - Token/usage monitoring for LLM usage
   - Basic operational dashboards for ingestion/search health and runaway-cost detection

Why this grouping makes sense:

- It starts with a compliance-sensitive foundation (auth/RBAC/audit) so later features are built “audit-ready” by default.
- It isolates the ingestion pipeline and the semantic search “wow” into separate epics to reduce coupling and enable incremental demos.
- It treats shortlists/exports as their own value stream (daily driver) rather than a UI afterthought.

---

## Epic 1: Foundation — Project Scaffold, Auth/RBAC, Audit Baseline

Establish the technical foundation so every subsequent feature is built “audit-ready” by default: Next.js scaffold, Cloud Run deployment skeleton, database/ORM baseline, NextAuth authentication, two-role RBAC (Admin/PowerUser), and an `audit_event` trail.

### Story 1.1: Scaffold the Prism app repo (Next.js baseline)

As a developer,
I want a Next.js TypeScript application scaffolded with the agreed defaults,
So that all subsequent stories build on a consistent foundation.

**Acceptance Criteria:**

**Given** an empty repo for Prism
**When** I scaffold the app using `create-next-app` with TypeScript, ESLint, Tailwind, App Router, and `src/`
**Then** the app runs locally and renders a basic home page

**And** the repository includes `.env.example` and `docs/` (planning docs) committed
**And** the folder structure aligns with `docs/architecture.md` (at least `src/app`, `src/components`, `src/server`, `src/jobs` directories exist)

**Prerequisites:** none

**Technical Notes:** Use the initialization command in `docs/architecture.md`. Keep implementation minimal; do not introduce auth/db yet.

### Story 1.2: Create Cloud Run deployment skeleton (app + worker)

As a developer,
I want Dockerfiles and baseline Cloud Run deployment configuration for the app and worker,
So that we can deploy early and iterate with confidence.

**Acceptance Criteria:**

**Given** the app scaffold exists
**When** I add Dockerfiles for `prism-app` and `prism-worker`
**Then** both images build successfully

**And** there are clear instructions for deploying each as a separate Cloud Run service
**And** environment variables are sourced from secrets/config (not committed)

**Prerequisites:** Story 1.1

**Technical Notes:** Keep deployment config minimal (README + scripts). Worker can be a placeholder process that starts and connects to Redis later.

### Story 1.3: Add Postgres + Prisma baseline (schema + migrations)

As a developer,
I want Prisma configured against Postgres with an initial schema baseline,
So that we can persist users, candidates, and audit events consistently.

**Acceptance Criteria:**

**Given** the app scaffold exists
**When** I add Prisma and connect it to a local Postgres instance
**Then** `prisma migrate dev` succeeds

**And** the repo contains an initial Prisma schema with at least `User` and `AuditEvent` models
**And** the app can connect to the database without leaking secrets into source control

**Prerequisites:** Story 1.1

**Technical Notes:** Use UUID primary keys; map DB tables/columns to snake_case via Prisma mappings per `docs/architecture.md`.

### Story 1.4: Implement NextAuth login (local auth baseline)

As a user,
I want to authenticate into Prism,
So that access to resumes and candidate data is gated behind a login.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I navigate to the app
**Then** I am prompted to sign in

**And** after signing in, I can access the main app pages
**And** authentication state persists across refreshes

**Prerequisites:** Story 1.3

**Technical Notes:** Use NextAuth v4. Keep provider choice simple for internal use (exact provider can be refined later), but ensure the implementation supports role lookup from the DB.

### Story 1.5: Enforce RBAC with two roles (Admin, PowerUser)

As an admin,
I want role-based access control enforced consistently,
So that only authorized users can access admin features and audit logs.

**Acceptance Criteria:**

**Given** a signed-in user with role `POWER_USER`
**When** they attempt to access admin-only routes/APIs
**Then** access is denied with a clear error

**And** a signed-in user with role `ADMIN` can access admin routes/APIs
**And** RBAC is enforced in the service layer (not only in the UI)

**Prerequisites:** Story 1.4

**Technical Notes:** Implement `requireRole` helpers and ensure Route Handlers call service-layer functions that perform RBAC checks.

### Story 1.6: Create audit_event logging primitive

As an admin,
I want sensitive actions to be captured in an audit trail,
So that compliance review and debugging are possible.

**Acceptance Criteria:**

**Given** a signed-in user performs an auditable action (e.g., sign-in, view page, export attempt)
**When** the action occurs
**Then** an `audit_event` record is written in Postgres with actor, type, entity pointer (when applicable), and metadata (non-sensitive)

**And** the system never logs raw resume content or sensitive PII to application logs

**Prerequisites:** Story 1.3, Story 1.5

**Technical Notes:** Implement an `auditLogger` service and standard event types. Prefer writing audit rows in the same transaction as mutations where feasible.

### Story 1.7: Admin UI for user management (minimal)

As an admin,
I want a minimal admin screen to manage users and roles,
So that access can be managed without developer intervention.

**Acceptance Criteria:**

**Given** I am an Admin
**When** I open the Admin screen
**Then** I can view users and set their role to Admin or PowerUser

**And** role changes are audit-logged

**Prerequisites:** Story 1.5, Story 1.6

**Technical Notes:** Keep UX simple; focus on correctness + audit logging.

### Story 1.8: Testing foundation (unit + Playwright E2E)

As a developer,
I want a test framework in place for unit/integration tests and Playwright E2E tests,
So that each subsequent story can ship with automated coverage and we can run an end-to-end regression suite each sprint.

**Acceptance Criteria:**

**Given** the scaffolded Prism repo
**When** I set up unit/integration testing and Playwright
**Then** there is a standard way to run:

- unit/integration tests locally and in CI
- Playwright E2E tests locally (headless) and in CI

**And** the first minimal E2E test validates the auth gate (unauthenticated users are prompted to sign in)
**And** test runs are non-interactive (no “press q to quit” prompts)

**Prerequisites:** Story 1.4

**Technical Notes:** Prefer a lightweight unit test runner; E2E uses Playwright. Future stories should add/extend tests rather than relying on manual verification.

---

## Epic 2: Candidate Data Model + Data Record Editing (Provenance + Versioning)

Deliver the canonical, editable Data Record experience (with provenance and history) so ingestion and search can build on a trustworthy, user-correctable representation of candidate data.

Testing note: stories in this epic must include unit/integration tests for provenance, RBAC gates, and audit logging where applicable; E2E tests will be expanded in later epics once the UI flows exist.

### Story 2.1: Implement core candidate/data models in Prisma

As a developer,
I want the Candidate, ResumeDocument, DataRecord, provenance, and shortlist tables defined,
So that ingestion, search, and exports can build on stable persistence.

**Acceptance Criteria:**

**Given** Prisma is configured
**When** I add the core models and run migrations
**Then** the database schema includes Candidate, ResumeDocument, DataRecord, provenance tracking, Shortlist, and ShortlistItem tables

**And** models align with the high-level architecture data model (provenance, embeddings, lifecycle state)

**Prerequisites:** Story 1.3

**Technical Notes:** Keep room for JSONB extensibility in DataRecord. Add Active/Archive lifecycle state.

### Story 2.2: Candidate list + lifecycle state (Active/Archive)

As a PowerUser,
I want to view candidates and filter by Active/Archive,
So that I can focus on current pipelines while retaining history.

**Acceptance Criteria:**

**Given** candidates exist
**When** I open the Candidates page
**Then** I can see a list of candidates

**And** I can toggle a candidate between Active and Archive (authorized users only)
**And** lifecycle changes are audit-logged

**Prerequisites:** Story 2.1, Story 1.6

**Technical Notes:** Default views should focus on Active candidates.

### Story 2.3: Data Record view/edit with provenance indicators

As a PowerUser,
I want to view and edit a candidate’s structured Data Record with provenance indicators,
So that I can correct extraction errors without losing trust in the data.

**Acceptance Criteria:**

**Given** a candidate has a Data Record
**When** I open the Data Record screen
**Then** I can edit fields and see whether each field is extracted, inferred, or user-edited

**And** edits are attributed and versioned
**And** edits are audit-logged

**Prerequisites:** Story 2.1, Story 1.6

**Technical Notes:** Start with a small set of key fields; allow JSONB for additional fields.

### Story 2.4: Unit tests for Data Record provenance + lifecycle rules

As a developer,
I want automated tests around provenance and lifecycle behavior,
So that future ingestion and search changes do not break correctness or auditability.

**Acceptance Criteria:**

**Given** the Data Record and lifecycle logic exists
**When** I run the unit/integration test suite
**Then** there are tests covering:

- provenance source transitions (`EXTRACTED` → `USER_EDITED`, etc.)
- lifecycle state transitions (Active/Archive)
- RBAC gating for restricted actions
- audit event creation for sensitive mutations

**Prerequisites:** Story 2.2, Story 2.3

**Technical Notes:** These tests should run fast and deterministically; avoid external API calls.

---

## Epic 3: Dropbox Integration + Ingestion Pipeline (Jobs, OCR, Extraction)

Build the end-to-end ingestion pipeline that turns Dropbox resume files (including scanned PDFs) into Data Records via background jobs, with job status visibility and retryability.

### Story 3.1: Configure Redis + BullMQ plumbing (local + env)

As a developer,
I want the queue infrastructure wired up for local development,
So that ingestion and indexing work can run asynchronously via a worker.

**Acceptance Criteria:**

**Given** the Prism repo exists
**When** I configure Redis connection and BullMQ queue definitions
**Then** the app can enqueue a test job and the worker can receive and complete it

**And** failures are retried with backoff
**And** job status is queryable (queued/running/succeeded/failed)

**Prerequisites:** Story 1.1

**Technical Notes:** Use `src/jobs/queues.ts` + `src/jobs/worker.ts`. Keep a minimal “noop” processor for validation.

### Story 3.2: Dropbox client integration (least-privilege)

As a developer,
I want a Dropbox integration client with clear configuration boundaries,
So that Prism can read resume files from the repository securely.

**Acceptance Criteria:**

**Given** Dropbox credentials are configured via environment variables
**When** the system lists a configured Dropbox folder
**Then** it can enumerate resume files and retrieve metadata

**And** access tokens are never logged
**And** Dropbox failures are handled gracefully and audit-logged when user-triggered

**Prerequisites:** Story 1.6

**Technical Notes:** Isolate in `src/server/dropbox/*`. Keep “change detection” approach flexible (polling/webhooks later).

### Story 3.3: Resume ingestion trigger API (enqueue ingest job)

As a PowerUser,
I want to trigger ingestion for a Dropbox path (or the default folder),
So that new/updated resumes can be processed into Data Records.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I call the ingestion trigger endpoint
**Then** an ingestion job is enqueued and I receive a job id

**And** the trigger action is audit-logged

**Prerequisites:** Story 3.1, Story 3.2, Story 1.4

**Technical Notes:** Route handler calls service layer which enqueues job + writes audit event.

### Story 3.4: Job status UI (ingestion pipeline visibility)

As a PowerUser,
I want to see ingestion job status and errors,
So that I can trust the system and recover from failures without guesswork.

**Acceptance Criteria:**

**Given** ingestion jobs exist
**When** I open the ingestion/status screen
**Then** I can see job states (queued/running/succeeded/failed) and basic error info

**And** I can retry failed jobs (authorized users only)
**And** retries are audit-logged

**Prerequisites:** Story 3.3

**Technical Notes:** Keep error details non-sensitive; link to AuditEvent ids when applicable.

### Story 3.5: Document OCR step (Document AI) behind provider interface

As a developer,
I want an OCR provider interface with a Document AI implementation,
So that scanned PDFs can be converted to text in a pluggable way.

**Acceptance Criteria:**

**Given** a scanned PDF resume is ingested
**When** the OCR job runs
**Then** OCR text output is produced and stored/associated with the ResumeDocument

**And** provider calls are isolated behind `src/server/ocr/provider.ts`
**And** failures are retried and surfaced in job status

**Prerequisites:** Story 3.1, Story 3.2

**Technical Notes:** Instrument per-page costs/usage counters for estimates; do not log raw document content.

### Story 3.6: Extraction step (LLM over extracted text) with provenance staging

As a PowerUser,
I want extracted text converted into structured Data Record fields with provenance,
So that I can review/edit and the system never silently overwrites factual data.

**Acceptance Criteria:**

**Given** OCR text is available
**When** extraction runs
**Then** a Data Record is created/updated with field provenance (`EXTRACTED` vs `INFERRED`)

**And** any suggested changes to “factual” fields are staged for explicit user confirmation
**And** extraction actions are audit-logged

**Prerequisites:** Story 3.5, Story 2.3

**Technical Notes:** Keep extraction deterministic where possible via schemas; store the model name/version for traceability.

### Story 3.7: Index update job (embeddings + FTS) on record changes

As a PowerUser,
I want newly ingested/updated candidates to appear in search quickly,
So that the meaning-based discovery loop stays current.

**Acceptance Criteria:**

**Given** a Data Record is created or edited
**When** indexing jobs run
**Then** embeddings and FTS indexes are updated for that candidate

**And** indexing is idempotent and retryable

**Prerequisites:** Story 3.6

**Technical Notes:** Store embeddings in pgvector; support re-embedding when model changes.

### Story 3.8: Playwright E2E — ingest trigger → status visible

As a developer,
I want an end-to-end test covering ingestion triggering and status visibility,
So that the async pipeline is regression-tested.

**Acceptance Criteria:**

**Given** a signed-in test user
**When** the user triggers ingestion in the UI
**Then** a job appears in the status view and reaches a terminal state (success or known failure)

**Prerequisites:** Story 3.4

**Technical Notes:** Use test doubles/mocks for Dropbox and OCR in CI to avoid external dependencies.

---

## Epic 4: Semantic Search + Explainability Experience (Meaning-based “Wow”)

Deliver the core “wow”: meaning-based ranked candidate results with evidence-linked explanations, plus iterative refinement that preserves context and user intent.

### Story 4.1: Define embedding strategy and data plumbing (pgvector + model metadata)

As a developer,
I want the embedding and storage strategy implemented with model metadata,
So that semantic search can be built and later re-embedded safely.

**Acceptance Criteria:**

**Given** candidate Data Records exist
**When** I implement the embedding storage and model metadata fields
**Then** each candidate can have a stored embedding vector with `embedding_model` and `embedding_version`

**And** embeddings can be regenerated without breaking references

**Prerequisites:** Story 3.6

**Technical Notes:** Use pgvector in Postgres; store vectors and metadata in an `Embedding` model/table.

### Story 4.2: Implement embedding generation service (LLM provider pluggable)

As a developer,
I want a provider-based embedding generation service,
So that we can swap embedding providers if compliance/vendor constraints change.

**Acceptance Criteria:**

**Given** a candidate Data Record
**When** the embedding service is called
**Then** an embedding is generated deterministically for the same input (within provider limits)

**And** provider configuration is isolated behind an interface

**Prerequisites:** Story 4.1

**Technical Notes:** Do not log raw PII; record provider/model identifiers for traceability.

### Story 4.3: Build hybrid search API (pgvector + Postgres FTS + filters)

As a PowerUser,
I want to search candidates using natural language and filters,
So that I can quickly discover relevant candidates.

**Acceptance Criteria:**

**Given** embeddings and FTS indexes exist
**When** I call the search endpoint with a query and lifecycle filter
**Then** results are returned ranked by semantic relevance

**And** exact-term scenarios can be handled via lexical fallback
**And** results are filtered appropriately (e.g., default to Active)

**Prerequisites:** Story 3.7, Story 4.2, Story 2.2

**Technical Notes:** Implement in service layer (`hybridSearch`) and expose via Route Handler.

### Story 4.4: Search UI — results list with rank + explanation summary

As a PowerUser,
I want a search screen that shows ranked results with explanation summaries,
So that I can iterate quickly without opening every resume.

**Acceptance Criteria:**

**Given** I am signed in
**When** I submit a search query
**Then** I see a ranked results list with scores and a concise explanation summary per candidate

**And** I can click to expand explanation details

**Prerequisites:** Story 4.3

**Technical Notes:** Keep UI simple; focus on speed and clarity.

### Story 4.5: Evidence-linked explainability (Data Record fields + resume spans)

As a PowerUser,
I want explanations that link to concrete evidence,
So that I can trust “why matched” and catch incorrect inferences.

**Acceptance Criteria:**

**Given** a ranked result explanation is shown
**When** I expand it
**Then** I see an evidence list referencing Data Record fields and/or resume text spans

**And** the system does not claim evidence it cannot point to
**And** explanation generation is audit-logged (non-sensitive metadata only)

**Prerequisites:** Story 4.4, Story 2.3, Story 1.6

**Technical Notes:** Explanations must be grounded; avoid hallucinated claims.

### Story 4.6: Iterative refinement (context preserved across prompts)

As a PowerUser,
I want to refine searches iteratively without losing context,
So that I can converge on the best shortlist quickly.

**Acceptance Criteria:**

**Given** I performed a search
**When** I submit a refinement prompt
**Then** the system interprets it in context of the prior query and returns updated results

**And** the UI clearly shows current query context and applied filters

**Prerequisites:** Story 4.3

**Technical Notes:** Store refinement state in a Shortlist context or server-side session record; do not depend on client-only state.

### Story 4.7: Unit/integration tests for hybrid search + explainability grounding

As a developer,
I want automated tests for search and explainability grounding,
So that regressions don’t silently degrade trust or coverage.

**Acceptance Criteria:**

**Given** test fixtures for candidates and records
**When** I run unit/integration tests
**Then** tests verify:

- hybrid search returns deterministic ordering on fixture data
- Active/Archive filtering behaves as expected
- explainability evidence references only existing fields/spans

**Prerequisites:** Story 4.5

**Technical Notes:** Avoid external provider calls; use stubs for embeddings/explanations in CI.

### Story 4.8: Playwright E2E — search returns ranked results with explanations

As a developer,
I want an end-to-end test for the search experience,
So that the core “wow” loop is regression-tested.

**Acceptance Criteria:**

**Given** a signed-in test user and fixture candidates
**When** the user runs a search
**Then** the UI displays ranked results and explanation summaries

**And** expanding a result shows evidence-linked explanation details

**Prerequisites:** Story 4.4, Story 4.5

**Technical Notes:** Use seeded fixture data; keep runtime stable and headless.

---

## Epic 5: Shortlists — Intent Preservation + Export Outputs (JSON + Human-readable)

Deliver the daily driver workflow: build a shortlist, preserve user intent (pin/keep/exclude) across refinements, and export shareable outputs with RBAC + audit logging.

### Story 5.1: Shortlist persistence service (create/read/update)

As a PowerUser,
I want a persisted shortlist entity with query context,
So that I can return to and refine the same shortlist over time.

**Acceptance Criteria:**

**Given** I am signed in
**When** I create a shortlist
**Then** it is saved with an owner, name, and query context

**And** I can retrieve and update it later

**Prerequisites:** Story 2.1, Story 4.6

**Technical Notes:** Use Postgres tables `Shortlist` + `ShortlistItem`. Audit-log create/update.

### Story 5.2: Shortlist UI (create + view)

As a PowerUser,
I want to create and view shortlists in the UI,
So that I can manage candidate stacks during daily work.

**Acceptance Criteria:**

**Given** shortlists exist
**When** I open the Shortlists page
**Then** I can create a new shortlist and open an existing one

**Prerequisites:** Story 5.1

### Story 5.3: Curation actions (pin/keep/exclude)

As a PowerUser,
I want one-click curation actions on candidates,
So that I can assemble a high-quality shortlist quickly.

**Acceptance Criteria:**

**Given** a shortlist search result set
**When** I pin/keep/exclude a candidate
**Then** the shortlist item state is persisted

**And** the UI reflects the state immediately
**And** the action is audit-logged

**Prerequisites:** Story 5.2, Story 1.6

### Story 5.4: Intent persistence across refinements and re-ranking

As a PowerUser,
I want curated decisions to persist across refinements,
So that the model never “undos” my work.

**Acceptance Criteria:**

**Given** I pinned/kept/excluded candidates
**When** I refine the query and results re-rank
**Then** pinned/kept/excluded states persist and are respected in the view

**Prerequisites:** Story 5.3, Story 4.6

**Technical Notes:** Treat pinned/excluded as constraints; do not allow ranking logic to override them.

### Story 5.5: Shortlist export (JSON + human-readable) with RBAC + audit

As a PowerUser,
I want to export a curated shortlist,
So that I can share results with stakeholders.

**Acceptance Criteria:**

**Given** a shortlist exists
**When** I export it as JSON or text
**Then** I receive a downloadable output

**And** export is RBAC-gated and audit-logged
**And** exported content respects any role-based field visibility rules

**Prerequisites:** Story 5.4, Story 1.5, Story 1.6

### Story 5.6: Playwright E2E — curation persists + export works

As a developer,
I want an end-to-end test covering curation persistence and export,
So that the daily driver workflow is regression-tested.

**Acceptance Criteria:**

**Given** a signed-in test user
**When** the user pins/excludes candidates and refines the query
**Then** curation states persist

**And** exporting the shortlist produces an output artifact

**Prerequisites:** Story 5.5

**Technical Notes:** Use seeded fixtures; stub external dependencies.

---

## Epic 6: CEC-formatted Resume Generation + Controlled Export

Generate standardized CEC resumes from Data Records and export them via controlled, audit-logged pathways.

### Story 6.1: Implement CEC resume template renderer (from Data Record)

As a PowerUser,
I want a standardized CEC resume generated from a Data Record,
So that resumes are consistent and fast to produce.

**Acceptance Criteria:**

**Given** a candidate Data Record exists
**When** I generate a CEC resume
**Then** a document is produced that follows the expected CEC layout

**And** missing fields are handled gracefully with clear placeholders (not silent omission)

**Prerequisites:** Story 2.3

### Story 6.2: Controlled export endpoint for CEC resumes (RBAC + audit)

As a PowerUser,
I want to export a CEC resume through a controlled pathway,
So that access is gated and auditable.

**Acceptance Criteria:**

**Given** I have permission to export
**When** I request a CEC resume export
**Then** I receive a downloadable artifact

**And** the export is audit-logged

**Prerequisites:** Story 6.1, Story 1.5, Story 1.6

### Story 6.3: UI action to generate/export CEC resume

As a PowerUser,
I want an obvious UI action to generate/export a CEC resume,
So that the workflow is discoverable and fast.

**Acceptance Criteria:**

**Given** I am viewing a candidate
**When** I click “Generate CEC Resume”
**Then** the system produces an export and shows progress/status

**Prerequisites:** Story 6.2

### Story 6.4: Unit tests for resume renderer + export gating

As a developer,
I want automated tests for resume generation and export RBAC,
So that formatting and access rules remain stable.

**Acceptance Criteria:**

**Given** renderer inputs and RBAC fixtures
**When** I run tests
**Then** tests validate:

- renderer output structure for representative records
- RBAC gating blocks unauthorized exports
- export actions write audit events

**Prerequisites:** Story 6.2

### Story 6.5: Playwright E2E — generate/export CEC resume

As a developer,
I want an end-to-end test for CEC resume export,
So that the workflow remains stable sprint-to-sprint.

**Acceptance Criteria:**

**Given** a signed-in test user and a candidate record
**When** the user generates a CEC resume
**Then** an export artifact is produced and available to download

**Prerequisites:** Story 6.3

---

## Epic 7: Reconciliation — Updated/Duplicate Resume Detection + Merge Workflow

Prevent duplicated candidates and preserve history when new resumes arrive for an existing person.

### Story 7.1: Implement duplicate/updated resume detection heuristic

As a PowerUser,
I want Prism to detect likely “same person” resume uploads,
So that duplicates don’t silently fragment candidate history.

**Acceptance Criteria:**

**Given** a new resume is ingested
**When** the system processes it
**Then** it can flag likely duplicates based on configurable heuristics (e.g., email/name+history similarity)

**And** the system stores a reconciliation suggestion with confidence indicators

**Prerequisites:** Story 3.6

### Story 7.2: Reconciliation review UI (human-mediated)

As a PowerUser,
I want to review reconciliation suggestions,
So that I can confirm merges safely.

**Acceptance Criteria:**

**Given** a reconciliation suggestion exists
**When** I open the reconciliation view
**Then** I can compare the two records/resumes and accept or reject the merge

**And** the decision is audit-logged

**Prerequisites:** Story 7.1, Story 1.6

### Story 7.3: Merge workflow preserving provenance/version history

As a PowerUser,
I want merges to preserve history and provenance,
So that we never lose track of what changed and why.

**Acceptance Criteria:**

**Given** I accept a merge
**When** the merge is applied
**Then** the system preserves prior resume documents and record versions

**And** the canonical candidate record is updated without silent overwrites

**Prerequisites:** Story 7.2, Story 2.3

### Story 7.4: Tests for reconciliation detection + merge invariants

As a developer,
I want automated tests for reconciliation,
So that data integrity is preserved as ingestion evolves.

**Acceptance Criteria:**

**Given** reconciliation fixtures
**When** I run tests
**Then** tests verify:

- detection flags likely duplicates as expected
- merge preserves provenance and history
- audit events are written for merge decisions

**Prerequisites:** Story 7.3

---

## Epic 8: Observability + Cost Controls

Provide enough instrumentation to keep AI usage predictable and make ingestion/search operationally trustworthy.

### Story 8.1: Implement token/usage tracking for LLM calls

As an admin,
I want LLM usage and token consumption tracked,
So that operating costs are visible and controllable.

**Acceptance Criteria:**

**Given** the system performs embedding/extraction/explanation calls
**When** those calls execute
**Then** usage counters are recorded with metadata (model name, operation type, timestamp)

**And** no raw PII is stored in usage records

**Prerequisites:** Story 3.6, Story 4.2, Story 4.5

### Story 8.2: Operational job metrics (ingestion pipeline health)

As an admin,
I want visibility into job throughput and failure rates,
So that pipeline issues are detected quickly.

**Acceptance Criteria:**

**Given** ingestion jobs run
**When** jobs succeed or fail
**Then** basic counters and recent failures are visible to admins

**Prerequisites:** Story 3.4

### Story 8.3: Admin dashboard for usage + job health + guardrails

As an admin,
I want a simple dashboard view,
So that I can spot runaway costs or failures without digging in logs.

**Acceptance Criteria:**

**Given** usage and job metrics exist
**When** I open the Admin dashboard
**Then** I can see recent token usage summaries and job health summaries

**And** I can configure basic guardrails (e.g., daily token budget warning threshold)

**Prerequisites:** Story 8.1, Story 8.2, Story 1.7

### Story 8.4: Tests for usage tracking + dashboard RBAC

As a developer,
I want automated tests for cost/observability plumbing,
So that RBAC and tracking remain stable.

**Acceptance Criteria:**

**Given** tracking and dashboard logic exists
**When** I run tests
**Then** tests validate:

- usage events are recorded for operations
- dashboard endpoints are Admin-only
- guardrail settings persist and do not leak PII

**Prerequisites:** Story 8.3

---

## Epic Breakdown Summary

This epic/story plan is ready to drive implementation in small, testable increments:

1. Epic 1 establishes the repo, auth/RBAC, audit baseline, deployment skeleton, and testing foundation.
2. Epics 2–3 build the canonical Data Record + ingestion pipeline.
3. Epics 4–5 deliver the primary daily value loop (meaning-based search + intent-preserving shortlists + exports).
4. Epics 6–7 add standardized resume outputs and reconciliation for data integrity.
5. Epic 8 adds the observability and cost controls needed for predictable operations.

_For implementation: Use the `create-story` workflow to generate individual story files in `docs/stories/` from this epic breakdown._
