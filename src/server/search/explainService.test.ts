import { describe, expect, it } from "vitest";

import {
  extractQueryTerms,
  buildExplanation,
  extractSnippet,
  __private,
} from "@/server/search/explainService";
import type { SearchResult, EvidenceItem } from "@/server/search/types";

// ---------------------------------------------------------------------------
// Helper: minimal SearchResult for tests
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
// extractQueryTerms
// ---------------------------------------------------------------------------

describe("extractQueryTerms", () => {
  it("lowercases and splits on whitespace", () => {
    const terms = extractQueryTerms("Senior Engineer TS/SCI");
    expect(terms).toEqual(["senior", "engineer", "ts/sci"]);
  });

  it("deduplicates terms", () => {
    const terms = extractQueryTerms("java Java JAVA");
    expect(terms).toEqual(["java"]);
  });

  it("filters out short terms (< MIN_TERM_LENGTH)", () => {
    const terms = extractQueryTerms("a an the AWS");
    expect(terms).toEqual(["an", "the", "aws"]);
  });

  it("handles empty query", () => {
    expect(extractQueryTerms("")).toEqual([]);
    expect(extractQueryTerms("   ")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractSnippet
// ---------------------------------------------------------------------------

describe("extractSnippet", () => {
  it("extracts context around the matched term", () => {
    const text = "The candidate has 10 years of satellite systems engineering experience.";
    const snippet = extractSnippet(text, "satellite");
    expect(snippet).toContain("satellite");
  });

  it("adds ellipsis when snippet is truncated at start", () => {
    const text = "x".repeat(300) + " satellite " + "y".repeat(300);
    const snippet = extractSnippet(text, "satellite");
    expect(snippet.startsWith("…")).toBe(true);
    expect(snippet.endsWith("…")).toBe(true);
    expect(snippet).toContain("satellite");
  });

  it("does not add ellipsis when text is short", () => {
    const snippet = extractSnippet("satellite expert", "satellite");
    expect(snippet.startsWith("…")).toBe(false);
    expect(snippet.endsWith("…")).toBe(false);
  });

  it("returns beginning of text if term not found", () => {
    const snippet = extractSnippet("some text here", "zzzzz");
    expect(snippet).toBe("some text here");
  });
});

// ---------------------------------------------------------------------------
// buildExplanation — grounding
// ---------------------------------------------------------------------------

describe("buildExplanation — grounding", () => {
  it("produces record evidence only for fields that exist in DataRecord", () => {
    const fields = { skills: "TypeScript, Python", clearance: "TS/SCI" };
    const explanation = buildExplanation(
      ["typescript", "python"],
      fields,
      [],
      makeResult(),
    );

    expect(explanation.evidence.length).toBeGreaterThan(0);
    for (const item of explanation.evidence) {
      expect(item.source).toBe("record");
      // Every evidence item must reference an actual field
      expect(Object.keys(fields)).toContain(item.field);
    }
  });

  it("does NOT produce evidence for fields not in DataRecord", () => {
    const fields = { skills: "TypeScript" };
    const explanation = buildExplanation(
      ["clearance"], // no "clearance" field exists
      fields,
      [],
      makeResult(),
    );

    const recordEvidence = explanation.evidence.filter((e) => e.source === "record");
    expect(recordEvidence).toHaveLength(0);
  });

  it("produces resume evidence with sourceDocumentId", () => {
    const resumes = [
      { id: "doc-1", ocrText: "Lead Systems Engineer on GPS III satellite program" },
    ];
    const explanation = buildExplanation(
      ["satellite"],
      {},
      resumes,
      makeResult(),
    );

    const resumeEvidence = explanation.evidence.filter((e) => e.source === "resume");
    expect(resumeEvidence.length).toBeGreaterThan(0);
    expect(resumeEvidence[0].sourceDocumentId).toBe("doc-1");
    expect(resumeEvidence[0].snippet).toContain("satellite");
  });

  it("produces one evidence item per field (no duplicates)", () => {
    const fields = { skills: "TypeScript, Python, JavaScript" };
    const explanation = buildExplanation(
      ["typescript", "python", "javascript"],
      fields,
      [],
      makeResult(),
    );

    const skillsEvidence = explanation.evidence.filter((e) => e.field === "skills");
    expect(skillsEvidence).toHaveLength(1); // only one per field
  });

  it("produces one evidence item per resume document", () => {
    const resumes = [
      { id: "doc-1", ocrText: "TypeScript Python JavaScript developer" },
    ];
    const explanation = buildExplanation(
      ["typescript", "python", "javascript"],
      {},
      resumes,
      makeResult(),
    );

    const resumeEvidence = explanation.evidence.filter((e) => e.source === "resume");
    expect(resumeEvidence).toHaveLength(1); // one per document
  });

  it("caps evidence items at MAX_EVIDENCE_ITEMS", () => {
    const fields: Record<string, unknown> = {};
    for (let i = 0; i < 20; i++) {
      fields[`field${i}`] = `match_term_${i}`;
    }
    const terms = Array.from({ length: 20 }, (_, i) => `match_term_${i}`);

    const explanation = buildExplanation(terms, fields, [], makeResult());
    expect(explanation.evidence.length).toBeLessThanOrEqual(__private.MAX_EVIDENCE_ITEMS);
  });
});

// ---------------------------------------------------------------------------
// buildExplanation — edge cases
// ---------------------------------------------------------------------------

describe("buildExplanation — edge cases", () => {
  it("handles empty fields and no resumes", () => {
    const explanation = buildExplanation(
      ["engineer"],
      {},
      [],
      makeResult(),
    );

    expect(explanation.evidence).toHaveLength(0);
    expect(explanation.summary).toContain("85%");
    expect(explanation.summary).toContain("similarity");
  });

  it("handles null field values gracefully", () => {
    const fields = { skills: null, clearance: "TS/SCI" };
    const explanation = buildExplanation(
      ["ts/sci"],
      fields as Record<string, unknown>,
      [],
      makeResult(),
    );

    // Should find clearance, skip null skills
    const recordEvidence = explanation.evidence.filter((e) => e.source === "record");
    expect(recordEvidence).toHaveLength(1);
    expect(recordEvidence[0].field).toBe("clearance");
  });

  it("handles non-string field values (JSON stringified)", () => {
    const fields = { yearsExperience: 12, skills: ["TypeScript", "Python"] };
    const explanation = buildExplanation(
      ["typescript"],
      fields as Record<string, unknown>,
      [],
      makeResult(),
    );

    // skills array is JSON.stringified → "["TypeScript","Python"]" → matches "typescript"
    const evidence = explanation.evidence.filter((e) => e.field === "skills");
    expect(evidence).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// buildExplanation — summary
// ---------------------------------------------------------------------------

describe("buildExplanation — summary", () => {
  it("mentions matched fields in summary", () => {
    const explanation = buildExplanation(
      ["typescript"],
      { skills: "TypeScript" },
      [],
      makeResult(),
    );

    expect(explanation.summary).toContain("skills");
    expect(explanation.summary).toContain("85%");
  });

  it("mentions resume support in summary when resume evidence exists", () => {
    const explanation = buildExplanation(
      ["satellite"],
      {},
      [{ id: "doc-1", ocrText: "satellite systems" }],
      makeResult(),
    );

    expect(explanation.summary).toContain("resume");
  });

  it("produces a fallback summary when no evidence is found", () => {
    const explanation = buildExplanation(
      ["zzzznotfound"],
      { skills: "TypeScript" },
      [],
      makeResult(),
    );

    expect(explanation.summary).toContain("similarity");
  });
});
