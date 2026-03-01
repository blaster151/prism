import { DataProvenanceSource } from "@prisma/client";

export type ExtractedField = {
  fieldName: string;
  value: string;
  source: DataProvenanceSource;
};

export type ExtractArgs = {
  text: string;
};

export type ExtractResult = {
  provider: string;
  fields: ExtractedField[];
  model?: { name: string; version?: string };
};

export interface ExtractProvider {
  name: string;
  extract(args: ExtractArgs): Promise<ExtractResult>;
}

class NoopExtractProvider implements ExtractProvider {
  public readonly name = "noop";

  async extract(args: ExtractArgs): Promise<ExtractResult> {
    const text = args.text ?? "";

    const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ??
      "").trim();
    const phone = (text.match(/(\+?\d[\d(). -]{7,}\d)/)?.[0] ?? "").trim();

    const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
    const fullName = firstLine.length <= 80 ? firstLine : "";

    const fields: ExtractedField[] = [];
    if (fullName) fields.push({ fieldName: "fullName", value: fullName, source: DataProvenanceSource.INFERRED });
    if (email) fields.push({ fieldName: "email", value: email, source: DataProvenanceSource.EXTRACTED });
    if (phone) fields.push({ fieldName: "phone", value: phone, source: DataProvenanceSource.EXTRACTED });

    return { provider: this.name, fields, model: { name: "heuristic-v0" } };
  }
}

export function getExtractProvider(): ExtractProvider {
  const configured = (process.env.EXTRACT_PROVIDER ?? "noop").toLowerCase();
  // Future providers will be added here (LLM-backed), but default stays deterministic/no-network.
  void configured;
  return new NoopExtractProvider();
}

