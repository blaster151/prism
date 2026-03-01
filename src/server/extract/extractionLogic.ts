import { DataProvenanceSource } from "@prisma/client";

export type ExtractionField = {
  fieldName: string;
  value: string;
  source: DataProvenanceSource;
};

export const FACTUAL_FIELDS = new Set(["fullName", "email", "phone"]);

export type StagedSuggestion = {
  fieldName: string;
  existingValue: string | null;
  suggestedValue: string;
  source: DataProvenanceSource;
};

export function computeExtractionChanges(args: {
  existingFields: Record<string, unknown>;
  extracted: ExtractionField[];
}) {
  const applied: ExtractionField[] = [];
  const staged: StagedSuggestion[] = [];

  for (const f of args.extracted) {
    const existingRaw = args.existingFields[f.fieldName];
    const existing =
      typeof existingRaw === "string" ? existingRaw.trim() : existingRaw == null ? null : String(existingRaw).trim();

    const next = f.value.trim();
    if (!next) continue;

    const isFactual = FACTUAL_FIELDS.has(f.fieldName);
    const differs = existing !== null && existing.length > 0 && existing !== next;

    if (isFactual && differs) {
      staged.push({
        fieldName: f.fieldName,
        existingValue: existing,
        suggestedValue: next,
        source: f.source,
      });
      continue;
    }

    applied.push({ ...f, value: next });
  }

  return { applied, staged };
}

