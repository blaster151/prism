-- Extraction suggestion staging (for factual-field overwrites)
CREATE TYPE "ExtractionSuggestionStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED');

CREATE TABLE "extraction_suggestion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "resume_document_id" UUID NOT NULL,
  "candidate_id" UUID NOT NULL,
  "field_name" TEXT NOT NULL,
  "existing_value" TEXT,
  "suggested_value" TEXT NOT NULL,
  "source" "DataProvenanceSource" NOT NULL,
  "status" "ExtractionSuggestionStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "extraction_suggestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "extraction_suggestion_resume_document_id_fkey"
    FOREIGN KEY ("resume_document_id") REFERENCES "resume_document"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "extraction_suggestion_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "extraction_suggestion_resume_document_id_idx" ON "extraction_suggestion"("resume_document_id");
CREATE INDEX "extraction_suggestion_candidate_id_idx" ON "extraction_suggestion"("candidate_id");
CREATE INDEX "extraction_suggestion_status_idx" ON "extraction_suggestion"("status");
CREATE UNIQUE INDEX "extraction_suggestion_resume_document_id_field_name_status_key"
  ON "extraction_suggestion"("resume_document_id", "field_name", "status");

