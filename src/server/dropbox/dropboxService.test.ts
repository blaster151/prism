import { describe, expect, it, vi } from "vitest";

const filesListFolderMock = vi.fn(async () => ({
  result: {
    entries: [
      {
        ".tag": "file",
        id: "id:1",
        name: "resume.pdf",
        path_lower: "/resume.pdf",
        client_modified: "2026-01-01T00:00:00Z",
        server_modified: "2026-01-01T00:00:00Z",
        size: 123,
        content_hash: "hash",
      },
    ],
  },
}));

vi.mock("dropbox", () => ({
  Dropbox: class {
    filesListFolder = filesListFolderMock;
    constructor() {}
  },
}));

vi.mock("./dropboxConfig", () => ({
  getDropboxAccessToken: vi.fn(() => "token"),
  getDropboxRootPath: vi.fn(() => "/"),
}));

const auditLogMock = vi.fn(async () => ({ id: "ae_1" }));
vi.mock("@/server/audit/auditLogger", () => ({
  auditLog: auditLogMock,
}));

vi.mock("@/server/auth/requireRole", () => ({
  requireRole: vi.fn(() => undefined),
}));

import { listDropboxRoot } from "./dropboxService";

describe("dropboxService", () => {
  it("lists root and normalizes entries", async () => {
    const session = {
      user: { id: "u1", role: "POWER_USER" },
      expires: "2099-01-01T00:00:00.000Z",
    };
    const res = await listDropboxRoot({
      session: session as unknown as import("next-auth").Session,
    });
    expect(res.entries).toHaveLength(1);
    expect(res.entries[0]?.name).toBe("resume.pdf");
    expect(filesListFolderMock).toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalled();
  });
});

