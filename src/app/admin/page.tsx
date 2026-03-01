import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { UserRole } from "@/server/auth/rbac";
import { adminPing } from "@/server/admin/adminService";
import { listUsers } from "@/server/admin/usersService";
import { isAppError } from "@/lib/errors";

import { UserRoleSelect } from "./UserRoleSelect";

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

  const { users } = await listUsers({ user: session?.user });

  return (
    <div className="min-h-screen p-8 sm:p-12">
      <h1 className="text-2xl font-semibold mb-2">Admin</h1>
      <p className="text-sm text-black/60 dark:text-white/60 mb-6">
        User management (Story 1.7).
      </p>
      <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="p-4 text-sm border-b border-black/10 dark:border-white/15">
          <div>
            <span className="font-medium">Signed in:</span> {session?.user?.email}
          </div>
          <div>
            <span className="font-medium">Role:</span>{" "}
            {session?.user?.role ?? UserRole.POWER_USER}
          </div>
        </div>

        <div className="p-4">
          <div className="text-sm font-medium mb-3">Users</div>
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-4 rounded-md border border-black/10 dark:border-white/15 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{u.email}</div>
                  <div className="text-xs text-black/60 dark:text-white/60">
                    {u.status}
                  </div>
                </div>
                <UserRoleSelect userId={u.id} initialRole={u.role} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

