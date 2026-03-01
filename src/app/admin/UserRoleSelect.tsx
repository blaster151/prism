"use client";

import { useState } from "react";

import { UserRole } from "@/server/auth/rbac";

export function UserRoleSelect(props: {
  userId: string;
  initialRole: UserRole;
}) {
  const [role, setRole] = useState<UserRole>(props.initialRole);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function save(nextRole: UserRole) {
    setRole(nextRole);
    setStatus("saving");
    try {
      const res = await fetch(`/api/admin/users/${props.userId}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => save(e.target.value as UserRole)}
        disabled={status === "saving"}
        className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1 text-sm"
      >
        <option value={UserRole.ADMIN}>ADMIN</option>
        <option value={UserRole.POWER_USER}>POWER_USER</option>
      </select>
      <span className="text-xs text-black/60 dark:text-white/60">
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved"
            : status === "error"
              ? "Error"
              : ""}
      </span>
    </div>
  );
}

