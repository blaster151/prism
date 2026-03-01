import { prisma } from "@/server/db/prisma";
import type { Explanation, EvidenceItem, SearchResult } from "@/server/search/types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Maximum number of evidence items per candidate. */
const MAX_EVIDENCE_ITEMS = 8;

/** Maximum snippet length in characters. */
const MAX_SNIPPET_LENGTH = 200;

/** Minimum query-term length to consider for matching. */
const MIN_TERM_LENGTH = 2;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate grounded explanations for search results.
 *
 * Uses deterministic keyword matching (no LLM) — fast, always grounded, testable.
 * Every evidence item references an actual DataRecord field value or resume text.
 */
export async function explainResults(args: {
  query: string;
  results: SearchResult[];
}): Promise<SearchResult[]> {
  if (args.results.length === 0) return args.results;

  const candidateIds = args.results.map((r) => r.candidateId);

  // Batch-load DataRecords and ResumeDocuments for all result candidates
  const [dataRecords, resumeDocs] = await Promise.all([
    prisma.dataRecord.findMany({
      where: { candidateId: { in: candidateIds } },
      select: { candidateId: true, fields: true },
    }),
    prisma.resumeDocument.findMany({
      where: {
        candidateId: { in: candidateIds },
        ocrText: { not: null },
      },
      select: { id: true, candidateId: true, ocrText: true },
    }),
  ]);

  const recordMap = new Map(dataRecords.map((r) => [r.candidateId, r.fields as Record<string, unknown>]));
  const resumeMap = new Map<string, { id: string; ocrText: string }[]>();
  for (const doc of resumeDocs) {
    const list = resumeMap.get(doc.candidateId) ?? [];
    list.push({ id: doc.id, ocrText: doc.ocrText! });
    resumeMap.set(doc.candidateId, list);
  }

  const queryTerms = extractQueryTerms(args.query);

  return args.results.map((result) => {
    const fields = recordMap.get(result.candidateId) ?? {};
    const resumes = resumeMap.get(result.candidateId) ?? [];
    const explanation = buildExplanation(queryTerms, fields, resumes, result);
    return { ...result, explanation };
  });
}

// ---------------------------------------------------------------------------
// Internal helpers (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Extract meaningful search terms from the query.
 * Lowercased, deduplicated, minimum length filter applied.
 */
export function extractQueryTerms(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const unique = [...new Set(words)].filter((w) => w.length >= MIN_TERM_LENGTH);
  return unique;
}

/**
 * Build a grounded explanation for a single search result.
 *
 * 1. Match query terms against DataRecord field values → record evidence.
 * 2. Match query terms against resume OCR text → resume evidence.
 * 3. Generate summary from top evidence items.
 * 4. Every evidence item is guaranteed grounded (references actual data).
 */
export function buildExplanation(
  queryTerms: string[],
  fields: Record<string, unknown>,
  resumes: { id: string; ocrText: string }[],
  result: SearchResult,
): Explanation {
  const evidence: EvidenceItem[] = [];

  // --- Record-based evidence ---
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value == null) continue;
    const valueStr = typeof value === "string" ? value : JSON.stringify(value);
    const valueLower = valueStr.toLowerCase();

    for (const term of queryTerms) {
      if (valueLower.includes(term)) {
        const snippet = extractSnippet(valueStr, term);
        evidence.push({
          field: fieldName,
          snippet,
          source: "record",
        });
        break; // one evidence item per field
      }
    }
  }

  // --- Resume-based evidence ---
  for (const resume of resumes) {
    const textLower = resume.ocrText.toLowerCase();
    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        const snippet = extractSnippet(resume.ocrText, term);
        evidence.push({
          field: "resumeText",
          snippet,
          source: "resume",
          sourceDocumentId: resume.id,
        });
        break; // one evidence item per resume document
      }
    }
  }

  // Cap evidence items
  const cappedEvidence = evidence.slice(0, MAX_EVIDENCE_ITEMS);

  const summary = buildSummary(cappedEvidence, result);

  return { summary, evidence: cappedEvidence };
}

/**
 * Extract a snippet of text around the first occurrence of a term.
 */
export function extractSnippet(text: string, term: string): string {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text.slice(0, MAX_SNIPPET_LENGTH);

  const contextPad = Math.floor((MAX_SNIPPET_LENGTH - term.length) / 2);
  const start = Math.max(0, idx - contextPad);
  const end = Math.min(text.length, idx + term.length + contextPad);
  let snippet = text.slice(start, end).trim();

  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";

  return snippet;
}

/**
 * Build a human-readable summary from evidence items.
 */
function buildSummary(evidence: EvidenceItem[], result: SearchResult): string {
  if (evidence.length === 0) {
    const pct = Math.round(result.score * 100);
    return `Matched with ${pct}% relevance based on overall profile similarity.`;
  }

  const recordFields = evidence
    .filter((e) => e.source === "record")
    .map((e) => e.field);
  const hasResume = evidence.some((e) => e.source === "resume");

  const parts: string[] = [];
  if (recordFields.length > 0) {
    const fieldList = recordFields.slice(0, 4).join(", ");
    parts.push(`matched on ${fieldList}`);
  }
  if (hasResume) {
    parts.push("supported by resume content");
  }

  const pct = Math.round(result.score * 100);
  return `${pct}% match: ${parts.join("; ")}.`;
}

// Exported for testing
export const __private = {
  MAX_EVIDENCE_ITEMS,
  MAX_SNIPPET_LENGTH,
  MIN_TERM_LENGTH,
  extractQueryTerms,
  buildExplanation,
  extractSnippet,
  buildSummary,
};
