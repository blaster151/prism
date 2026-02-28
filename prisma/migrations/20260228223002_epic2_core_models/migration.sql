-- CreateEnum
CREATE TYPE "CandidateLifecycleState" AS ENUM ('ACTIVE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "DocumentProcessingStatus" AS ENUM ('PENDING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "DataProvenanceSource" AS ENUM ('EXTRACTED', 'INFERRED', 'USER_EDITED');

-- CreateEnum
CREATE TYPE "ShortlistItemState" AS ENUM ('PINNED', 'KEPT', 'EXCLUDED', 'SUGGESTED');

-- CreateTable
CREATE TABLE "candidate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lifecycle_state" "CandidateLifecycleState" NOT NULL DEFAULT 'ACTIVE',
    "canonical_person_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "dropbox_path" TEXT NOT NULL,
    "content_hash" TEXT,
    "ocr_status" "DocumentProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "extraction_status" "DocumentProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_record" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_record_field_provenance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "record_id" UUID NOT NULL,
    "field_name" TEXT NOT NULL,
    "source" "DataProvenanceSource" NOT NULL,
    "source_document_id" UUID,
    "last_modified_by_user_id" UUID,
    "last_modified_at" TIMESTAMP(3),

    CONSTRAINT "data_record_field_provenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embedding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "embedding_vector" JSONB NOT NULL,
    "embedding_model" TEXT NOT NULL,
    "embedding_version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "query_context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlist_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shortlist_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "state" "ShortlistItemState" NOT NULL DEFAULT 'SUGGESTED',
    "rationale" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shortlist_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidate_lifecycle_state_idx" ON "candidate"("lifecycle_state");

-- CreateIndex
CREATE INDEX "resume_document_candidate_id_idx" ON "resume_document"("candidate_id");

-- CreateIndex
CREATE INDEX "resume_document_dropbox_path_idx" ON "resume_document"("dropbox_path");

-- CreateIndex
CREATE UNIQUE INDEX "data_record_candidate_id_key" ON "data_record"("candidate_id");

-- CreateIndex
CREATE INDEX "data_record_field_provenance_record_id_idx" ON "data_record_field_provenance"("record_id");

-- CreateIndex
CREATE INDEX "data_record_field_provenance_field_name_idx" ON "data_record_field_provenance"("field_name");

-- CreateIndex
CREATE INDEX "data_record_field_provenance_source_idx" ON "data_record_field_provenance"("source");

-- CreateIndex
CREATE INDEX "embedding_candidate_id_idx" ON "embedding"("candidate_id");

-- CreateIndex
CREATE INDEX "shortlist_owner_user_id_idx" ON "shortlist"("owner_user_id");

-- CreateIndex
CREATE INDEX "shortlist_item_candidate_id_idx" ON "shortlist_item"("candidate_id");

-- CreateIndex
CREATE INDEX "shortlist_item_state_idx" ON "shortlist_item"("state");

-- CreateIndex
CREATE UNIQUE INDEX "shortlist_item_shortlist_id_candidate_id_key" ON "shortlist_item"("shortlist_id", "candidate_id");

-- AddForeignKey
ALTER TABLE "resume_document" ADD CONSTRAINT "resume_document_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_record" ADD CONSTRAINT "data_record_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_record_field_provenance" ADD CONSTRAINT "data_record_field_provenance_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "data_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_record_field_provenance" ADD CONSTRAINT "data_record_field_provenance_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "resume_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_record_field_provenance" ADD CONSTRAINT "data_record_field_provenance_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embedding" ADD CONSTRAINT "embedding_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlist" ADD CONSTRAINT "shortlist_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlist_item" ADD CONSTRAINT "shortlist_item_shortlist_id_fkey" FOREIGN KEY ("shortlist_id") REFERENCES "shortlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlist_item" ADD CONSTRAINT "shortlist_item_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
