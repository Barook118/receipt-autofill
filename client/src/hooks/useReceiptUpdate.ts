import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { InvoiceDocument, ReceiptRecord } from "../types/receipt";

export function useReceiptUpdate() {
  const updateReceipt = useMutation(api.receipts.update);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (id: string, receipt: InvoiceDocument): Promise<ReceiptRecord | null> => {
      setLoading(true);
      setError(null);

      try {
        return await updateReceipt({
          id: id as Id<"receipts">,
          receipt,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save changes";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [updateReceipt]
  );

  return { update, loading, error, setError };
}
