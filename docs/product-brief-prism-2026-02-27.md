# Product Brief: prism

**Date:** 2026-02-27
**Author:** BMad
**Context:** internal enterprise recruiting tool

---

## Executive Summary

Prism is an internal, AI-assisted resume intelligence platform for CEC power users to rapidly search, refine, and assemble candidate shortlists from large resume pools. It replaces slow, inconsistent “peek-and-poke” discovery in a legacy system with secure login/RBAC, structured Data Records, and ranked, explainable, iterative natural-language search—dramatically reducing time-to-shortlist while preserving human control over the final shortlist.

---

## Core Vision

### Initial Vision

Prism is being built to help a friend’s company modernize internal candidate discovery for high-volume resume pools. The vision is to turn static resume files into structured “Data Records” and give CEC power users an iterative, natural-language search experience with ranked, explainable results—so assembling strong shortlists becomes fast, consistent, and repeatable.

### Problem Statement

Candidate discovery today is driven by manual “peek and poke” searching inside a legacy system with limited filtering and no semantic understanding. Recruiters and CEC power users must repeatedly open resumes, try brittle keyword queries, and iteratively guess at filters—making daily search slow, inconsistent, and hard to reproduce. The result is wasted time-to-shortlist, uneven candidate coverage, and an inefficient workflow that does not scale with large resume pools.

### Problem Impact

The current workflow creates direct operational drag: search takes longer than it should, results vary depending on who is searching and what terms they try, and “trial-and-error” querying leads to missed or inconsistently surfaced candidates. This increases time-to-shortlist and reduces confidence that shortlists reflect the best available talent in the resume pool.

### Why Existing Solutions Fall Short

The legacy resume search experience is built around basic keyword and narrow filters, with no semantic understanding of skills, seniority, role fit, or related experience. It forces users into a manual “open-and-scan” loop and makes it difficult to iteratively refine a query while preserving intent. There’s also no consistent ranking with clear rationale, so results are harder to trust, harder to explain to stakeholders, and harder to reproduce across different users and searches.

### Proposed Solution

Prism will be an internal, AI-assisted resume intelligence platform that goes beyond search to provide an end-to-end candidate discovery and resume standardization workflow:

- **Ingest + normalize**: Reliably ingest resumes from a Dropbox-based repository in varied formats (including scanned PDFs), extract text, and convert each resume into a structured, editable **Data Record**.
- **Authentication + user management**: Provide a secure login system with an admin experience for managing users and roles (RBAC).
- **Secure, compliant access**: Enforce role-based access controls (RBAC) and least-privilege handling of PII so only authorized users can view/export sensitive fields.
- **Semantic, iterative discovery**: Enable natural-language, iterative search and refinement over the structured record set, with ranked results and **explainable rationales** for why candidates match (competencies, experience domains, clearances, and program history that contributed to the score).
- **Human-in-the-loop list building**: Preserve user intent during iterative refinement by supporting manual adds/removals (pin/keep/exclude) that persist across follow-up prompts and query adjustments.
- **Candidate lifecycle**: Support **Active / Archive** lifecycle states so users can focus on current pipelines while retaining historical candidates.
- **Standardized outputs**: Generate standardized **CEC-formatted resumes** from the Data Record, enabling consistent presentation and quicker handoff.
- **Cost efficiency**: Keep AI usage lean and measurable through monitored token consumption, lightweight models/strategies where possible, and guardrails to prevent runaway cost.
- **Trust-by-design automation**: Balance automation with human control—AI assists, but does not silently overwrite factual data. Edits and transformations are explicit and reviewable.
- **Fast, simple user experience**: Feel immediate and responsive for rapid iteration; keep the UX approachable so non-technical users can refine queries without learning complex filtering syntax.
- **Scalable + extensible foundation**: Support incremental growth in resume volume and evolving search sophistication without major rework; structure the system so future expansions (e.g., saved candidate stacks, deeper analytics, integrations with adjacent internal systems) can be added without entangling the initial delivery milestones.

### Key Differentiators

Prism differentiates by combining resume intelligence with operational workflow needs that power users actually rely on:

- **End-to-end from file → record → output**: Not just “search resumes,” but ingest messy inputs (including scanned PDFs), normalize into editable Data Records, and generate standardized CEC-formatted resumes.
- **Explainability + trust as a first-class feature**: Every ranked result clearly communicates *why* it matched, with highlighted signals (skills, domains, clearances, program history) to support confident decision-making.
- **Automation with human control**: Persistent human overrides (manual include/exclude/pin) across iterative refinement, and AI assistance that never silently overwrites factual data.
- **Security-first internal tooling**: RBAC and PII protection built in as a core constraint rather than an afterthought.
- **Practical admin operations**: Login + admin-managed users/roles so access can be maintained without developer intervention.
- **Fits the existing repository reality**: Dropbox-based source-of-truth integration, plus Active/Archive lifecycle support to reduce noise and keep pipelines focused.
- **Fast, low-friction UX for power users**: Responsive iteration without long delays, while staying simple enough for non-technical users to operate without special training.
- **Scales and evolves without rework**: Architecture supports growth in resume volume and search sophistication incrementally.
- **Cost-aware AI by design**: Lean AI usage patterns with instrumentation for token consumption and usage so operating costs stay predictable.
- **Extensible beyond initial milestones**: Clear separation between core delivery and future expansions (saved stacks, analytics, adjacent system integrations).

---

## Target Users

### Primary Users

**CEC power users (approx. 5 total)** who are responsible for day-to-day candidate discovery and shortlist assembly from a large internal resume pool.

**Primary jobs-to-be-done**

- Frequent (daily): “I need candidates for X” → run iterative natural-language searches → refine results → export a candidate shortlist.
- Less frequent: ingest new resumes from Dropbox (including scanned PDFs) with OCR + extraction into a structured Data Record.
- As-needed: output a candidate’s Data Record into a standardized CEC resume layout for consistent downstream sharing.

**What they value**

- Fast, responsive iteration (no long waits between query refinements)
- Clear explainability for rankings (why each candidate matched)
- Control over list curation (manual include/exclude that persists)

### User Journey

**Daily (frequent) flow — search → refine → shortlist**

1. User starts with a role need (“I need candidates for X”) and enters a natural-language query.
2. Prism returns ranked candidates with clear match explanations (skills/domains/clearances/program history).
3. User iteratively refines the search conversationally (“more like this”, “exclude Y”, “prioritize Z”).
4. User manually curates the list (pin/keep/exclude) and expects those choices to persist across refinements.
5. User exports a final shortlist for downstream review/coordination.

**Occasional flows**

1. Ingest new resumes from Dropbox (including scanned PDFs) → OCR + extraction → create/edit Data Record.
2. Generate a standardized CEC-formatted resume from a candidate’s Data Record as needed.

---

## Success Metrics

Prism is successful if it meaningfully reduces time-to-shortlist and improves candidate coverage/trust for daily searches.

- **Time-to-shortlist**: Target is to assemble a “good enough” shortlist in ~**5 minutes** for typical searches (baseline TBD).
- **Coverage quality**: Fewer missed candidates relative to the available resume pool for a given role need; users feel confident the top results reflect strong fits.
- **Operational reliability**: Ingestion (including scanned PDFs) and Data Record generation are dependable enough that users can trust the structured record as the basis for search and CEC-formatted outputs.
- **User trust**: Ranked results are explainable and auditable; the system does not silently overwrite factual data.

---

## Delivery Scope

### Core Features

The initial delivery is intended to deliver the complete “file → record → search → shortlist → standardized output” loop for the small CEC power-user group, with progressively demonstrable milestones along the way to build confidence.

**Candidate data foundation**

- **Dropbox integration (source of truth)**: Connect to the Dropbox-based resume repository; detect/import new/updated files.
- **Resume ingestion pipeline**: Accept varied formats including scanned PDFs; run OCR as needed; extract and normalize into a structured, editable **Data Record** per candidate.
- **Data Record editing**: Allow users to review and correct extracted fields (to ensure factual accuracy and avoid silent AI overwrites).
- **Login + admin user management**: Authentication plus an admin capability to manage users and roles (RBAC).
- **PII protection + RBAC**: Role-based access controls across viewing, editing, exporting, and resume generation; least-privilege defaults.
- **Lifecycle state**: Support **Active / Archive** state for candidates and ensure search can filter/operate appropriately.

**Discovery + shortlist workflow (daily driver)**

- **Natural-language search** over Data Records with rapid iteration (conversational refinement).
- **Ranked results with explainability**: Each result shows *why* it matched (highlighting competencies, domains, clearances, program history, etc.).
- **Human-controlled list refinement**: Manual include/exclude/pin that persists across subsequent prompts and refinements; export a curated shortlist.
- **Shortlist export**: Export the final shortlist in a practical machine-readable format (e.g., JSON) and a human-readable format suitable for sharing.

**Standardized outputs**

- **CEC-formatted resume generation**: Produce standardized CEC resume layouts from the Data Record for selected candidates.

### Deferred Beyond Initial Milestones

The following are intentionally deferred to later milestones once the core end-to-end loop is stable:

- **Tight coupling / deep integration** with the client’s other in-progress product (identify feasibility later; keep the initial delivery decoupled).
- Advanced analytics dashboards (beyond basic usage/token instrumentation).
- Saved candidate stacks/lists and team collaboration features beyond the core shortlist export.

### Success Criteria for Initial Delivery

- Users can run daily “I need candidates for X” searches and produce a shareable shortlist in ~**5 minutes** for typical cases.
- Ranked search results include clear “why matched” explanations that users can quickly sanity-check.
- Users can manually curate a shortlist (include/exclude/pin) and that intent persists through iterative refinements.
- Resume ingestion from Dropbox works reliably across common formats, including scanned PDFs, producing editable Data Records.
- CEC-formatted resume generation is available from the Data Record for selected candidates.
- RBAC/PII controls are enforced for viewing/editing/exporting.
- Token/usage monitoring is in place to keep operating costs visible and predictable.

### Future Vision

- Saved candidate stacks (persistent shortlists) with sharing and reuse across roles.
- Deeper analytics on pipeline performance and search effectiveness (coverage, acceptance, and quality signals).
- Integrations with adjacent internal systems once requirements and feasibility are clear.

---

## Technical Preferences

Prism is envisioned as a **web application** (likely **Next.js**) with a database-backed system of record (e.g., **Postgres**, with an ORM layer such as Prisma as an implementation detail). Hosting is currently expected to be **cloud-based** (GCP is the primary familiarity), with connectivity to the client’s Dropbox repository for accessing original resume files when needed.

Key technical expectations:

- Prism becomes the canonical source of truth for the **structured, editable Data Record**, while the original resume files remain stored as scanned/original documents.
- Ingestion must handle **scanned PDFs**, implying an OCR component. A key design decision remains open: whether to use LLM-based document ingestion (OCR+extraction) versus local/commodity OCR with LLM processing over extracted text.

## Organizational Context

Prism is being built to support a small internal group (~5 power users) at a friend’s company. Hosting constraints are not fully known yet (on-prem capability unclear), so the plan assumes cloud hosting unless compliance or customer constraints require on-prem or a hybrid deployment.

Compliance note: the organization may be certified to a government/security standard (possibly “CMMC”; acronym to be confirmed), which may drive requirements for access controls, auditability, data handling, and hosting posture.

## Risks and Assumptions

**Open questions / risks**

- **Compliance/hosting constraints**: If CMMC (or similar) applies, cloud architecture, data residency, and operational controls may need to meet specific requirements; scope/feasibility must be validated early.
- **OCR + extraction strategy**: Quality, cost, and latency trade-offs between LLM-based “vision ingestion” and traditional OCR + LLM text processing need validation with real resume samples (especially scanned PDFs).
- **Duplicate/updated resume reconciliation**: When a new resume is uploaded for someone who likely already has a Data Record (older resume), the system may need detection and a user-mediated reconciliation/merge workflow to prevent duplicated candidates and to preserve history.
- **Source-of-truth tension**: If users edit Data Records in Prism, a strategy is needed to reconcile edits vs. original resume files (audit trail, provenance, and what constitutes “factual” vs. “interpreted” fields).
- **Integration uncertainty**: Potential integration with another in-progress product is currently described as infeasible; Prism should remain decoupled in the initial delivery.

**Assumptions**

- A web UX with clear loading/progress indicators is acceptable in lieu of strict sub-second performance targets, as long as the system feels responsive for rapid iteration.

---

## Final Refinements

- Added **login + admin user management** as an explicit requirement to support RBAC/PII controls operationally.
- Reframed “phases” language into **progressively demonstrable milestones** toward a single cohesive delivery.

_This Product Brief captures the vision and requirements for prism._

_It was created through collaborative discovery and reflects the unique needs of this internal enterprise recruiting tool project._
_Next: Use the PRD workflow to create detailed product requirements from this brief (or run `workflow-init` to enable guided tracking)._
