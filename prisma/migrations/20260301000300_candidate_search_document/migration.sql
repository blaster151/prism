-- Candidate FTS document storage
CREATE TABLE "candidate_search_document" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "candidate_id" UUID NOT NULL,
  "fts_text" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "candidate_search_document_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "candidate_search_document_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "candidate_search_document_candidate_id_key" ON "candidate_search_document"("candidate_id");
CREATE INDEX "candidate_search_document_candidate_id_idx" ON "candidate_search_document"("candidate_id");

-- Postgres FTS index (expression GIN) for lexical fallback.
CREATE INDEX "candidate_search_document_fts_gin_idx"
  ON "candidate_search_document" USING GIN (to_tsvector('english', "fts_text"));

