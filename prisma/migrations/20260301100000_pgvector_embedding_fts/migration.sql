-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Migrate embedding_vector from json to vector(1536)
-- Existing rows have JSON arrays like [0.1, -0.5, ...] with 8 dimensions.
-- We need to pad them to 1536 dimensions with zeros before converting.

-- Step 1: Add a temporary text column to hold the pgvector literal
ALTER TABLE embedding ADD COLUMN embedding_vector_new vector(1536);

-- Step 2: Convert existing JSON arrays to 1536-dim vectors (pad with zeros)
DO $$
DECLARE
  r RECORD;
  json_arr jsonb;
  vec_parts text[];
  dim_count int;
  i int;
  vec_literal text;
BEGIN
  FOR r IN SELECT id, embedding_vector FROM embedding LOOP
    json_arr := r.embedding_vector::jsonb;
    dim_count := jsonb_array_length(json_arr);
    vec_parts := ARRAY[]::text[];

    -- Copy existing dimensions
    FOR i IN 0..(dim_count - 1) LOOP
      vec_parts := array_append(vec_parts, (json_arr ->> i));
    END LOOP;

    -- Pad to 1536 with zeros
    FOR i IN dim_count..1535 LOOP
      vec_parts := array_append(vec_parts, '0');
    END LOOP;

    vec_literal := '[' || array_to_string(vec_parts, ',') || ']';
    UPDATE embedding SET embedding_vector_new = vec_literal::vector(1536) WHERE id = r.id;
  END LOOP;
END $$;

-- Step 3: Drop old column and rename new one
ALTER TABLE embedding DROP COLUMN embedding_vector;
ALTER TABLE embedding RENAME COLUMN embedding_vector_new TO embedding_vector;

-- Step 3a: Enforce NOT NULL (Prisma schema declares the field as required)
ALTER TABLE embedding ALTER COLUMN embedding_vector SET NOT NULL;

-- Step 3b: Backfill embedding_model and embedding_version for existing rows (AC 4)
UPDATE embedding SET embedding_model = 'deterministic-stub' WHERE embedding_model IS NULL;
UPDATE embedding SET embedding_version = 1 WHERE embedding_version IS NULL;

-- Step 4: Create HNSW index for cosine similarity search
CREATE INDEX embedding_vector_cosine_idx ON embedding USING hnsw (embedding_vector vector_cosine_ops);

-- Step 5: Add tsvector column to candidate_search_document
ALTER TABLE candidate_search_document ADD COLUMN fts_vector tsvector;

-- Step 6: Populate fts_vector from existing fts_text
UPDATE candidate_search_document SET fts_vector = to_tsvector('english', fts_text);

-- Step 7: Create GIN index on fts_vector for fast full-text search
CREATE INDEX candidate_search_document_fts_vector_idx ON candidate_search_document USING gin (fts_vector);
