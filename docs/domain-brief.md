# Domain Brief - prism

Generated: 2026-02-27
Domain: Aerospace/Defense contractor internal tooling (CMMC Level 2 context)
Complexity: High (CUI/PII + auditability + AI-assisted decision support)

## Executive Summary

This brief focuses on the compliance and security domain considerations for Prism: an internal resume intelligence system handling PII and potentially sensitive candidate/program history. The key domain drivers are least-privilege access to PII, auditability, secure handling of documents and derived Data Records, and alignment with the organization’s compliance posture (possibly CMMC; to confirm). These requirements should shape authentication/RBAC, logging, encryption, data lifecycle, and operational processes.

## Domain Overview

### Industry Context

Prism sits in the internal recruiting/resume-management space with an AI-assisted search and standardization workflow. While not a public consumer product, it has enterprise security characteristics due to:

- **Sensitive data**: resumes contain PII and potentially clearance/program history.
- **Decision support**: ranked results influence shortlist decisions; explainability and trust are required.
- **Operational workflows**: ingestion from a file repository (Dropbox), record editing, and exports.

### Regulatory Landscape

Primary drivers are **security/compliance frameworks** rather than consumer privacy regulation. Cutting Edge is categorized in the **Aerospace** space and supports major defense/space programs; their stated posture includes **Cybersecurity Maturity Model Certification (CMMC), Level 2**, and work supporting agencies including NASA/NOAA/DoD and the intelligence community. Practically, Prism should be treated as a system that may store/process **Controlled Unclassified Information (CUI)** and must be “audit-ready.”

At a minimum, plan for:

- **CMMC Level 2 alignment** (commonly mapped to NIST SP 800-171 requirements) within the defined assessment scope.
- Evidence/traceability for controls that impact Prism (identity, access, logging, encryption, configuration control, incident response).
- Contract/customer-driven constraints that may dictate hosting posture (cloud vs. on-prem vs. hybrid) and acceptable AI service providers.

### Key Stakeholders

- **CEC power users (~5)**: day-to-day search, refinement, and shortlist generation.
- **Admin / security owner**: manages users/roles, ensures least-privilege access, reviews audit logs.
- **IT / compliance stakeholders**: validate hosting posture and controls (especially if CMMC applies).
- **Hiring decision stakeholders**: consume exported shortlists and standardized resumes; rely on explainability.

## Critical Concerns

### Compliance Requirements

The concerns that most directly affect Prism’s requirements and architecture:

- **Authentication + RBAC**: strong identity and role management (including admin operations) to enforce least privilege for PII and any CUI-adjacent fields.
- **Auditability**: immutable-ish audit trails for access to resumes/Data Records (view, search, export, role changes, admin actions), and for any AI-assisted transformations.
- **Data protection**: encryption in transit and at rest, secure secret management, and controlled export pathways.
- **Data provenance + integrity**: clear separation of “extracted/inferred” vs. “user-edited/factual” fields; no silent AI overwrites; versioning/history for Data Records.
- **External repository boundary**: Dropbox integration must be treated as an external boundary with careful token handling, least-privileged access, and clear sync semantics.
- **Vendor/AI usage constraints**: any use of third-party AI services must respect customer/compliance constraints (data handling terms, logging, retention, and whether model training is allowed).
- **Lifecycle + retention**: Active/Archive state and retention policies for candidates/resumes, potentially influenced by customer requirements.

### Technical Constraints

Likely constraints in a CMMC L2 environment:

- **MFA and secure session management** for all users.
- **Centralized logging** and access log retention (to support assessment evidence).
- **Configuration management** and change control for the application and infrastructure.
- **Environment separation** (dev/test/prod) and controlled access to production data.
- **Backups + recovery** with tested procedures.
- **Least-privilege service accounts** for Dropbox, database, and any AI components.

### Safety/Risk Considerations

This is not a safety-critical system (in the DO-178C sense), but it is **decision-support** tooling where failures can cause:

- **Privacy/security incidents** (PII exposure, unauthorized access, improper export).
- **Operational harm** (missed candidates, biased or misleading ranking signals).
- **Compliance risk** (inadequate evidence for audits; nonconforming control implementation).

## Regulatory Requirements

The core regulatory/compliance driver to validate and align to is **CMMC Level 2**, which (as of DoD CMMC Assessment Guide L2 v2.13, Sep 2024) is assessed using the CMMC L2 assessment methodology and mapped to security requirements commonly associated with **NIST SP 800-171**.

Prism-relevant requirement themes (expressed as system requirements, not policy text):

- **Access control**: unique user identification, least privilege, role-based authorization to PII/CUI-adjacent data, session controls.
- **Audit and accountability**: log relevant events (auth, access to candidate records, exports, admin changes), protect logs from tampering, support review and reporting.
- **Identification and authentication**: MFA, strong password/session policies, admin controls.
- **Configuration management**: controlled changes, baselines, traceability of deployments.
- **Incident response readiness**: ability to detect and investigate suspicious access; export audit reports.
- **Data protection**: encryption, secure communications, media protection and controlled exports.

References (to use as anchors during compliance conversations):

- DoD CIO: CMMC Level 2 Assessment Guide (v2.x)  
- `32 CFR Part 170` (CMMC Program), including `32 CFR § 170.16` (Level 2 self-assessment and affirmation requirements)

## Industry Standards

Standards/pattern sources that typically align well with CMMC-oriented environments (and can be turned into engineering requirements):

- **NIST-aligned controls** for access, logging, encryption, incident response (basis depends on the organization’s compliance scope).
- **OWASP ASVS / Top 10** for web application security requirements.
- **CIS Benchmarks** for hardening common components (OS, containers, databases).
- **SOC 2-style operational controls** (even if not formally pursuing SOC 2) to ensure auditability and repeatability.

## Practical Implications

### Architecture Impact

- Prefer an **identity-provider-backed auth** (SSO if available) and explicit RBAC model across UI and API layers.
- Build an **audit logging subsystem** early (events for access/search/export/admin actions; retention; query/report capability).
- Treat AI as a **bounded service** with clear data contracts; log model/version and rationale artifacts needed for explainability.
- Design clear **data boundaries** between: original resume files (Dropbox) vs. extracted text vs. structured Data Record vs. generated outputs.
- Support **provenance/versioning** for Data Records and reconciliation for “new resume for existing person.”

### Development Impact

- Add acceptance criteria that map to audit/security concerns (e.g., “export requires role X and is logged”).
- Build test fixtures for PII redaction/role gating and for explainability rendering.
- Expect time to validate AI ingestion approaches with real scanned resume samples and compliance constraints.

### Timeline Impact

Even if delivery is “big bang,” compliance validation tends to benefit from **incremental checkpoints**:

- Early: auth/RBAC + logging + encryption baseline
- Mid: ingestion + provenance + explainability correctness
- Late: evidence collection, access review, runbooks, and “audit rehearsal”

### Cost Impact

- Compliance posture adds operational overhead (logging storage, security tooling, reviews).
- AI costs must be monitored; token/usage instrumentation is not optional in a cost-sensitive environment.

## Domain Patterns

### Established Patterns

- **Zero/least-trust access** patterns: strict RBAC, separation of duties for admin operations.
- **Audit-first design**: event-sourced audit log for sensitive actions, plus analytics/reporting views.
- **Human-in-the-loop AI**: AI proposes; users review/confirm edits; provenance preserved.
- **Data classification flags**: fields tagged as PII/CUI-adjacent; exports/redactions based on role.

### Innovation Opportunities

Prism’s differentiator is **meaning-based matching with explainability**. The innovation opportunity is to treat “explanations” as first-class artifacts (not an afterthought), enabling trust, faster review, and better shortlist defensibility.

## Risk Assessment

### Identified Risks

- CMMC scope/hosting constraints could narrow cloud options or require specific controls/tooling.
- Using third-party AI services may introduce data-handling constraints; vendor selection matters.
- Explainability may be perceived as incorrect/untrustworthy if not grounded in candidate evidence.
- Duplicate/updated resume reconciliation can create data integrity issues without clear workflows.

### Mitigation Strategies

- Confirm compliance scope early (what data is CUI vs. PII; what systems are in-scope).
- Design AI data flows to be configurable (local OCR vs. managed OCR; model provider swap).
- Make explanations evidence-linked (highlight resume spans/fields backing each claim).
- Implement merge/reconciliation workflows with human review and version history.

## Validation Strategy

### Compliance Validation

- Maintain a control-to-feature matrix for Prism-relevant controls (auth/RBAC, logging, encryption, exports).
- Produce evidence artifacts continuously (screenshots/configs/log samples/runbooks) as features ship.

### Technical Validation

- Test role/permission matrix, export gating, and audit log integrity.
- Validate ingestion accuracy on scanned PDFs and common formats; measure correction burden.

### Domain Expert Validation

- Identify a compliance owner and at least one power-user reviewer to validate workflows and audit expectations.

## Key Decisions

- Treat Prism as **compliance-sensitive** by default due to CMMC L2 posture; tighten controls even if final scope is reduced later.
- Implement **auth/RBAC + audit logging** as foundational capabilities, not “later hardening.”
- Keep AI assistance bounded; preserve provenance; avoid silent overwrites of factual data.

## Recommendations

### Must Have (Critical)

1. Login + admin user management; explicit RBAC for PII/CUI-adjacent fields and exports.
2. Comprehensive audit logging for sensitive actions (access/search/export/admin), with retention and reporting.
3. Data provenance/versioning for Data Records + user-mediated reconciliation for updated resumes.

### Should Have (Important)

1. Evidence-linked explainability (show what fields/spans drove ranking).
2. Configurable OCR/extraction strategy to satisfy quality + cost + compliance constraints.

### Consider (Nice-to-Have)

1. Automated periodic access reviews and “least privilege” drift detection.
2. Built-in redaction modes for exports based on role and recipient.

### Development Sequence

1. Foundation: auth/RBAC + audit logging + data model boundaries + Dropbox integration.
2. Core loop: ingest → Data Record → meaning-based search + explainability → shortlist export.
3. Integrity: provenance/versioning + reconciliation for updated resumes + CEC-format generation.
4. Hardening: retention, reporting, runbooks, compliance evidence packaging.

### Required Expertise

- Compliance/security owner familiar with CMMC L2/NIST-aligned controls in practice.
- UX reviewer for explainability and trust interactions (non-technical users).

## PRD Integration Guide

### Summary for PRD

Prism should be treated as **defense-contractor internal tooling** with CMMC Level 2 posture. This implies foundational requirements for auth/RBAC, audit logging, encryption, and careful data boundaries/provenance for AI-assisted extraction and ranking. The PRD should include explicit functional requirements for admin/user management, audit trails, export controls, and reconciliation of updated resumes, plus NFRs around security/auditability and AI governance.

### Requirements to Incorporate

- Login + admin user management; explicit RBAC for PII/CUI-adjacent fields and exports.
- Comprehensive audit logging for sensitive actions (access/search/export/admin), with retention and reporting.
- Data provenance/versioning for Data Records + user-mediated reconciliation for updated resumes.

### Architecture Considerations

- Identity-provider-backed auth (SSO if available) and explicit RBAC model across UI and API layers.
- Audit logging subsystem early; clear boundaries for Dropbox/original docs vs extracted text vs Data Records vs generated outputs.

### Development Considerations

- Build compliance evidence artifacts incrementally (configs/log samples/runbooks) as features ship.
- Validate OCR/extraction and meaning-based matching on real resume samples under compliance constraints (vendor selection matters).

## References

### Regulations Researched

- `32 CFR Part 170` (CMMC Program), including `32 CFR § 170.16` (Level 2 self-assessment and affirmation requirements)
- DoD CIO: CMMC Level 2 Assessment Guide (v2.x, used for assessment methodology)

### Standards Referenced

- NIST SP 800-171 (commonly referenced for CMMC L2 requirement mapping; confirm version in scope)
- OWASP Top 10 / ASVS (web application security requirements)

### Additional Resources

- Cutting Edge: public statement of CMMC Level 2 posture and government agency experience (context for domain assumptions)

## Appendix

### Research Notes

Note: NIST SP 800-171 has newer revisions; CMMC documentation may reference a specific revision for assessments. Confirm the exact baseline required by the customer/compliance owner and keep the control mapping scoped to Prism’s assessment boundary.

### Conversation Highlights

- Cutting Edge is a defense/government contractor operating across space/cyber domains and is CMMC Level 2.
- Prism handles PII and may be adjacent to CUI depending on candidate/program history and internal workflows.
- Hosting posture is not finalized; cloud is preferred but may be constrained by compliance requirements.

### Open Questions

- What is the exact compliance scope for Prism (CUI vs. PII only), and what systems are in-scope?
- What identity provider (if any) does Cutting Edge use today (SSO vs. local accounts)?
- Are there specific customer constraints on cloud providers/regions and AI vendors?
- What are required log retention periods and evidence expectations for Prism’s scope?

---

_This domain brief was created through collaborative research between BMad and the AI facilitator. It should be referenced during PRD creation and updated as new domain insights emerge._
