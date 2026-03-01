/**
 * Shared job status types and utilities for BullMQ job services.
 * Extracted to avoid duplication across ingestion/ocr/extract job services.
 */

export type NormalizedJobState = "queued" | "running" | "succeeded" | "failed";

export function normalizeJobState(state: string): NormalizedJobState {
  if (state === "completed") return "succeeded";
  if (state === "failed") return "failed";
  if (state === "active") return "running";
  return "queued";
}
