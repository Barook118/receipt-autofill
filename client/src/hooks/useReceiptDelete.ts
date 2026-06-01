import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useReceiptDelete() {
  const deleteReceipt = useMutation(api.receipts.remove);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        return await deleteReceipt({ id: id as Id<"receipts"> });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete invoice";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [deleteReceipt]
  );

  return { remove, loading, error, setError };
}
