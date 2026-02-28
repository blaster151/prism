# Story 1.3: Add Postgres + Prisma baseline (schema + migrations)

Status: review

## Story

As a developer,  
I want Prisma configured against Postgres with an initial schema baseline,  
so that we can persist users, candidates, and audit events consistently.

## Acceptance Criteria

1. Prisma is added and configured to connect to local Postgres via environment variables.
2. `prisma migrate dev` succeeds.
3. Initial Prisma schema includes at least `User` and `AuditEvent` models.
4. UUID primary keys are used; DB naming uses snake_case via Prisma mappings.
5. App can connect to the database without committing secrets.

## Tasks / Subtasks

- [x] Add Prisma to the repo and initialize `prisma/schema.prisma` (AC: 1, 5)
- [x] Define baseline models (`User`, `AuditEvent`) with UUID PKs and mappings (AC: 3, 4)
- [x] Add local Postgres connection config via env (`DATABASE_URL`) and document in `.env.example` (AC: 1, 5)
- [x] Create and run the first migration; verify `prisma migrate dev` passes in a clean env (AC: 2)
- [x] Add a minimal DB connectivity check path (health check or script) (AC: 5)

## Dev Notes

- The architecture treats Postgres as the system of record with Prisma for schema+migrations.
- Follow the naming and mapping conventions (Prisma model names vs snake_case tables/columns).

### Project Structure Notes

- Prisma files live under `prisma/` as shown in `docs/architecture.md`.

### References

- [Source: docs/epics.md#Story 1.3: Add Postgres + Prisma baseline (schema + migrations)]
- [Source: docs/architecture.md#Decision Summary]
- [Source: docs/architecture.md#Project Structure]
- [Source: docs/architecture.md#Data Architecture]

## Dev Agent Record

### Context Reference

- `docs/stories/1-3-add-postgres-prisma-baseline-schema-migrations.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-02-28:
- Added Prisma ORM and Postgres adapter configuration required by Prisma 7 (`prisma.config.ts` + `@prisma/adapter-pg`).
- Provisioned local Postgres and ran `npx prisma generate` + `npx prisma migrate dev --name init`.
- Verified `npm run lint` and `npm run build` pass after adding DB client wiring.

### Completion Notes List

- ✅ Prisma configured for Postgres via `DATABASE_URL` (no secrets committed).
- ✅ Baseline schema includes `User` and `AuditEvent` with UUID PKs and snake_case mappings.
- ✅ Initial migration created and applied successfully.
- ✅ Minimal DB connectivity check added at `GET /api/health/db`.

### File List

- NEW: `prisma/schema.prisma`
- NEW: `prisma/migrations/20260228193329_init/migration.sql`
- NEW: `prisma.config.ts`
- NEW: `src/server/db/prisma.ts`
- NEW: `src/app/api/health/db/route.ts`
- NEW: `docs/stories/1-3-add-postgres-prisma-baseline-schema-migrations.context.xml`
- MODIFIED: `package.json`
- MODIFIED: `package-lock.json`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/1-3-add-postgres-prisma-baseline-schema-migrations.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented Prisma + Postgres baseline (schema, adapter config, migration, connectivity check); validated lint/build; marked ready for review
