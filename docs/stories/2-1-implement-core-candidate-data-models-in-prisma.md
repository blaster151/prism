# Story 2.1: Implement core candidate/data models in Prisma

Status: drafted

## Story

As a developer,  
I want the Candidate, ResumeDocument, DataRecord, provenance, and shortlist tables defined,  
so that ingestion, search, and exports can build on stable persistence.

## Acceptance Criteria

1. Database schema includes Candidate, ResumeDocument, DataRecord, provenance tracking, Shortlist, and ShortlistItem tables/models.
2. Models align with the architecture data model (lifecycle state, provenance, embeddings placeholder/compatibility).
3. Migrations apply cleanly via Prisma.

## Tasks / Subtasks

- [ ] Extend Prisma schema with Candidate, ResumeDocument, DataRecord, Shortlist, ShortlistItem models (AC: 1, 2, 3)
- [ ] Add lifecycle state enum/field on Candidate (AC: 2)
- [ ] Add provenance structure for DataRecord fields (table or structured representation aligned to architecture) (AC: 2)
- [ ] Add mappings for snake_case tables/columns and UUID PKs (AC: 2)
- [ ] Run `prisma migrate dev` and verify clean apply on a fresh DB (AC: 3)
- [ ] Add minimal unit/integration tests for schema invariants (e.g., required relations) (AC: 1, 3)

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

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
