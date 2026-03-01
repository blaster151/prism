-- CreateTable
CREATE TABLE "data_record_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "record_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "fields" JSONB NOT NULL,
    "actor_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_record_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_record_version_record_id_idx" ON "data_record_version"("record_id");

-- CreateIndex
CREATE INDEX "data_record_version_created_at_idx" ON "data_record_version"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "data_record_version_record_id_version_number_key" ON "data_record_version"("record_id", "version_number");

-- AddForeignKey
ALTER TABLE "data_record_version" ADD CONSTRAINT "data_record_version_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "data_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_record_version" ADD CONSTRAINT "data_record_version_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
