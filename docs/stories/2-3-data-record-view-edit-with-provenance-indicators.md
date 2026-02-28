# Story 2.3: Data Record view/edit with provenance indicators

Status: done

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

- [x] Implement Data Record view page and service to load candidate record (AC: 1)
- [x] Implement edit flow for a small initial set of key fields, with extensibility for JSONB fields (AC: 2)
- [x] Display provenance indicators per field (AC: 3)
- [x] Implement attribution/versioning model for edits (record version or per-field history, aligned to architecture) (AC: 4)
- [x] Enforce RBAC on edits in the service layer (AC: 2)
- [x] Audit-log edits with safe metadata (no raw resume content) (AC: 5)
- [x] Add integration tests for editing + provenance transitions + audit log write (AC: 2, 3, 4, 5)

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

2026-02-28:
- Added Data Record view/edit page at `/candidates/[id]/record` backed by service layer.
- Implemented edit API `PATCH /api/candidates/[id]/record` with RBAC enforcement and audit logging (`data_record.edit`).
- Added provenance indicators per key field and versioning via `DataRecordVersion`.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

- ✅ Users can view and edit a small key-field set (fullName/title/email/phone).
- ✅ Each field displays provenance; edits transition provenance to `USER_EDITED`.
- ✅ Each edit creates a version snapshot row (`DataRecordVersion`) with actor attribution.
- ✅ Edits are audit-logged with safe metadata (candidateId + changedFields only).

### File List

- NEW: `src/server/records/dataRecordService.ts`
- NEW: `src/server/records/dataRecordService.test.ts`
- NEW: `src/app/api/candidates/[id]/record/route.ts`
- NEW: `src/app/candidates/[id]/record/page.tsx`
- NEW: `src/app/candidates/[id]/record/DataRecordForm.tsx`
- NEW: `prisma/migrations/20260228230542_data_record_versioning/migration.sql`
- MODIFIED: `prisma/schema.prisma`
- MODIFIED: `src/server/audit/eventTypes.ts`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/2-3-data-record-view-edit-with-provenance-indicators.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented Data Record view/edit with provenance indicators + versioning + audit logging; added tests; validated test/lint/build; marked ready for review
- 2026-02-28: Code review approved; marked done

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — Data Record view/edit is implemented with provenance indicators, service-layer RBAC, audit logging, and version snapshots.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Screen shows structured record | IMPLEMENTED | `/candidates/[id]/record`, `src/server/records/dataRecordService.ts` |
| 2 | Users can edit fields | IMPLEMENTED | `PATCH /api/candidates/[id]/record`, `DataRecordForm` |
| 3 | Provenance indicators per field | IMPLEMENTED | `DataRecordFieldProvenance` + UI badges |
| 4 | Edits attributed and versioned | IMPLEMENTED | `DataRecordVersion` created per edit with actorUserId |
| 5 | Edits audit-logged | IMPLEMENTED | `AuditEventTypes.DataRecordEdit` + `auditLog` |

