# Story 2.1: Implement core candidate/data models in Prisma

Status: done

## Story

As a developer,  
I want the Candidate, ResumeDocument, DataRecord, provenance, and shortlist tables defined,  
so that ingestion, search, and exports can build on stable persistence.

## Acceptance Criteria

1. Database schema includes Candidate, ResumeDocument, DataRecord, provenance tracking, Shortlist, and ShortlistItem tables/models.
2. Models align with the architecture data model (lifecycle state, provenance, embeddings placeholder/compatibility).
3. Migrations apply cleanly via Prisma.

## Tasks / Subtasks

- [x] Extend Prisma schema with Candidate, ResumeDocument, DataRecord, Shortlist, ShortlistItem models (AC: 1, 2, 3)
- [x] Add lifecycle state enum/field on Candidate (AC: 2)
- [x] Add provenance structure for DataRecord fields (table or structured representation aligned to architecture) (AC: 2)
- [x] Add mappings for snake_case tables/columns and UUID PKs (AC: 2)
- [x] Run `prisma migrate dev` and verify clean apply on a fresh DB (AC: 3)
- [x] Add minimal unit/integration tests for schema invariants (e.g., required relations) (AC: 1, 3)

## Dev Notes

- Keep room for JSONB extensibility in DataRecord while still modeling key fields explicitly.
- Maintain “provenance is modeled, not implied” and avoid any silent overwrite assumptions.

### Project Structure Notes

- Prisma schema and migrations live under `prisma/` per `docs/architecture.md`.

### References

- [Source: docs/epics.md#Story 2.1: Implement core candidate/data models in Prisma]
- [Source: docs/architecture.md#Data Architecture]
- [Source: docs/architecture.md#Consistency Rules]

## Dev Agent Record

### Context Reference

- `docs/stories/2-1-implement-core-candidate-data-models-in-prisma.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-02-28:
- Extended Prisma schema with Epic 2 core models and enums; added migration `20260228223002_epic2_core_models`.
- Applied migration locally via `npx prisma migrate dev --name epic2_core_models`.
- Added minimal schema invariant test for enum presence.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

- ✅ Core models added: Candidate, ResumeDocument, DataRecord, DataRecordFieldProvenance, Embedding (placeholder), Shortlist, ShortlistItem.
- ✅ Candidate lifecycle state + provenance enums are modeled explicitly.
- ✅ Migrations apply cleanly.
- ✅ Minimal tests guard enum invariants.

### File List

- NEW: `prisma/migrations/20260228223002_epic2_core_models/migration.sql`
- NEW: `docs/stories/2-1-implement-core-candidate-data-models-in-prisma.context.xml`
- NEW: `src/server/db/schemaInvariants.test.ts`
- MODIFIED: `prisma/schema.prisma`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/2-1-implement-core-candidate-data-models-in-prisma.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented Epic 2 core Prisma models + migration; added schema invariant test; validated test/lint/build; marked ready for review
- 2026-02-28: Code review approved; marked done

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — core Epic 2 persistence models are in place, migrations apply cleanly, and provenance/lifecycle are explicitly modeled.

### Summary

Story 2.1 extends `prisma/schema.prisma` with the core data model needed for Epic 2+: `Candidate` (with lifecycle state), `ResumeDocument`, `DataRecord` (JSONB fields), `DataRecordFieldProvenance` (explicit per-field provenance and attribution pointers), `Shortlist`/`ShortlistItem`, and an `Embedding` placeholder for later pgvector adoption. All tables use UUID PKs and snake_case mappings. A migration is created and applied, and a small unit test guards the presence of key enums so later changes don’t silently remove trust primitives.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Schema includes Candidate/ResumeDocument/DataRecord/provenance/Shortlist/ShortlistItem | IMPLEMENTED | `prisma/schema.prisma`, `prisma/migrations/20260228223002_epic2_core_models/migration.sql` |
| 2 | Aligns with architecture (lifecycle + provenance + embeddings placeholder) | IMPLEMENTED | `prisma/schema.prisma`, `docs/architecture.md#Data Architecture` |
| 3 | Migrations apply cleanly | IMPLEMENTED | Migration present + applied via `prisma migrate dev` |

