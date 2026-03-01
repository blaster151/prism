import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";
import { getCandidateRecord } from "@/server/records/dataRecordService";

import { DataRecordForm } from "./DataRecordForm";

export default async function CandidateRecordPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await props.params;

  const data = await getCandidateRecord({ user: session?.user, candidateId: id });
  if (!data) {
    return (
      <div className="min-h-screen p-8 sm:p-12">
        <h1 className="text-2xl font-semibold mb-2">Data Record</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Candidate not found.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:p-12">
      <h1 className="text-2xl font-semibold mb-2">Data Record</h1>
      <p className="text-sm text-black/60 dark:text-white/60 mb-6">
        Edit key fields with provenance indicators (Story 2.3).
      </p>
      <DataRecordForm candidateId={id} initial={data} />
    </div>
  );
}

