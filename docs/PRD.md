# prism - Product Requirements Document

**Author:** BMad
**Date:** 2026-02-27
**Version:** 1.0

---

## Executive Summary

Prism is an internal AI-assisted resume intelligence platform for ~5 CEC power users to rapidly discover candidates and assemble shortlists from a large pool of resumes. It replaces a slow, manual “peek and poke” legacy workflow with structured, editable candidate Data Records and a natural-language, iterative search experience.

### What Makes This Special

The “wow” moment is when users see search results that are fast, highly relevant, clearly ranked with rationales, and—most importantly—match based on **meaning**, not just string matching. Prism should surface strong fits by inferring connections across skills, experience domains, clearances, and program history, and then explain those in a way users can trust.

---

## Project Classification

**Technical Type:** web_app (internal web application)
**Domain:** aerospace/defense contractor internal tooling (CMMC Level 2 context)
**Complexity:** high (PII + possible CUI + RBAC + auditability + explainable AI matching)

Prism is best classified as an internal **web application** used by a small set of power users to perform high-value, high-frequency candidate discovery. While it is not a public SaaS product, it inherits enterprise concerns: sensitive PII, strict access control, auditability expectations, and integrations with an external file repository (Dropbox). The product’s differentiation hinges on meaning-based search and explainability, which adds algorithmic and trust requirements beyond typical CRUD tooling.

### Domain Context (CMMC Level 2 / audit-ready)

- **Data sensitivity**: resumes and candidate profiles contain PII and potentially sensitive employment/program history.
- **Trust + auditability**: users must understand “why matched,” and the system must avoid silently overwriting factual data.
- **Compliance posture**: Cutting Edge states **CMMC Level 2**; Prism should be treated as “audit-ready” by default and align to NIST-aligned requirements in scope (auth/RBAC, logging, encryption, incident readiness).
- **Hosting/vendor constraints**: compliance may constrain cloud posture and acceptable AI vendors; keep AI data flows configurable (local OCR vs managed OCR; provider swap).

---

## Success Criteria

Success for Prism is defined by measurable improvements in candidate discovery effectiveness and day-to-day usability for CEC power users, while maintaining an audit-ready posture appropriate for an Aerospace/Defense contractor.

1. **Coverage (primary)**
   1. For a representative set of role queries, Prism’s top results include fewer “missed obvious fits” than the legacy workflow (baseline to be established).
   2. Target: improve shortlist coverage/quality as judged by CEC power users using a lightweight review protocol (define a test set + review rubric).

2. **Speed (secondary)**
   1. Target: produce a “good enough” shortlist for typical searches in ~**5 minutes** end-to-end (query → refine → curated list → export).
   2. Search/refine must feel responsive; where processing takes longer, Prism must show clear progress indicators and allow users to continue iterating without confusion.

3. **Standardization (tertiary)**
   1. Generate CEC-formatted resumes from Data Records with minimal manual rework.
   2. Exported shortlists are consistently structured (human-readable + machine-readable such as JSON) and usable for downstream stakeholders.

4. **Compliance confidence (supporting)**
   1. Auth + RBAC + admin user management are enforced for all PII/CUI-adjacent data and exports.
   2. Sensitive actions (auth, view, search, export, admin/role changes) are audit-logged with sufficient detail to support internal review and compliance evidence collection.

5. **User trust (non-negotiable quality bar)**
   1. Every ranked result includes an evidence-linked explanation of *why* it matched (skills, domains, clearances, program history).
   2. AI assistance never silently overwrites factual data; changes are explicit, reviewable, and attributable, with provenance/version history.

**Success Criteria → Evidence → Key Dependencies**

1. **Coverage**
   1. **Evidence**: a defined evaluation set (role queries + “known good fits”) and periodic power-user review showing fewer missed fits vs baseline.
   2. **Dependencies**: ingestion reliability (incl. scanned PDFs/OCR), extraction into consistent Data Records, semantic indexing/embeddings, ranking logic, explainability grounded in record evidence, reconciliation/merge for updated resumes.

2. **Speed**
   1. **Evidence**: telemetry for time-to-first-results and time-to-export-shortlist; user feedback that iteration feels responsive.
   2. **Dependencies**: precomputed indexes/embeddings, efficient DB queries (Postgres), caching where appropriate, async job pipeline for heavy work (OCR/extraction), progress indicators and non-blocking UX.

3. **Standardization**
   1. **Evidence**: generated CEC-formatted resumes meet layout expectations with minimal edits; exports are consistent.
   2. **Dependencies**: Data Record schema completeness/validation, resume templating/generation pipeline, export pipeline (JSON + human-readable), role-gated export actions.

4. **Compliance confidence**
   1. **Evidence**: demonstrable audit logs for sensitive actions; encryption settings verified; admin actions traceable; “audit rehearsal” checklist can be satisfied.
   2. **Dependencies**: login + admin user management, RBAC enforcement, audit logging subsystem + retention, encryption at rest/in transit, secrets management, backups/recovery, environment separation.

5. **User trust**
   1. **Evidence**: users can quickly validate “why matched” claims and correct records without losing provenance; no unexplained changes to factual fields.
   2. **Dependencies**: evidence-linked explanations (highlighted fields/spans), provenance/versioning for Data Records, explicit review/approval flows for AI-suggested edits, immutable-ish audit trail for edits and exports.

---
---

## Product Scope

### MVP - Minimum Viable Product

The initial delivery must support the complete end-to-end loop (“file → record → search → shortlist → standardized output”), delivered through progressively demonstrable milestones that build confidence while converging on a single cohesive system.

1. **Foundation (audit-ready baseline)**
   1. Secure login with admin-managed users/roles.
   2. RBAC enforced for all PII/CUI-adjacent data and export actions.
   3. Centralized audit logging for sensitive events (auth, record access, search, exports, admin/role changes), with retention and basic reporting.
   4. Encryption in transit and at rest; secure secret management; backups and recovery procedures.

2. **Ingestion + canonical Data Record**
   1. Dropbox integration with least-privileged access to source files.
   2. Ingestion pipeline supports common resume formats, including scanned PDFs (OCR as needed).
   3. Extraction populates a structured Data Record that users can edit; the system preserves provenance (extracted vs inferred vs user-edited).
   4. Detect likely duplicates/updated resumes and provide a user-mediated reconciliation/merge workflow with history.

3. **Meaning-based discovery + shortlist workflow**
   1. Natural-language, iterative search over Data Records with rapid refinement.
   2. Ranked results include evidence-linked explanations (“why matched”) grounded in the record/resume.
   3. User intent is preserved across iterations (persistent include/exclude/pin).
   4. Shortlists can be exported in both human-readable and machine-readable forms (e.g., JSON), and exports are role-gated and audit-logged.

4. **Standardized outputs**
   1. Generate standardized CEC-formatted resumes from Data Records for selected candidates.
   2. Generated outputs follow controlled export pathways with appropriate access controls and logging.

5. **Cost + quality instrumentation**
   1. Instrument usage and token consumption, with guardrails and visibility to prevent runaway costs.
   2. Provide basic operational health signals (job status for ingestion/OCR/extraction; error reporting).

### Growth Features (Post-MVP)

Defer until after the core loop is stable:

- Saved candidate stacks with sharing and reuse.
- Deeper analytics on search effectiveness and workflow KPIs.
- Integrations with adjacent internal systems (beyond Dropbox) once feasibility is clear.
- Automated access reviews and improved compliance evidence packaging.

### Vision (Future)

Longer-horizon enhancements:

- Feedback-informed ranking (learning from user curation signals) with governance controls.
- Advanced explainability (e.g., “what would change this ranking?”) and bias/quality monitoring.
- Enhanced ingestion (confidence scoring, targeted human review queues, improved OCR for low-quality scans).
- Expansion to additional teams and/or multi-tenant support if Prism grows beyond the initial user group.

---

## Domain-Specific Requirements

Prism is being built for an Aerospace/Defense contractor environment with a stated **CMMC Level 2** posture. The PRD must therefore treat security and auditability as first-class product requirements—not a later hardening phase.

### Compliance posture and scoping

1. The system must support an “audit-ready” operating mode aligned with the organization’s CMMC L2 assessment scope (confirm what data is **CUI** vs. **PII-only**, and what infrastructure/systems are in-scope).
2. Compliance constraints may influence hosting and vendor choices (cloud provider/region, AI vendor policies, data retention/training terms). AI data flows must be configurable enough to adapt to these constraints.

### Identity, access control, and administration

1. Prism must provide secure authentication (prefer SSO if available; otherwise strong local auth) and administrative user management.
2. RBAC must be enforced consistently across UI and API for:
   1. viewing PII/CUI-adjacent fields,
   2. editing Data Records,
   3. exporting shortlists/resumes,
   4. performing admin actions (user/role changes).
3. Administrative actions must be attributable and auditable.

### Auditability and evidence

1. Prism must produce audit logs for sensitive events at minimum:
   1. authentication/session events,
   2. candidate record access,
   3. searches and exports,
   4. admin/role changes,
   5. AI-assisted transformations (ingestion/extraction suggestions and applied edits).
2. Logs must support review and reporting, and be protected against tampering.

### Data protection and lifecycle

1. Encrypt data in transit and at rest; use secure secret management and least-privilege service accounts (Dropbox, DB, AI components).
2. Establish clear data boundaries and provenance:
   1. original resume files (Dropbox),
   2. extracted text,
   3. structured Data Records,
   4. generated outputs (CEC resumes, exports).
3. Preserve provenance/version history for Data Record edits and resume reconciliation (no silent overwrites).
4. Candidate lifecycle (Active/Archive) and retention/export controls must be compatible with compliance expectations (final retention periods to confirm).

This section shapes all functional and non-functional requirements below.

---

## Innovation & Novel Patterns

Prism’s innovation is not “AI for resumes” in the abstract—it is **meaning-based candidate matching** combined with **trustworthy explainability** and **human-controlled refinement** in a compliance-sensitive environment.

### Novel patterns

1. **Meaning-based retrieval with evidence-linked explanations**
   1. Rank candidates using semantic signals beyond keyword overlap.
   2. For every result, produce a concise explanation grounded in concrete evidence (Data Record fields and/or highlighted resume spans).
   3. Explanations are first-class artifacts: inspectable, attributable, and suitable for audit/review.

2. **Human-in-the-loop intent preservation**
   1. Users can pin/keep/exclude candidates.
   2. Those intent signals persist across follow-up prompts and refinements and are never silently overridden by the model.

3. **Governed AI transformations**
   1. AI can propose extraction/normalization and corrections, but factual fields require explicit review/confirmation.
   2. Provenance and version history preserve what was extracted, inferred, and edited—and by whom/when.

### Validation Approach

Validation must be pragmatic and trust-focused:

1. **Coverage and relevance validation**
   1. Build a small, representative evaluation set (role prompts + “known good fits”) and compare Prism vs legacy on “missed obvious fits.”
   2. Use power-user review to refine ranking/explanations.

2. **Explainability validation**
   1. Spot-check explanations for correctness and evidence grounding (no hallucinated claims).
   2. Require “show me where this came from” linking for key match signals.

3. **Workflow + intent validation**
   1. Verify pinned/kept/excluded candidates persist through multiple refinements.
   2. Confirm exports reflect the curated list and are audit-logged.

4. **Compliance validation**
   1. Verify auth/RBAC enforcement and audit log completeness for sensitive flows.
   2. Confirm AI vendor/data handling constraints are satisfied in the chosen deployment.

---

## Web App Specific Requirements

### Browser support

1. Prism must support the **current stable versions** of major modern browsers (Chrome, Edge, Firefox, Safari) on desktop platforms.
2. Prism must degrade gracefully on older browsers with a clear “browser unsupported” message and guidance.

### Responsive behavior and mobile access

1. Prism is optimized for **desktop use** (the primary target workflow is rapid iterative search + shortlist export).
2. If accessed from a mobile device, Prism must show a clear “mobile not supported” experience that:
   1. explains the limitation,
   2. prevents risky actions (e.g., exports) by default,
   3. provides safe next steps (switch to desktop, contact admin), and
   4. does not expose additional PII beyond what the user’s role permits.

### Accessibility and UX quality

1. Accessibility is **best effort** for the internal UI, with pragmatic adherence to common practices (keyboard navigation where feasible, readable contrast, clear focus states).
2. The UX must avoid complex filtering syntax and instead support natural-language refinement with clear feedback and progress indicators.

### Performance expectations

1. Hard numeric SLAs are not required initially, but the application must feel responsive:
   1. show progress for long-running operations (OCR/extraction/indexing),
   2. avoid blocking the UI unnecessarily,
   3. surface job status and errors in user-friendly terms.

### Security expectations (web app posture)

1. Security controls described in the Domain-Specific Requirements (auth/RBAC, audit logging, encryption, controlled exports) must be implemented consistently across the web UI and any backing APIs.

---

## User Experience Principles

1. **Fast iteration, clear feedback**: the UI should feel responsive for the daily search/refine loop, with clear progress indicators for long-running operations (ingestion/OCR/extraction/indexing).
2. **Explainability is part of the result, not a separate screen**: every ranked candidate should clearly show *why* they matched, with evidence links (fields/spans) to build trust quickly.
3. **Human control is explicit**: pin/keep/exclude actions are prominent, easy to undo, and persist across refinements. The system never “mysteriously” changes the curated list.
4. **No special syntax required**: users should be able to refine searches in natural language; advanced filtering (if any) is optional and progressively disclosed.
5. **Audit-ready interactions**: actions that affect data or exports (edits, merges, exports, admin changes) are explicit and confirmable, aligning with audit expectations without slowing down normal use.
6. **Safe by default**: exports and sensitive views are role-gated; mobile access is intentionally limited with clear messaging.

### Key Interactions

1. **Natural-language search + refinement**
   1. Enter a role need (“I need candidates for X”).
   2. Refine iteratively (“more like this”, “exclude Y”, “prioritize Z”) with immediate, understandable UI updates.

2. **Ranked results with evidence**
   1. Each result includes a compact rationale summary.
   2. Users can expand to see highlighted competencies/domains/clearances/program history and the supporting record evidence.

3. **Shortlist curation**
   1. Pin/keep/exclude actions are one-click.
   2. The shortlist view shows what’s pinned vs. algorithmic suggestions.

4. **Export**
   1. Export curated shortlists (human-readable + JSON) with clear confirmation.
   2. Export CEC-formatted resumes for selected candidates.
   3. Exports are role-gated and audit-logged.

5. **Data Record review/edit**
   1. View/edit structured fields with provenance indicators (extracted vs inferred vs user-edited).
   2. Approve or reject AI suggestions explicitly; view version history.

6. **Ingestion + job status**
   1. Trigger ingestion (or observe automatic ingestion) from Dropbox.
   2. Track OCR/extraction/indexing progress and errors; retry when appropriate.

7. **Reconciliation workflow**
   1. When a likely duplicate/updated resume is detected, review “same person?” evidence and merge with human confirmation.

8. **Administration**
   1. Admin manages users/roles.
   2. Admin can review audit logs and export evidence as needed for compliance processes.

---

## Functional Requirements

Functional requirements are organized by capability. Each item includes acceptance criteria-style statements to enable implementation planning and testing.

### 1) Identity, Access, and Administration

1. **User authentication**
   1. The system must require authenticated access for all application features.
   2. The system should support SSO if an identity provider is available; otherwise it must support secure local authentication.
2. **Admin user management**
   1. Admins must be able to create, disable, and manage user accounts.
   2. Admins must be able to assign roles to users.
3. **Role-based access control (RBAC)**
   1. The system must enforce RBAC consistently across UI and API for:
      1. viewing PII/CUI-adjacent candidate fields,
      2. editing Data Records,
      3. performing ingestion and reconciliation actions,
      4. exporting shortlists and resumes,
      5. viewing audit logs.
   2. Unauthorized actions must be blocked with a clear error message and logged.

### 2) Resume Repository Integration (Dropbox)

1. **Dropbox connectivity**
   1. The system must integrate with a Dropbox-based repository as the source of original resume files.
   2. Dropbox access must be least-privileged and scoped to the required folders.
2. **File discovery and change detection**
   1. The system must detect new/updated resume files in Dropbox (polling and/or webhook-based, implementation dependent).
   2. The system must surface ingestion status (queued/running/succeeded/failed) for each file.

### 3) Ingestion, OCR, and Extraction to Data Records

1. **Multi-format ingestion**
   1. The system must ingest common resume formats, including scanned PDFs.
2. **OCR**
   1. For scanned PDFs (or otherwise non-text PDFs), the system must perform OCR sufficient to enable downstream extraction and evidence linking.
3. **Structured Data Record creation**
   1. For each ingested resume, the system must create or update a structured candidate Data Record.
   2. The Data Record must be editable by authorized users.
4. **Provenance and versioning**
   1. The system must distinguish and display provenance for fields (extracted, inferred, user-edited).
   2. The system must maintain version history for Data Record changes, including who/when/what changed.
5. **AI governance (no silent overwrites)**
   1. AI-assisted corrections or transformations must be explicitly reviewable before being applied to factual fields.
6. **Reconciliation for updated/duplicate resumes**
   1. The system must detect likely “same person” resumes (new upload for an existing candidate) and present a reconciliation workflow.
   2. Users must be able to confirm merge/update decisions and preserve history across versions.

### 4) Candidate Search, Ranking, and Explainability

1. **Natural-language search**
   1. Authorized users must be able to search candidates using natural-language queries.
2. **Iterative refinement**
   1. Users must be able to refine searches iteratively without losing context (e.g., “more like this”, “exclude Y”, “prioritize Z”).
3. **Meaning-based ranking**
   1. Search results must be ranked using semantic/meaning-based signals (not only keyword matching).
4. **Evidence-linked explanations**
   1. For every ranked result, the system must show a concise “why matched” explanation grounded in candidate evidence.
   2. The UI must support drilling into the supporting evidence (Data Record fields and/or highlighted resume spans).
   3. The system must not present explanations that are not supported by candidate evidence.

### 5) Shortlist Curation and Intent Preservation

1. **Curation actions**
   1. Users must be able to pin/keep/exclude candidates.
2. **Intent persistence**
   1. Pin/keep/exclude decisions must persist across subsequent refinements and re-ranking.
   2. The system must clearly show what is user-curated vs. algorithmically suggested.

### 6) Candidate Lifecycle Management

1. **Active/Archive**
   1. Authorized users must be able to set candidates to Active or Archive.
   2. Search must allow filtering by lifecycle state (e.g., default to Active; include Archive optionally).

### 7) Exports and Standardized Outputs

1. **Shortlist export**
   1. Users must be able to export curated shortlists in:
      1. a human-readable format, and
      2. a machine-readable format (e.g., JSON).
   2. Exports must be RBAC-gated and audit-logged.
2. **CEC-formatted resume generation**
   1. Users must be able to generate standardized CEC-formatted resumes from candidate Data Records.
   2. Generated outputs must follow controlled export pathways (RBAC + audit logging).

### 8) Audit Logging and Reporting

1. **Audit events**
   1. The system must audit-log sensitive events at minimum:
      1. authentication/session activity,
      2. record access,
      3. searches,
      4. exports,
      5. admin role/user changes,
      6. AI-assisted ingestion/extraction and applied edits,
      7. reconciliation/merge decisions.
2. **Audit review**
   1. Authorized users must be able to review audit logs and filter by user, time range, and event type.

### 9) Operational Visibility and Cost Instrumentation

1. **Job status**
   1. The system must display ingestion/OCR/extraction/indexing job status and error states.
2. **Token/usage monitoring**
   1. The system must track and report AI usage and token consumption at a level sufficient to detect runaway costs and enable optimization.

---

## Non-Functional Requirements

### Performance and responsiveness

1. The daily search/refine loop must feel responsive for power users.
2. Long-running operations (OCR/extraction/indexing) must run asynchronously with clear progress indicators and job status.
3. The UI must not block unrelated user actions while background jobs are running, where feasible.

### Security and compliance posture (CMMC L2 aligned)

1. Encrypt data in transit and at rest; secure secret management is mandatory.
2. Strong session management and MFA should be supported where feasible.
3. Audit logs must be protected against tampering and retained per compliance expectations (retention period to confirm).
4. Least-privilege service accounts must be used for Dropbox, database, and AI components.
5. The system must support environment separation (dev/test/prod) and controlled access to production data.

### Reliability and recoverability

1. The system must have backups and a defined recovery procedure.
2. Ingestion/OCR/extraction failures must be observable, retryable, and not silently drop data.

### Scalability and evolution

1. The architecture must support incremental growth in resume volume and search sophistication without major rework.
2. Indexing approaches (semantic and any lexical) must be designed for growth and periodic reprocessing.

### Accessibility (best effort)

1. The UI should follow pragmatic accessibility practices (keyboard navigation where feasible, readable contrast, clear focus states).

### Integration boundaries

1. Dropbox is the initial external integration boundary; the system must be able to operate predictably if Dropbox is temporarily unavailable.
2. AI vendor integrations must be configurable to satisfy compliance constraints (provider swap and/or local alternatives for OCR/extraction where required).

---

## Implementation Planning

### Epic Breakdown Required

Requirements must be decomposed into epics and bite-sized stories (200k context limit).

**Next Step:** Run `workflow create-epics-and-stories` to create the implementation breakdown.

---

## References

- Product Brief: `docs/product-brief-prism-2026-02-27.md`
- Domain Brief: `docs/domain-brief.md`

---

## Next Steps

1. **Epic & Story Breakdown** - Run: `workflow create-epics-and-stories`
2. **UX Design** (if UI) - Run: `workflow create-ux-design`
3. **Architecture** - Run: `workflow architecture`

---

_This PRD captures the essence of prism - meaning-based, explainable candidate discovery that users can trust._

_Created through collaborative discovery between BMad and the AI facilitator._
