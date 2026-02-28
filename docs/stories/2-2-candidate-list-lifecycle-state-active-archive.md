# Story 2.2: Candidate list + lifecycle state (Active/Archive)

Status: done

## Story

As a PowerUser,  
I want to view candidates and filter by Active/Archive,  
so that I can focus on current pipelines while retaining history.

## Acceptance Criteria

1. Candidates page displays a list of candidates.
2. Users can filter/toggle views by lifecycle state (Active/Archive); default focuses on Active.
3. Authorized users can toggle a candidate between Active and Archive.
4. Lifecycle changes are audit-logged.

## Tasks / Subtasks

- [x] Implement candidate list page and backing API/service to fetch candidates (AC: 1)
- [x] Add lifecycle filter to list query (default Active) (AC: 2)
- [x] Implement lifecycle toggle action (service-layer mutation) (AC: 3)
- [x] Enforce RBAC for lifecycle mutation (AC: 3)
- [x] Write `audit_event` for lifecycle changes with non-sensitive metadata (AC: 4)
- [x] Add unit/integration tests for lifecycle transitions + RBAC + audit logging (AC: 3, 4)

## Dev Notes

- Lifecycle state is a core functional requirement and should be reflected in search filters later.
- Apply “service layer first”: UI calls route handler; route handler calls service which enforces RBAC + audit logging.

### Project Structure Notes

- Candidate page routes and API patterns are shown in `docs/architecture.md` (`src/app/(app)/candidates/page.tsx`, `src/app/api/candidates/route.ts` as the conceptual placement).

### References

- [Source: docs/epics.md#Story 2.2: Candidate list + lifecycle state (Active/Archive)]
- [Source: docs/PRD.md#Functional Requirements]
- [Source: docs/architecture.md#Implementation Patterns]

## Dev Agent Record

### Context Reference

- `docs/stories/2-2-candidate-list-lifecycle-state-active-archive.context.xml`

### Agent Model Used

GPT-5.2

### Debug Log References

2026-02-28:
- Added candidates list page (`/candidates`) with lifecycle filter and archive/restore action.
- Implemented candidates API routes and service-layer mutation with RBAC + audit logging.
- Added unit tests for candidates service; validated `npm test`, `npm run lint`, and `npm run build` pass.

### Completion Notes List

- ✅ Candidates list page renders and defaults to Active.
- ✅ Lifecycle filter toggles Active/Archive list views.
- ✅ Lifecycle changes are performed in service layer (RBAC enforced) and are audit-logged.
- ✅ Tests cover default listing and RBAC denial for unauthenticated mutation.

### File List

- NEW: `src/server/candidates/candidatesService.ts`
- NEW: `src/server/candidates/candidatesService.test.ts`
- NEW: `src/app/api/candidates/route.ts`
- NEW: `src/app/api/candidates/[id]/lifecycle/route.ts`
- NEW: `src/app/candidates/page.tsx`
- NEW: `src/app/candidates/CandidateList.tsx`
- MODIFIED: `src/server/audit/eventTypes.ts`
- MODIFIED: `docs/sprint-status.yaml`
- MODIFIED: `docs/stories/2-2-candidate-list-lifecycle-state-active-archive.md`

## Change Log

- 2026-02-28: Draft created
- 2026-02-28: Implemented candidates list + lifecycle filter/toggle with RBAC and audit logging; added tests; validated test/lint/build; marked ready for review
- 2026-02-28: Code review approved; marked done

## Senior Developer Review (AI)

### Reviewer

BMad

### Date

2026-02-28

### Outcome

Approve — candidates list + lifecycle filter/toggle are implemented with service-layer RBAC and audit logging.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Candidates page displays list | IMPLEMENTED | `src/app/candidates/page.tsx`, `src/app/candidates/CandidateList.tsx`, `GET /api/candidates` |
| 2 | Filter by lifecycle state (default Active) | IMPLEMENTED | `src/app/candidates/CandidateList.tsx`, `src/server/candidates/candidatesService.ts` |
| 3 | Toggle Active/Archive | IMPLEMENTED | `PATCH /api/candidates/[id]/lifecycle`, `src/server/candidates/candidatesService.ts` |
| 4 | Lifecycle changes audit-logged | IMPLEMENTED | `src/server/audit/eventTypes.ts`, `src/server/candidates/candidatesService.ts` |

