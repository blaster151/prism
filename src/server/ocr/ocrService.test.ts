import { describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.hoisted(() => vi.fn(async () => ({ id: "rd1", ocrStatus: "PENDING" })));
const updateMock = vi.hoisted(() => vi.fn(async () => ({ id: "rd1" })));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    resumeDocument: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

vi.mock("./provider", () => ({
  getOcrProvider: () => ({
    name: "noop",
    ocrPdf: vi.fn(async () => ({ provider: "noop", text: "hello", pageCount: 1 })),
  }),
}));

const auditLogMock = vi.hoisted(() => vi.fn(async () => ({ id: "ae_1" })));
vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: auditLogMock,
}));

import { runOcrForResumeDocument } from "./ocrService";

describe("ocrService", () => {
  it("stores OCR text on ResumeDocument", async () => {
    const res = await runOcrForResumeDocument({
      session: null,
      resumeDocumentId: "rd1",
      pdfBase64: Buffer.from("pdf").toString("base64"),
    });
    expect(res.ok).toBe(true);
    expect(updateMock).toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalled();
  });
});

