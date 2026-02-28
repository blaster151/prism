# Story 2.3: Data Record view/edit with provenance indicators

Status: ready-for-dev

## Story

As a PowerUser,  
I want to view and edit a candidate’s structured Data Record with provenance indicators,  
so that I can correct extraction errors without losing trust in the data.

## Acceptance Criteria

1. Data Record screen shows a candidate’s structured record.
2. Users can edit fields.
3. Each field displays provenance (extracted vs inferred vs user-edited).
4. Edits are attributed and versioned.
5. Edits are audit-logged.

## Tasks / Subtasks

- [ ] Implement Data Record view page and service to load candidate record (AC: 1)
- [ ] Implement edit flow for a small initial set of key fields, with extensibility for JSONB fields (AC: 2)
- [ ] Display provenance indicators per field (AC: 3)
- [ ] Implement attribution/versioning model for edits (record version or per-field history, aligned to architecture) (AC: 4)
- [ ] Enforce RBAC on edits in the service layer (AC: 2)
- [ ] Audit-log edits with safe metadata (no raw resume content) (AC: 5)
- [ ] Add integration tests for editing + provenance transitions + audit log write (AC: 2, 3, 4, 5)

## Dev Notes

- “AI never silently overwrites factual data” implies a clear separation between extracted/inferred values and user-edited overrides; model provenance explicitly.
- Keep the first UI iteration small and correct; expand field coverage later.

### Project Structure Notes

- UI belongs under `src/app/` and business logic under `src/server/` per the architecture patterns.

### References

- [Source: docs/epics.md#Story 2.3: Data Record view/edit with provenance indicators]
- [Source: docs/PRD.md#User trust (non-negotiable quality bar)]
- [Source: docs/architecture.md#Implementation Patterns]
- [Source: docs/architecture.md#Data Architecture]

## Dev Agent Record

### Context Reference

- `docs/stories/2-3-data-record-view-edit-with-provenance-indicators.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
