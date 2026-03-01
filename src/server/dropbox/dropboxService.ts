import type { Session } from "next-auth";

import { AppError } from "@/lib/errors";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";
import { requireRole } from "@/server/auth/requireRole";
import { UserRole } from "@/server/auth/rbac";

import { createDropboxClient } from "./dropboxClient";
import { getDropboxRootPath } from "./dropboxConfig";
import type { DropboxListEntry } from "./dropboxTypes";

function normalizeDropboxError(err: unknown) {
  // Avoid leaking tokens; keep error details generic.
  const message = err instanceof Error ? err.message : "Dropbox error";
  return new AppError({
    code: "DROPBOX_ERROR",
    message: "Dropbox request failed.",
    httpStatus: 502,
    details: { message },
  });
}

type DropboxSdkEntry = {
  ".tag"?: "file" | "folder" | string;
  id?: string;
  name?: string;
  path_lower?: string;
  client_modified?: string;
  server_modified?: string;
  size?: number;
  content_hash?: string;
};

function toListEntry(e: unknown): DropboxListEntry | null {
  if (!e || typeof e !== "object") return null;
  const entry = e as DropboxSdkEntry;
  if (!entry.id || !entry.name) return null;
  const tag = entry[".tag"];
  const base: DropboxListEntry = {
    id: entry.id,
    name: entry.name,
    pathLower: entry.path_lower ?? null,
    type: tag === "folder" ? "folder" : "file",
  };

  if (tag === "file") {
    base.clientModified = entry.client_modified;
    base.serverModified = entry.server_modified;
    base.size = entry.size;
    base.contentHash = entry.content_hash;
  }

  return base;
}

export async function listDropboxRoot(args: { session: Session | null }) {
  requireRole({ user: args.session?.user, requiredRole: UserRole.POWER_USER });

  const dbx = createDropboxClient();
  const path = getDropboxRootPath();

  try {
    const resp = await dbx.filesListFolder({
      path,
      include_deleted: false,
      include_media_info: false,
      include_mounted_folders: true,
      include_non_downloadable_files: true,
      recursive: false,
    });

    const entries = (resp.result.entries ?? [])
      .map((e) => toListEntry(e))
      .filter((e): e is DropboxListEntry => e !== null);

    await auditLog({
      actorUserId: args.session?.user?.id,
      eventType: AuditEventTypes.DropboxListFolder,
      entityType: "dropbox",
      entityId: path || "/",
      metadata: { action: "listRoot", entryCount: entries.length },
    });

    return { path, entries };
  } catch (err) {
    await auditLog({
      actorUserId: args.session?.user?.id,
      eventType: AuditEventTypes.DropboxListFolder,
      entityType: "dropbox",
      entityId: path || "/",
      metadata: { action: "listRoot", ok: false },
    });

    throw normalizeDropboxError(err);
  }
}

