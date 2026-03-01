# Story 1.3: Add Postgres + Prisma baseline (schema + migrations)

Status: done

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

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — all acceptance criteria are implemented and every completed task is verifiably done with evidence.

### Summary

Story 1.3 successfully establishes the Prisma + Postgres baseline: Prisma schema/models (`User`, `AuditEvent`) with UUID PKs and snake_case mapping, Prisma 7 datasource configuration via `prisma.config.ts`, a Postgres adapter-backed Prisma client, an initial migration under `prisma/migrations/`, and a minimal runtime DB connectivity check at `GET /api/health/db`. Secrets remain uncommitted and are represented only via `DATABASE_URL` placeholder in `.env.example`.

### Key Findings

**HIGH**

- None.

**MEDIUM**

- None.

**LOW**

- `package.json` currently uses caret ranges for Prisma packages; for a compliance-sensitive internal tool you may prefer pinning Prisma-related packages to exact versions to reduce drift. (Evidence: `package.json:14-22`)
- The Prisma client pool uses `DATABASE_URL` and will throw at runtime if unset; consider adding an explicit startup check or a clearer error in the health route later. (Evidence: `src/server/db/prisma.ts:9-16`, `src/app/api/health/db/route.ts:5-8`)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Prisma added and configured to connect via env vars | IMPLEMENTED | `package.json:14-22`, `prisma.config.ts:1-7`, `.env.example:5-7` |
| 2 | `prisma migrate dev` succeeds | IMPLEMENTED | Migration exists and reflects schema: `prisma/migrations/20260228193329_init/migration.sql:1-43` |
| 3 | Schema includes `User` and `AuditEvent` | IMPLEMENTED | `prisma/schema.prisma:19-43` |
| 4 | UUID PKs + snake_case mappings | IMPLEMENTED | `prisma/schema.prisma:20-28`, `prisma/schema.prisma:31-42` |
| 5 | App can connect without committing secrets | IMPLEMENTED | `.gitignore:33-36`, `.env.example:1-17`, `src/app/api/health/db/route.ts:5-8` |

**AC Coverage Summary:** 5 of 5 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| --- | --- | --- | --- |
| Add Prisma and initialize schema | Completed | VERIFIED COMPLETE | `package.json:14-22`, `prisma/schema.prisma:1-43` |
| Define baseline models with UUID + mappings | Completed | VERIFIED COMPLETE | `prisma/schema.prisma:19-43`, `prisma/migrations/20260228193329_init/migration.sql:7-30` |
| Configure `DATABASE_URL` via env and `.env.example` | Completed | VERIFIED COMPLETE | `.env.example:5-7`, `prisma.config.ts:3-7` |
| Create and run first migration | Completed | VERIFIED COMPLETE | `prisma/migrations/20260228193329_init/migration.sql:1-43` |
| Minimal DB connectivity check path | Completed | VERIFIED COMPLETE | `src/app/api/health/db/route.ts:1-8`, `src/server/db/prisma.ts:1-21` |

**Task Summary:** 5 of 5 completed tasks verified, 0 questionable, 0 false completions.

### Test Coverage and Gaps

- This story does not add unit tests, which is acceptable for a baseline schema+migration story; it does include a runtime DB health endpoint for quick validation. (Evidence: `src/app/api/health/db/route.ts:5-8`)
- CI currently runs lint/build but not migrations; consider adding a DB-backed migration check later once CI provisions Postgres. (Evidence: `.github/workflows/ci.yml:17-22`)

### Architectural Alignment

- Matches the architecture’s Postgres + Prisma baseline and target folder placement (`prisma/`, `src/server/db/prisma.ts`). (Evidence: `docs/architecture.md:84-88`, `docs/architecture.md:114-121`, `docs/architecture.md:164-173`)

### Security Notes

- `.env*` is ignored with an explicit allow for `.env.example`; no secrets were introduced. (Evidence: `.gitignore:33-36`, `.env.example:1-17`)

### Best-Practices and References

- Prisma config reference (Prisma 7): `https://www.prisma.io/docs/orm/reference/prisma-config-reference`
- Prisma ORM v7 upgrade guide: `https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7`

### Action Items

**Code Changes Required:**

- None.

**Advisory Notes:**

- Note: Consider pinning Prisma packages to exact versions once the stack is locked for the environment.
