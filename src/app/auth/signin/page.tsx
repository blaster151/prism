import { Suspense } from "react";

import { SignInClient } from "./signin-client";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-black/10 dark:border-white/15 p-6">
            Loading…
          </div>
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}

