import { describe, expect, it } from "vitest";

import {
  Prisma,
} from "@prisma/client";

describe("prisma schema invariants", () => {
  it("includes expected enums for lifecycle/provenance/shortlists", () => {
    expect(Prisma.CandidateLifecycleState.ACTIVE).toBe("ACTIVE");
    expect(Prisma.CandidateLifecycleState.ARCHIVE).toBe("ARCHIVE");

    expect(Prisma.DataProvenanceSource.EXTRACTED).toBe("EXTRACTED");
    expect(Prisma.DataProvenanceSource.USER_EDITED).toBe("USER_EDITED");

    expect(Prisma.DocumentProcessingStatus.PENDING).toBe("PENDING");
    expect(Prisma.DocumentProcessingStatus.COMPLETE).toBe("COMPLETE");

    expect(Prisma.ShortlistItemState.SUGGESTED).toBe("SUGGESTED");
    expect(Prisma.ShortlistItemState.PINNED).toBe("PINNED");
  });
});

