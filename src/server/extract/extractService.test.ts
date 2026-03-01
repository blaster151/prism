import { describe, expect, it, vi } from "vitest";

const resumeDocument = { id: "rd1", candidateId: "c1", ocrText: "Jane Doe\njane@example.com" };

const findUniqueMock = vi.hoisted(() => vi.fn(async () => resumeDocument));
const updateDocMock = vi.hoisted(() => vi.fn(async () => ({ id: "rd1" })));

const dataRecordFindMock = vi.hoisted(() => vi.fn(async () => ({ id: "dr1", fields: { email: "old@example.com" } })));
const dataRecordCreateMock = vi.hoisted(() => vi.fn());
const dataRecordUpdateMock = vi.hoisted(() => vi.fn(async () => ({ id: "dr1", fields: { email: "old@example.com" } })));

const provFindMock = vi.hoisted(() => vi.fn(async () => null));
const provCreateMock = vi.hoisted(() => vi.fn(async () => ({ id: "p1" })));
const provUpdateMock = vi.hoisted(() => vi.fn(async () => ({ id: "p1" })));

const suggestionDeleteManyMock = vi.hoisted(() => vi.fn(async () => ({ count: 0 })));
const suggestionCreateMock = vi.hoisted(() => vi.fn(async () => ({ id: "s1" })));

const versionAggMock = vi.hoisted(() => vi.fn(async () => ({ _max: { versionNumber: 0 } })));
const versionCreateMock = vi.hoisted(() => vi.fn(async () => ({ id: "v1" })));

const auditLogMock = vi.hoisted(() => vi.fn(async () => ({ id: "ae_1" })));

vi.mock("@/server/db/prisma", () => {
  const tx = {
    resumeDocument: { findUnique: findUniqueMock, update: updateDocMock },
    dataRecord: {
      findUnique: dataRecordFindMock,
      create: dataRecordCreateMock,
      update: dataRecordUpdateMock,
    },
    dataRecordFieldProvenance: {
      findFirst: provFindMock,
      create: provCreateMock,
      update: provUpdateMock,
    },
    extractionSuggestion: {
      deleteMany: suggestionDeleteManyMock,
      create: suggestionCreateMock,
    },
    dataRecordVersion: {
      aggregate: versionAggMock,
      create: versionCreateMock,
    },
  };

  return {
    prisma: {
      resumeDocument: tx.resumeDocument,
      $transaction: async (fn: any) => await fn(tx),
    },
  };
});

vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: auditLogMock,
}));

vi.mock("./provider", () => ({
  getExtractProvider: () => ({
    name: "noop",
    extract: vi.fn(async () => ({
      provider: "noop",
      fields: [{ fieldName: "email", value: "new@example.com", source: "EXTRACTED" }],
      model: { name: "m" },
    })),
  }),
}));

import { runExtractionForResumeDocument } from "./extractService";

describe("extractService", () => {
  it("stages factual overwrite instead of silently applying", async () => {
    const res = await runExtractionForResumeDocument({ session: null, resumeDocumentId: "rd1" });
    expect(res.ok).toBe(true);
    expect(suggestionCreateMock).toHaveBeenCalled();
    expect(dataRecordUpdateMock).not.toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalled();
  });
});

