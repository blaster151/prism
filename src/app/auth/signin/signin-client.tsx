"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function SignInClient() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl,
    });

    if (res?.error) setError(res.error);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-black/10 dark:border-white/15 p-6 bg-white/60 dark:bg-black/20 backdrop-blur">
        <h1 className="text-xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-black/60 dark:text-white/60 mb-6">
          Prism requires an authenticated session.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="mt-1 w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
            />
          </label>

          {error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 font-medium disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <div className="text-xs text-black/60 dark:text-white/60">
            If no users exist yet, set <code>PRISM_ALLOW_USER_CREATE=true</code>{" "}
            to bootstrap the first account.
          </div>
        </form>
      </div>
    </div>
  );
}

