import { AppError } from "@/lib/errors";

export type OcrResult = {
  provider: string;
  text: string;
  pageCount?: number;
};

export type OcrPdfArgs = {
  pdfBytes: Uint8Array;
};

export interface OcrProvider {
  name: string;
  ocrPdf(args: OcrPdfArgs): Promise<OcrResult>;
}

class NoopOcrProvider implements OcrProvider {
  public readonly name = "noop";
  async ocrPdf(args: OcrPdfArgs): Promise<OcrResult> {
    void args;
    return { provider: this.name, text: "" };
  }
}

class DocumentAiOcrProvider implements OcrProvider {
  public readonly name = "document_ai";

  async ocrPdf(args: OcrPdfArgs): Promise<OcrResult> {
    const processorName = process.env.DOCUMENT_AI_PROCESSOR_NAME;
    if (!processorName) {
      throw new AppError({
        code: "MISCONFIGURED",
        message: "Document AI is not configured.",
        httpStatus: 500,
        details: { missing: "DOCUMENT_AI_PROCESSOR_NAME" },
      });
    }

    const { DocumentProcessorServiceClient } = await import(
      "@google-cloud/documentai"
    );

    const client = new DocumentProcessorServiceClient();
    const base64 = Buffer.from(args.pdfBytes).toString("base64");

    const resp = await client.processDocument({
      name: processorName,
      rawDocument: {
        content: base64,
        mimeType: "application/pdf",
      },
    });

    const text = resp?.[0]?.document?.text ?? "";
    const pageCount = resp?.[0]?.document?.pages?.length;

    return { provider: this.name, text, pageCount };
  }
}

export function getOcrProvider(): OcrProvider {
  const configured = (process.env.OCR_PROVIDER ?? "noop").toLowerCase();
  if (configured === "document_ai") return new DocumentAiOcrProvider();
  return new NoopOcrProvider();
}

