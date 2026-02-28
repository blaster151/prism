import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen p-8 sm:p-12">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-2">Prism</h1>
        <p className="text-sm text-black/60 dark:text-white/60 mb-6">
          Authenticated baseline (Story 1.4).
        </p>

        <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
          <div className="text-sm">
            <div>
              <span className="font-medium">User:</span>{" "}
              {session?.user?.email ?? "unknown"}
            </div>
            <div>
              <span className="font-medium">Role:</span>{" "}
              {session?.user?.role ?? "unknown"}
            </div>
          </div>
          <div className="mt-4 text-sm">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
