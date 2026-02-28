import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { UserRole } from "@/server/auth/rbac";
import { adminPing } from "@/server/admin/adminService";
import { isAppError } from "@/lib/errors";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  try {
    await adminPing({ user: session?.user });
  } catch (err) {
    if (isAppError(err)) {
      return (
        <div className="min-h-screen p-8 sm:p-12">
          <h1 className="text-2xl font-semibold mb-2">Admin</h1>
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <div className="text-sm font-medium">{err.code}</div>
            <div className="text-sm text-black/70 dark:text-white/70">
              {err.message}
            </div>
          </div>
        </div>
      );
    }
    throw err;
  }

  return (
    <div className="min-h-screen p-8 sm:p-12">
      <h1 className="text-2xl font-semibold mb-2">Admin</h1>
      <p className="text-sm text-black/60 dark:text-white/60 mb-6">
        RBAC-protected area (Story 1.5).
      </p>
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 text-sm">
        <div>
          <span className="font-medium">User:</span> {session?.user?.email}
        </div>
        <div>
          <span className="font-medium">Role:</span>{" "}
          {session?.user?.role ?? UserRole.POWER_USER}
        </div>
      </div>
    </div>
  );
}

