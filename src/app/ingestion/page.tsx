import { Suspense } from "react";

import { IngestionStatusClient } from "./status-client";

export default function IngestionPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Ingestion</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Trigger ingestion and view recent job status.
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="text-sm">Loading…</div>}>
          <IngestionStatusClient />
        </Suspense>
      </div>
    </main>
  );
}

