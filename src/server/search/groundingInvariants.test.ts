import { describe, expect, it } from "vitest";

import {
  extractQueryTerms,
  buildExplanation,
  extractSnippet,
  __private,
} from "@/server/search/explainService";
import {
  buildCombinedQuery,
  buildQueryContext,
  type QueryHistoryEntry,
} from "@/server/search/searchSessionService";
import type { SearchResult, EvidenceItem, Explanation } from "@/server/search/types";
import { __private as hybridPrivate } from "@/server/search/hybridSearch";

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------

function makeResult(overrides?: Partial<SearchResult>): SearchResult {
  return {
    candidateId: "uuid-1",
    candidateName: "Jane Doe",
    score: 0.85,
    semanticScore: 0.9,
    lexicalScore: 0.7,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Multi-candidate fixture data — realistic scenario
// ---------------------------------------------------------------------------

const CANDIDATE_FIXTURES = {
  alice: {
    result: makeResult({
      candidateId: "cand-alice",
      candidateName: "Alice Johnson",
      score: 0.899,
      semanticScore: 0.92,
      lexicalScore: 0.85,
    }),
    fields: {
      fullName: "Alice Johnson",
      skills: "TypeScript, Python, satellite systems, MATLAB",
      clearance: "TS/SCI",
      experience: "15 years systems engineering at Lockheed Martin",
      education: "MS Aerospace Engineering, MIT",
    },
    resumes: [
      {
        id: "doc-alice-1",
        ocrText: "Alice Johnson — Senior Systems Engineer. Led satellite guidance subsystem development for GPS III program. TS/SCI cleared. Expert in TypeScript and Python for flight software.",
      },
    ],
  },
  bob: {
    result: makeResult({
      candidateId: "cand-bob",
      candidateName: "Bob Smith",
      score: 0.831,
      semanticScore: 0.78,
      lexicalScore: 0.95,
    }),
    fields: {
      fullName: "Bob Smith",
      skills: "Java, C++, embedded systems",
      clearance: "Secret",
      experience: "10 years embedded software at Boeing",
    },
    resumes: [
      {
        id: "doc-bob-1",
        ocrText: "Bob Smith — Embedded Systems Engineer. Developed real-time flight control software in C++ for commercial aircraft. Secret clearance.",
      },
    ],
  },
  carol: {
    result: makeResult({
      candidateId: "cand-carol",
      candidateName: "Carol Williams",
      score: 0.706,
      semanticScore: 0.88,
      lexicalScore: 0.3,
    }),
    fields: {
      fullName: "Carol Williams",
      skills: "Python, data analysis, machine learning",
      experience: "8 years data science at Raytheon",
    },
    resumes: [], // no resume on file
  },
  empty: {
    result: makeResult({
      candidateId: "cand-empty",
      candidateName: null,
      score: 0.35,
      semanticScore: 0.5,
      lexicalScore: 0.0,
    }),
    fields: {}, // no DataRecord fields
    resumes: [],
  },
};

// ---------------------------------------------------------------------------
// Grounding invariants — the critical property (AC: 3)
// ---------------------------------------------------------------------------

describe("explainability — grounding invariants", () => {
  /**
   * THE CORE INVARIANT:
   * Every evidence item in an explanation must reference data that actually exists:
   * - record evidence: field name must be a key in the candidate's actual DataRecord.fields
   * - resume evidence: sourceDocumentId must be a real resume document ID with actual OCR text
   *
   * This is the anti-hallucination guarantee.
   */

  it("record evidence field names are always a subset of actual DataRecord field names", () => {
    const { fields, resumes, result } = CANDIDATE_FIXTURES.alice;
    const explanation = buildExplanation(
      ["typescript", "satellite", "ts/sci"],
      fields,
      resumes,
      result,
    );

    const actualFieldNames = new Set(Object.keys(fields));
    for (const item of explanation.evidence) {
      if (item.source === "record") {
        expect(actualFieldNames.has(item.field)).toBe(true);
      }
    }
  });

  it("resume evidence always references a real document ID", () => {
    const { fields, resumes, result } = CANDIDATE_FIXTURES.alice;
    const explanation = buildExplanation(
      ["satellite", "gps"],
      fields,
      resumes,
      result,
    );

    const actualDocIds = new Set(resumes.map((r) => r.id));
    for (const item of explanation.evidence) {
      if (item.source === "resume") {
        expect(item.sourceDocumentId).toBeDefined();
        expect(actualDocIds.has(item.sourceDocumentId!)).toBe(true);
      }
    }
  });

  it("resume evidence snippets contain text from the actual OCR content", () => {
    const { fields, resumes, result } = CANDIDATE_FIXTURES.alice;
    const explanation = buildExplanation(
      ["satellite"],
      fields,
      resumes,
      result,
    );

    const resumeEvidence = explanation.evidence.filter((e) => e.source === "resume");
    for (const item of resumeEvidence) {
      const doc = resumes.find((r) => r.id === item.sourceDocumentId);
      expect(doc).toBeDefined();
      // The snippet must be a substring of the actual OCR text (modulo ellipsis)
      const snippetCore = item.snippet!.replace(/^…/, "").replace(/…$/, "");
      expect(doc!.ocrText).toContain(snippetCore);
    }
  });

  it("never produces evidence for fields not in DataRecord", () => {
    const fields = { skills: "TypeScript" };
    const explanation = buildExplanation(
      ["clearance", "secret", "education"],
      fields,
      [],
      makeResult(),
    );

    // Query terms reference clearance/secret/education — but those fields don't exist
    const recordEvidence = explanation.evidence.filter((e) => e.source === "record");
    expect(recordEvidence).toHaveLength(0);
  });

  it("never produces resume evidence when no resumes exist", () => {
    const { fields, resumes, result } = CANDIDATE_FIXTURES.carol; // no resumes
    const explanation = buildExplanation(
      ["python", "data"],
      fields,
      resumes,
      result,
    );

    const resumeEvidence = explanation.evidence.filter((e) => e.source === "resume");
    expect(resumeEvidence).toHaveLength(0);
  });

  it("never produces evidence when DataRecord has no matching fields", () => {
    const { fields, resumes, result } = CANDIDATE_FIXTURES.empty;
    const explanation = buildExplanation(
      ["engineer", "satellite"],
      fields,
      resumes,
      result,
    );

    expect(explanation.evidence).toHaveLength(0);
  });

  it("grounding holds for ALL candidates in a batch", () => {
    const allCandidates = Object.values(CANDIDATE_FIXTURES);
    const queryTerms = extractQueryTerms("senior engineer TypeScript satellite TS/SCI");

    for (const candidate of allCandidates) {
      const explanation = buildExplanation(
        queryTerms,
        candidate.fields,
        candidate.resumes,
        candidate.result,
      );

      const actualFieldNames = new Set(Object.keys(candidate.fields));
      const actualDocIds = new Set(candidate.resumes.map((r) => r.id));

      for (const item of explanation.evidence) {
        if (item.source === "record") {
          expect(
            actualFieldNames.has(item.field),
            `Candidate ${candidate.result.candidateId}: evidence field "${item.field}" not in DataRecord`,
          ).toBe(true);
        } else if (item.source === "resume") {
          expect(
            item.sourceDocumentId,
            `Candidate ${candidate.result.candidateId}: resume evidence missing sourceDocumentId`,
          ).toBeDefined();
          expect(
            actualDocIds.has(item.sourceDocumentId!),
            `Candidate ${candidate.result.candidateId}: resume docId "${item.sourceDocumentId}" not in actual resumes`,
          ).toBe(true);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Grounding — edge cases (AC: 5)
// ---------------------------------------------------------------------------

describe("explainability — grounding edge cases", () => {
  it("handles null field values without producing evidence", () => {
    const fields = { skills: null, clearance: "TS/SCI" } as Record<string, unknown>;
    const explanation = buildExplanation(["ts/sci"], fields, [], makeResult());

    const recordEvidence = explanation.evidence.filter((e) => e.source === "record");
    // Should only reference clearance (not null skills)
    expect(recordEvidence).toHaveLength(1);
    expect(recordEvidence[0].field).toBe("clearance");
  });

  it("handles numeric field values (JSON stringified for matching)", () => {
    const fields = { yearsExperience: 15, skills: "TypeScript" };
    const explanation = buildExplanation(
      ["15"],
      fields as Record<string, unknown>,
      [],
      makeResult(),
    );

    const yearEvidence = explanation.evidence.filter((e) => e.field === "yearsExperience");
    expect(yearEvidence).toHaveLength(1);
  });

  it("handles array field values (JSON stringified for matching)", () => {
    const fields = { skills: ["TypeScript", "Python", "Rust"] };
    const explanation = buildExplanation(
      ["rust"],
      fields as Record<string, unknown>,
      [],
      makeResult(),
    );

    const skillsEvidence = explanation.evidence.filter((e) => e.field === "skills");
    expect(skillsEvidence).toHaveLength(1);
  });

  it("empty query terms produce no evidence", () => {
    const { fields, resumes, result } = CANDIDATE_FIXTURES.alice;
    const explanation = buildExplanation([], fields, resumes, result);

    expect(explanation.evidence).toHaveLength(0);
  });

  it("caps evidence at MAX_EVIDENCE_ITEMS even with many matching fields", () => {
    const fields: Record<string, unknown> = {};
    for (let i = 0; i < 20; i++) {
      fields[`field_${i}`] = `match_kw_${i}`;
    }
    const terms = Array.from({ length: 20 }, (_, i) => `match_kw_${i}`);

    const explanation = buildExplanation(terms, fields, [], makeResult());
    expect(explanation.evidence.length).toBeLessThanOrEqual(__private.MAX_EVIDENCE_ITEMS);
  });

  it("one evidence item per DataRecord field (no duplicates)", () => {
    const fields = { skills: "TypeScript Python JavaScript Rust Go" };
    const explanation = buildExplanation(
      ["typescript", "python", "javascript", "rust", "go"],
      fields,
      [],
      makeResult(),
    );

    const fieldNames = explanation.evidence
      .filter((e) => e.source === "record")
      .map((e) => e.field);

    // No duplicate field names
    expect(new Set(fieldNames).size).toBe(fieldNames.length);
  });

  it("one evidence item per resume document (no duplicates)", () => {
    const resumes = [
      { id: "doc-1", ocrText: "TypeScript Python JavaScript" },
      { id: "doc-2", ocrText: "Rust Go C++" },
    ];
    const explanation = buildExplanation(
      ["typescript", "rust"],
      {},
      resumes,
      makeResult(),
    );

    const docIds = explanation.evidence
      .filter((e) => e.source === "resume")
      .map((e) => e.sourceDocumentId);

    // No duplicate document IDs
    expect(new Set(docIds).size).toBe(docIds.length);
  });
});

// ---------------------------------------------------------------------------
// Integration pipeline: query → terms → explain → grounding (AC: 4)
// ---------------------------------------------------------------------------

describe("search → explain integration pipeline", () => {
  it("full pipeline: query terms → buildExplanation → grounding check", () => {
    const query = "senior engineer TypeScript satellite TS/SCI";
    const terms = extractQueryTerms(query);

    // Verify term extraction
    expect(terms).toContain("senior");
    expect(terms).toContain("engineer");
    expect(terms).toContain("typescript");
    expect(terms).toContain("satellite");
    expect(terms).toContain("ts/sci");

    // Build explanation for Alice (should match skills, clearance, experience, resume)
    const { fields, resumes, result } = CANDIDATE_FIXTURES.alice;
    const explanation = buildExplanation(terms, fields, resumes, result);

    // Verify evidence is grounded
    expect(explanation.evidence.length).toBeGreaterThan(0);
    for (const item of explanation.evidence) {
      if (item.source === "record") {
        expect(Object.keys(fields)).toContain(item.field);
      } else {
        expect(resumes.map((r) => r.id)).toContain(item.sourceDocumentId);
      }
    }

    // Verify summary references score
    expect(explanation.summary).toContain("90%"); // 0.899 rounds to 90%
  });

  it("pipeline produces different evidence for different candidates", () => {
    const terms = extractQueryTerms("TypeScript satellite clearance");

    const aliceExpl = buildExplanation(
      terms,
      CANDIDATE_FIXTURES.alice.fields,
      CANDIDATE_FIXTURES.alice.resumes,
      CANDIDATE_FIXTURES.alice.result,
    );

    const bobExpl = buildExplanation(
      terms,
      CANDIDATE_FIXTURES.bob.fields,
      CANDIDATE_FIXTURES.bob.resumes,
      CANDIDATE_FIXTURES.bob.result,
    );

    // Alice has TypeScript + satellite + clearance; Bob has clearance only
    expect(aliceExpl.evidence.length).toBeGreaterThan(bobExpl.evidence.length);
  });

  it("combined query from session history feeds correctly into term extraction", () => {
    const history: QueryHistoryEntry[] = [
      { query: "systems engineer", timestamp: "2026-03-01T00:00:00Z" },
      { query: "satellite experience", timestamp: "2026-03-01T00:01:00Z" },
      { query: "TS/SCI clearance", timestamp: "2026-03-01T00:02:00Z" },
    ];

    const combinedQuery = buildCombinedQuery(history);
    const terms = extractQueryTerms(combinedQuery);

    // Should include terms from all queries
    expect(terms).toContain("systems");
    expect(terms).toContain("engineer");
    expect(terms).toContain("satellite");
    expect(terms).toContain("experience");
    expect(terms).toContain("ts/sci");
    expect(terms).toContain("clearance");
  });

  it("query context matches human-readable expectation", () => {
    const history: QueryHistoryEntry[] = [
      { query: "engineer", timestamp: "2026-03-01T00:00:00Z" },
      { query: "satellite", timestamp: "2026-03-01T00:01:00Z" },
      { query: "TS/SCI", timestamp: "2026-03-01T00:02:00Z" },
    ];

    expect(buildQueryContext(history)).toBe("engineer → satellite → TS/SCI");
  });

  it("evidence is consistent with search query terms (no unrelated evidence)", () => {
    const terms = extractQueryTerms("python data");

    const { fields, resumes, result } = CANDIDATE_FIXTURES.carol;
    const explanation = buildExplanation(terms, fields, resumes, result);

    // All record evidence should reference fields containing "python" or "data"
    for (const item of explanation.evidence) {
      if (item.source === "record") {
        const fieldValue = String(fields[item.field as keyof typeof fields] ?? "").toLowerCase();
        const matchesSomeTerm = terms.some((t) => fieldValue.includes(t));
        expect(
          matchesSomeTerm,
          `Evidence field "${item.field}" (value: "${fieldValue}") does not match any query term`,
        ).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Score combination sanity (cross-check with hybridSearch weights)
// ---------------------------------------------------------------------------

describe("score combination cross-checks", () => {
  const { SEMANTIC_WEIGHT, LEXICAL_WEIGHT } = hybridPrivate;

  it("weights sum to 1.0", () => {
    expect(SEMANTIC_WEIGHT + LEXICAL_WEIGHT).toBe(1);
  });

  it("semantic weight is dominant (0.7)", () => {
    expect(SEMANTIC_WEIGHT).toBe(0.7);
    expect(SEMANTIC_WEIGHT).toBeGreaterThan(LEXICAL_WEIGHT);
  });

  it("candidate with high semantic + low lexical can outrank low semantic + high lexical", () => {
    // Alice: sem=0.92, lex=0.85 → 0.7*0.92 + 0.3*0.85 = 0.899
    // Bob:   sem=0.78, lex=0.95 → 0.7*0.78 + 0.3*0.95 = 0.831
    // Even though Bob has higher lexical, Alice wins due to semantic weight
    const aliceScore = SEMANTIC_WEIGHT * 0.92 + LEXICAL_WEIGHT * 0.85;
    const bobScore = SEMANTIC_WEIGHT * 0.78 + LEXICAL_WEIGHT * 0.95;
    expect(aliceScore).toBeGreaterThan(bobScore);
  });
});

// ---------------------------------------------------------------------------
// extractSnippet edge cases (AC: 5)
// ---------------------------------------------------------------------------

describe("extractSnippet — additional edge cases", () => {
  it("handles very long text without crashing", () => {
    const longText = "TypeScript ".repeat(10000);
    const snippet = extractSnippet(longText, "typescript");
    expect(snippet.length).toBeLessThanOrEqual(__private.MAX_SNIPPET_LENGTH + 2); // +2 for ellipses
  });

  it("is case-insensitive for term matching", () => {
    const snippet = extractSnippet("Expert in TypeScript", "typescript");
    expect(snippet).toContain("TypeScript");
  });

  it("handles term at very beginning of text", () => {
    const snippet = extractSnippet("TypeScript is great", "typescript");
    expect(snippet.startsWith("…")).toBe(false);
    expect(snippet).toContain("TypeScript");
  });

  it("handles term at very end of text", () => {
    const text = "The candidate knows TypeScript";
    const snippet = extractSnippet(text, "typescript");
    expect(snippet.endsWith("…")).toBe(false);
    expect(snippet).toContain("TypeScript");
  });

  it("returns beginning of text when term is not found", () => {
    const snippet = extractSnippet("Some completely unrelated text", "zzzzz");
    expect(snippet).toBe("Some completely unrelated text");
  });
});

// ---------------------------------------------------------------------------
// extractQueryTerms — additional edge cases (AC: 5)
// ---------------------------------------------------------------------------

describe("extractQueryTerms — additional edge cases", () => {
  it("handles special characters in query (slashes, hyphens)", () => {
    const terms = extractQueryTerms("TS/SCI C++ .NET");
    expect(terms).toContain("ts/sci");
    expect(terms).toContain("c++");
    expect(terms).toContain(".net");
  });

  it("handles very long query without crashing", () => {
    const longQuery = "engineer ".repeat(500);
    const terms = extractQueryTerms(longQuery);
    expect(terms).toContain("engineer");
    expect(terms).toHaveLength(1); // deduplicated
  });

  it("preserves meaningful short terms (>= MIN_TERM_LENGTH)", () => {
    const terms = extractQueryTerms("AI ML C# Go");
    expect(terms).toContain("ai");
    expect(terms).toContain("ml");
    expect(terms).toContain("c#");
    expect(terms).toContain("go");
  });

  it("filters out single-character terms", () => {
    const terms = extractQueryTerms("a b c engineer");
    expect(terms).not.toContain("a");
    expect(terms).not.toContain("b");
    expect(terms).not.toContain("c");
    expect(terms).toContain("engineer");
  });
});
