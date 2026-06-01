import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { InvoiceDocument, ReceiptRecord } from "../types/receipt";
import { InvoicePreview } from "./InvoicePreview";
import { InvoiceExportButtons, type OriginalSource } from "./InvoiceExportButtons";
import { OriginalDocumentViewer } from "./OriginalDocumentViewer";
import { recordToInvoice } from "../lib/receiptUtils";
import { canExportOriginalAsVisual } from "../lib/exportOriginalDocument";

interface ReceiptViewModalProps {
  receipt: ReceiptRecord | null;
  draft: InvoiceDocument | null;
  draftSourceFile?: File | null;
  onClose: () => void;
  onEdit?: (invoice: InvoiceDocument, recordId?: string) => void;
  onDelete?: (record: ReceiptRecord) => void;
}

export function ReceiptViewModal({
  receipt,
  draft,
  draftSourceFile,
  onClose,
  onEdit,
  onDelete,
}: ReceiptViewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const invoice = receipt ? recordToInvoice(receipt) : draft;
  if (!invoice) return null;

  const storedSource = useQuery(
    api.receipts.getSourceUrl,
    receipt?.hasSourceFile
      ? { id: receipt._id as Id<"receipts"> }
      : "skip"
  );

  const draftObjectUrl = useMemo(() => {
    if (!draftSourceFile) return null;
    return URL.createObjectURL(draftSourceFile);
  }, [draftSourceFile]);

  useEffect(() => {
    return () => {
      if (draftObjectUrl) URL.revokeObjectURL(draftObjectUrl);
    };
  }, [draftObjectUrl]);

  const originalSource: OriginalSource | null =
    storedSource?.url
      ? {
          url: storedSource.url,
          mimeType: storedSource.mimeType,
          fileName: storedSource.fileName,
        }
      : draftObjectUrl && draftSourceFile
        ? {
            url: draftObjectUrl,
            mimeType: draftSourceFile.type || "application/octet-stream",
            fileName: draftSourceFile.name,
          }
        : null;

  const showOriginal = Boolean(
    originalSource && canExportOriginalAsVisual(originalSource.mimeType)
  );

  const title = invoice.merchantName || "Invoice";
  const isDraft = !receipt;
  const savedAt = receipt?.updatedAt ?? receipt?.createdAt;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-view-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl bg-slate-100 shadow-xl sm:max-h-[92vh] sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:gap-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="receipt-view-title"
              className="truncate text-base font-semibold text-slate-900 sm:text-lg"
            >
              {title}
            </h2>
            <p className="text-xs text-slate-500">
              {showOriginal
                ? "Original upload — layout and branding preserved"
                : isDraft
                  ? "Preview — save from the editor to store in Convex"
                  : "Saved invoice — structured data preview"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6">
          {showOriginal && originalSource ? (
            <OriginalDocumentViewer
              url={originalSource.url}
              mimeType={originalSource.mimeType}
              fileName={originalSource.fileName}
            />
          ) : (
            <div ref={previewRef}>
              <InvoicePreview
                invoice={invoice}
                savedAt={savedAt}
                className="print:shadow-none"
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
          <InvoiceExportButtons
            invoice={invoice}
            getElement={() => previewRef.current}
            originalSource={showOriginal ? originalSource : null}
          />
          <div className="flex flex-wrap gap-3">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(invoice, receipt?._id);
                  onClose();
                }}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Edit fields
              </button>
            )}
            {receipt && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(receipt);
                  onClose();
                }}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
