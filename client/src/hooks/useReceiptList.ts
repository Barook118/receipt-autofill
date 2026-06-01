import { useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { ReceiptRecord } from "../types/receipt";

export function useReceiptList() {
  const result = useQuery(api.receipts.list);
  const receipts = result ?? [];
  const loading = result === undefined;

  const refresh = useCallback(async () => {
    /* Convex queries update automatically */
  }, []);

  const upsertReceipt = useCallback((_record: ReceiptRecord) => {
    /* Convex queries update automatically */
  }, []);

  const removeReceipt = useCallback((_id: string) => {
    /* Convex queries update automatically */
  }, []);

  return {
    receipts,
    loading,
    error: null,
    refresh,
    upsertReceipt,
    removeReceipt,
  };
}
