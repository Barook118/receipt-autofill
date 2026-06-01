import { useState, useCallback } from "react";
import { prepareFileForExtraction } from "../lib/prepareFileForExtraction";
import {
  extractReceiptFields,
  extractReceiptFieldsFromText,
} from "../lib/groqService";
import type { InvoiceDocument } from "../types/receipt";

function mockExtractionPayload(): InvoiceDocument {
  const today = new Date().toISOString().slice(0, 10);
  return {
    merchantName: "Sample Vendor (mock extract)",
    invoiceNumber: "MOCK-001",
    billTo: "Sample Customer",
    date: today,
    dueDate: "",
    paymentTerm: "COD",
    currency: "MYR",
    lineItems: [
      {
        lineNo: 1,
        description: "Sample line item",
        qty: 1,
        uom: "ea",
        unitPrice: 100,
        discount: 0,
        netAmount: 100,
      },
    ],
    subtotal: 100,
    serviceTax: 0,
    rounding: 0,
    totalAmount: 100,
    notes: "VITE_GROQ_MOCK_EXTRACT=true — disable for real AI extraction",
  };
}

export function useReceiptExtract() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (file: File): Promise<InvoiceDocument | null> => {
    setLoading(true);
    setError(null);

    try {
      if (file.size === 0) {
        throw new Error("Uploaded file is empty. Choose a different file.");
      }

      if (import.meta.env.VITE_GROQ_MOCK_EXTRACT === "true") {
        return mockExtractionPayload();
      }

      const prepared = await prepareFileForExtraction(file);
      const result =
        prepared.mode === "text"
          ? await extractReceiptFieldsFromText(prepared.text, prepared.label)
          : await extractReceiptFields(
              prepared.vision.base64,
              prepared.vision.mimeType
            );

      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to extract receipt fields";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { extract, loading, error, setError };
}
