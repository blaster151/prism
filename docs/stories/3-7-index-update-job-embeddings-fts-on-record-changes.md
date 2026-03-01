# Story 3.7: Index update job (embeddings + FTS) on record changes

Status: drafted

## Story

As a PowerUser,  
I want newly ingested/updated candidates to appear in search quickly,  
so that the meaning-based discovery loop stays current.

## Acceptance Criteria

1. Given a Data Record is created or edited, when indexing jobs run, then embeddings and FTS indexes are updated for that candidate.
2. Indexing is idempotent and retryable.

## Tasks / Subtasks

- [ ] Add indexing job processor triggered on DataRecord changes (AC: 1)
- [ ] Implement embedding update path (pgvector later; store model/version metadata) (AC: 1)
- [ ] Implement lexical/FTS update path as applicable (AC: 1)
- [ ] Ensure jobs are idempotent and retryable with backoff (AC: 2)
- [ ] Add tests with mocks/stubs (AC: 1-2)

## Dev Notes

- Store embeddings in pgvector; support re-embedding when model changes.

### References

- [Source: docs/epics.md#Story 3.7: Index update job (embeddings + FTS) on record changes]
- [Source: docs/architecture.md#Search architecture (Postgres-first hybrid)]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-03-01: Draft created

