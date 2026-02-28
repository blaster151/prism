# Epic Technical Specification: Epic 1 — Foundation (Project Scaffold, Auth/RBAC, Audit Baseline)

Date: 2026-02-28
Author: BMad
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the audit-ready foundation for Prism: a Next.js + TypeScript web app scaffold, deployment skeleton (Cloud Run app + worker), Postgres + Prisma baseline, NextAuth authentication, two-role RBAC (Admin/PowerUser), an `audit_event` trail, a minimal Admin user-management UI, and the initial testing foundation (unit/integration + Playwright E2E). This epic is the prerequisite for all ingestion/search/shortlist/resume-output work because it defines identity, access, and traceability primitives.

## Objectives and Scope

### In-scope

- Scaffold the Prism Next.js app with agreed defaults (TypeScript, ESLint, Tailwind, App Router, `src/`).
- Establish repo structure consistent with the architecture (create baseline `src/app`, `src/components`, `src/server`, `src/jobs` directories).
- Create Cloud Run deployment skeleton for two services:
  - `prism-app`: Next.js web app
  - `prism-worker`: background worker placeholder (queue wiring comes later)
- Add Postgres + Prisma baseline:
  - initial schema + migrations
  - baseline models: `User`, `AuditEvent`
  - snake_case DB mapping conventions
- Implement authentication using NextAuth v4.
- Implement RBAC with two roles: `ADMIN`, `POWER_USER`, enforced in the service layer.
- Implement audit logging primitive (`audit_event`) and an `auditLogger` service.
- Provide a minimal Admin UI to manage users and roles, with audit logging for role changes.
- Establish test foundations:
  - unit/integration test runner (selected and wired for CI)
  - Playwright E2E (headless CI) with a minimal auth-gate test

### Out-of-scope (deferred to later epics)

- Dropbox ingestion, OCR, extraction, background job pipeline (Epic 3).
- Candidate/DataRecord models beyond what’s required for auth/admin/audit (Epic 2+).
- Semantic search, embeddings, explainability UI (Epic 4).
- Shortlists, exports, CEC resume generation, reconciliation, observability dashboards (Epics 5–8).

## System Architecture Alignment

- **Core stack**: Next.js (App Router) + TypeScript + Tailwind CSS; Postgres as system of record; Prisma ORM; NextAuth for auth; RBAC + audit logging in the service layer.
- **Service boundaries**: single repo deployed as two Cloud Run services (app + worker).
- **Layering constraints**: Route Handlers / UI must call `src/server/*` services (no direct DB access from UI).
- **Security posture**: audit-ready by default (RBAC + audit events; no PII in app logs).

## Detailed Design

### Services and Modules

| Module / Path (target) | Responsibility | Inputs | Outputs |
| --- | --- | --- | --- |
| `src/server/db/prisma.ts` | Prisma client initialization | `DATABASE_URL` | Prisma client |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth route handler | provider config, callbacks | auth sessions |
| `src/server/auth/rbac.ts` | role definitions + helpers | user/session | allow/deny decisions |
| `src/server/auth/requireRole.ts` | enforce RBAC at service entrypoints | required role, user | throws AppError / returns |
| `src/server/audit/auditLogger.ts` | write `audit_event` records | actor, type, entity ref, metadata | persisted audit event id |
| `src/server/audit/eventTypes.ts` | central event type constants | n/a | event type strings |
| `src/app/(app)/admin/page.tsx` | Admin UI for user/role management | Admin session | role updates UI |
| `src/app/api/admin/users/route.ts` (or similar) | user list + role update endpoints | Admin session, payload | user list / update result |
| `docker/Dockerfile.app` | build/run container for web app | repo | container image |
| `docker/Dockerfile.worker` | build/run container for worker | repo | container image |

### Data Models and Contracts

#### `User`

- **Purpose**: authenticate and authorize access; support Admin role management.
- **Fields (minimum)**:
  - `id`: UUID
  - `email`: string (unique)
  - `role`: enum (`ADMIN` | `POWER_USER`)
  - `status`: enum (`ACTIVE` | `DISABLED`) (optional but recommended for admin control)
  - `created_at`, `updated_at`

#### `AuditEvent` (`audit_event`)

- **Purpose**: append-only record of sensitive activity (auth/admin/actions); foundation for later audit requirements.
- **Fields (minimum)**:
  - `id`: UUID
  - `actor_user_id`: UUID (nullable for system events)
  - `event_type`: string
  - `entity_type`: string (nullable)
  - `entity_id`: UUID/string (nullable)
  - `metadata`: JSONB (non-sensitive)
  - `created_at`: timestamp

#### Conventions

- Prisma model names: PascalCase; DB tables/columns: snake_case via `@@map` / `@map`.
- Primary keys: UUID.

### APIs and Interfaces

#### Authentication

- NextAuth route handler at `src/app/api/auth/[...nextauth]/route.ts` provides sign-in/out and session handling.
- Session callback must surface `user.id` and `user.role` for RBAC enforcement.

#### Admin user management (minimal contract)

The epic requires Admins to view users and change roles. A minimal REST-ish API (Route Handlers) is sufficient:

- `GET /api/admin/users`
  - Response: `{ data: { users: Array<{ id, email, role, status }> } }`
- `PATCH /api/admin/users/{id}/role`
  - Request: `{ role: "ADMIN" | "POWER_USER" }`
  - Response: `{ data: { user: { id, role } } }`
  - Side effects: write `audit_event` for role change

#### Audit logging interface (service)

`auditLogger.log(event)`:

- Inputs: `{ actorUserId?, eventType, entityType?, entityId?, metadata }`
- Output: `{ auditEventId }`

### Workflows and Sequencing

Recommended build order within Epic 1 (matches story prerequisites):

1. 1.1 Scaffold app (creates baseline structure)
2. 1.2 Deployment skeleton (Dockerfiles + Cloud Run instructions)
3. 1.3 Postgres + Prisma baseline (User + AuditEvent)
4. 1.4 NextAuth login (persisted users)
5. 1.5 RBAC helpers + enforcement pattern
6. 1.6 Audit logging primitive (service + schema)
7. 1.7 Admin UI for user management (RBAC + audit)
8. 1.8 Testing foundation (unit + Playwright E2E, headless CI)

## Non-Functional Requirements

### Performance

- App scaffold and CI should complete quickly; avoid heavyweight dependencies in Epic 1.
- Auth gate and Admin actions must respond in a typical “internal app” latency band (no explicit SLA yet).

### Security

- Auth required for app features; Admin-only routes enforced via RBAC in service layer.
- Secrets never committed; env vars defined via `.env.example`.
- Application logs must not contain raw resume content or sensitive PII (future-proofing).
- TLS/HTTPS is required before any non-local environment with real user logins (local-only milestones may defer).

### Reliability/Availability

- Migrations must be repeatable; app should fail fast and clearly if required env vars are missing.
- Worker service may be a placeholder but should start deterministically.

### Observability

- Define consistent error envelope patterns and audit event taxonomy early (so later epics can extend, not replace).
- Ensure audit events exist for: auth activity and admin role changes (at minimum).

## Dependencies and Integrations

Planned dependencies for this epic (versions from `docs/architecture.md`), noting the app scaffold does not yet exist in this repository:

- Node.js (LTS), Next.js, React, TypeScript, Tailwind CSS
- NextAuth.js v4
- PostgreSQL + Prisma ORM
- Docker (for Cloud Run images)
- Playwright (E2E)
- Unit/integration test runner (to be selected in Story 1.8)

External integrations in Epic 1:

- Cloud Run deployment skeleton (no runtime dependency on GCP APIs required for local dev)

## Acceptance Criteria (Authoritative)

1. The repository can be scaffolded as a Next.js app with TypeScript, ESLint, Tailwind, App Router, and `src/` layout.
2. Baseline directories exist to match the architecture structure (`src/app`, `src/components`, `src/server`, `src/jobs`).
3. Dockerfiles exist for app and worker and both images build successfully.
4. Deployment instructions exist for two Cloud Run services (app + worker) and no secrets are committed.
5. Prisma is configured against Postgres; migrations apply cleanly; baseline schema includes `User` and `AuditEvent`.
6. Unauthenticated users are gated; authenticated users can access main pages; sessions persist across refreshes.
7. RBAC enforces Admin-only routes/APIs and is enforced in the service layer.
8. Audit events are written for sensitive actions with safe metadata; application logs avoid sensitive PII.
9. Admin UI allows viewing users and changing roles; changes are audit-logged.
10. Unit/integration tests and Playwright E2E can be run locally and in CI; first E2E validates auth gate; runs are non-interactive.

## Traceability Mapping

| AC # | Story source | Spec section | Primary components | Test idea |
| --- | --- | --- | --- | --- |
| 1 | 1.1 | Overview; Detailed Design | app scaffold | CI: build succeeds; app boots locally |
| 2 | 1.1 | Detailed Design; Architecture Alignment | repo structure | Assert directories exist; lint/build ok |
| 3 | 1.2 | Deployment skeleton | `docker/*` | Docker build for both images |
| 4 | 1.2 | Security; Dependencies | `.env.example`, docs | Ensure no secrets committed; docs exist |
| 5 | 1.3 | Data Models | `prisma/schema.prisma` | `prisma migrate dev` in CI |
| 6 | 1.4 | APIs/Interfaces | NextAuth route | Playwright: unauth → sign-in |
| 7 | 1.5 | Services/Modules | `requireRole` usage | Unit tests for RBAC helper |
| 8 | 1.6 | NFR Security; Observability | `auditLogger` | Integration test: audit row written |
| 9 | 1.7 | Admin API/UI | admin page + routes | Integration: role update logs audit |
| 10 | 1.8 | Test strategy | test tooling | CI: unit + e2e headless pass |

## Risks, Assumptions, Open Questions

- **Assumption**: The initial Prism app scaffold does not yet exist in this repository; Story 1.1 will create it.
- **Risk**: Test runner choice in Story 1.8 may cause churn if changed later; select a stable, CI-friendly default early.
- **Question**: Auth provider details (SSO vs local) may change; keep boundaries so providers can swap without RBAC/audit redesign.
- **Risk**: Cloud Run deployment details may vary by org constraints (VPC access, Cloud SQL connectivity); keep docs minimal and adaptable.
- **Assumption**: RBAC remains two roles (Admin, PowerUser) for the initial delivery.

## Test Strategy Summary

- **Unit tests**: RBAC helpers (`requireRole`) and audit logger behavior (writes correct event types/metadata).
- **Integration tests**: Admin role update writes audit event; Prisma migrations apply; NextAuth session includes role.
- **E2E tests (Playwright)**: auth gate (unauthenticated users are prompted to sign in).
- **CI**: non-interactive test commands (no watch mode); build/lint step included.

## Post-Review Follow-ups

- Story 1.2: Add CI image builds for `docker/Dockerfile.app` and `docker/Dockerfile.worker` so “images build successfully” is continuously verified. [Source: docs/stories/1-2-create-cloud-run-deployment-skeleton-app-worker.md#Senior Developer Review (AI)]
- Story 1.2: Clarify README deployment flow to explicitly cover Dockerfile-based build+deploy (or call out that `--source` uses buildpacks). [Source: docs/stories/1-2-create-cloud-run-deployment-skeleton-app-worker.md#Senior Developer Review (AI)]
