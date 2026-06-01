import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { uploadSourceFile } from "../lib/uploadSourceFile";
import type { InvoiceDocument, ReceiptRecord } from "../types/receipt";

export function useReceiptSubmit() {
  const createReceipt = useMutation(api.receipts.create);
  const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      receipt: InvoiceDocument,
      sourceFile?: File | null
    ): Promise<ReceiptRecord | null> => {
      setLoading(true);
      setError(null);

      try {
        let sourceStorageId;
        let sourceFileName;
        let sourceMimeType;

        if (sourceFile) {
          sourceStorageId = await uploadSourceFile(
            () => generateUploadUrl(),
            sourceFile
          );
          sourceFileName = sourceFile.name;
          sourceMimeType = sourceFile.type || "application/octet-stream";
        }

        return await createReceipt({
          receipt,
          sourceStorageId,
          sourceFileName,
          sourceMimeType,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit receipt";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [createReceipt, generateUploadUrl]
  );

  return { submit, loading, error, setError };
}
