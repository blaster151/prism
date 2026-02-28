# Story 2.2: Candidate list + lifecycle state (Active/Archive)

Status: ready-for-dev

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

- [ ] Implement candidate list page and backing API/service to fetch candidates (AC: 1)
- [ ] Add lifecycle filter to list query (default Active) (AC: 2)
- [ ] Implement lifecycle toggle action (service-layer mutation) (AC: 3)
- [ ] Enforce RBAC for lifecycle mutation (AC: 3)
- [ ] Write `audit_event` for lifecycle changes with non-sensitive metadata (AC: 4)
- [ ] Add unit/integration tests for lifecycle transitions + RBAC + audit logging (AC: 3, 4)

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

### Completion Notes List

### File List

## Change Log

- 2026-02-28: Draft created
