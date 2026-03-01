import { SearchPage } from "./SearchPage";

export const metadata = {
  title: "Search — Prism",
};

export default function Page() {
  return (
    <div className="min-h-screen p-8 sm:p-12">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold mb-2">Search</h1>
        <p className="text-sm text-black/60 dark:text-white/60 mb-6">
          Describe the candidate you need. Results are ranked by relevance.
        </p>
        <SearchPage />
      </div>
    </div>
  );
}
