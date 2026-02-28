import { describe, expect, it } from "vitest";

import {
  CandidateLifecycleState,
  DataProvenanceSource,
  DocumentProcessingStatus,
  ShortlistItemState,
} from "@prisma/client";

describe("prisma schema invariants", () => {
  it("includes expected enums for lifecycle/provenance/shortlists", () => {
    expect(CandidateLifecycleState.ACTIVE).toBe("ACTIVE");
    expect(CandidateLifecycleState.ARCHIVE).toBe("ARCHIVE");

    expect(DataProvenanceSource.EXTRACTED).toBe("EXTRACTED");
    expect(DataProvenanceSource.USER_EDITED).toBe("USER_EDITED");

    expect(DocumentProcessingStatus.PENDING).toBe("PENDING");
    expect(DocumentProcessingStatus.COMPLETE).toBe("COMPLETE");

    expect(ShortlistItemState.SUGGESTED).toBe("SUGGESTED");
    expect(ShortlistItemState.PINNED).toBe("PINNED");
  });
});

