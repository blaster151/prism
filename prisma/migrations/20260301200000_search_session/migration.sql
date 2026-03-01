-- CreateTable: search_session (Story 4.6 — iterative refinement)
CREATE TABLE "search_session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "query_history" JSONB NOT NULL DEFAULT '[]',
    "current_context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_session_user_id_idx" ON "search_session"("user_id");

-- AddForeignKey
ALTER TABLE "search_session" ADD CONSTRAINT "search_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
