import { describe, expect, it } from "vitest";
import { DataProvenanceSource } from "@prisma/client";

import { computeExtractionChanges } from "./extractionLogic";

describe("computeExtractionChanges", () => {
  it("stages factual-field overwrite when existing differs", () => {
    const res = computeExtractionChanges({
      existingFields: { email: "old@example.com" },
      extracted: [
        { fieldName: "email", value: "new@example.com", source: DataProvenanceSource.EXTRACTED },
      ],
    });
    expect(res.applied).toHaveLength(0);
    expect(res.staged).toHaveLength(1);
    expect(res.staged[0]?.fieldName).toBe("email");
  });

  it("applies when existing empty", () => {
    const res = computeExtractionChanges({
      existingFields: { email: "" },
      extracted: [
        { fieldName: "email", value: "new@example.com", source: DataProvenanceSource.EXTRACTED },
      ],
    });
    expect(res.applied).toHaveLength(1);
    expect(res.staged).toHaveLength(0);
  });
});

