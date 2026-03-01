/**
 * Shared Zod schemas for API validation.
 * Centralizes common request/response shapes to prevent drift across routes.
 */

import { z } from "zod";

/** UUID string (basic format check). */
export const UuidSchema = z.string().uuid();

/** Pagination limit: 1–100, defaults to 20. */
export const PaginationLimitSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .default(20);

/** Common error envelope returned by all API routes. */
export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
