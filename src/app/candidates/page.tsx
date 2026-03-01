import { CandidateList } from "./CandidateList";

export default function CandidatesPage() {
  return (
    <div className="min-h-screen p-8 sm:p-12">
      <h1 className="text-2xl font-semibold mb-2">Candidates</h1>
      <p className="text-sm text-black/60 dark:text-white/60 mb-6">
        Lifecycle filter + archive toggle (Story 2.2).
      </p>
      <CandidateList />
    </div>
  );
}

