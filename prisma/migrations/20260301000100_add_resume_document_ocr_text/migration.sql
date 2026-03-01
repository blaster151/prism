-- Add OCR output fields to resume_document
ALTER TABLE "resume_document"
  ADD COLUMN "ocr_provider" TEXT,
  ADD COLUMN "ocr_text" TEXT;

