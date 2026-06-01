import { useState } from "react";
import type { InvoiceDocument } from "../types/receipt";
import {
  exportInvoiceAsPdf,
  exportInvoiceAsPng,
} from "../lib/exportInvoice";
import {
  canExportOriginalAsVisual,
  exportOriginalDocument,
} from "../lib/exportOriginalDocument";

export interface OriginalSource {
  url: string;
  mimeType: string;
  fileName: string;
}

interface InvoiceExportButtonsProps {
  invoice: InvoiceDocument;
  getElement: () => HTMLElement | null;
  originalSource?: OriginalSource | null;
  compact?: boolean;
}

export function InvoiceExportButtons({
  invoice,
  getElement,
  originalSource,
  compact = false,
}: InvoiceExportButtonsProps) {
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const useOriginal =
    originalSource &&
    canExportOriginalAsVisual(originalSource.mimeType);

  const runExport = async (format: "png" | "pdf") => {
    setBusy(format);
    try {
      if (useOriginal && originalSource) {
        await exportOriginalDocument(
          originalSource.url,
          originalSource.mimeType,
          format,
          invoice,
          originalSource.fileName
        );
        return;
      }

      const element = getElement();
      if (!element) return;
      if (format === "png") {
        await exportInvoiceAsPng(element, invoice);
      } else {
        await exportInvoiceAsPdf(element, invoice);
      }
    } finally {
      setBusy(null);
    }
  };

  const btnClass = compact
    ? "rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    : "rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60";

  return (
    <div className="space-y-2">
      {useOriginal && (
        <p className="text-xs text-slate-500">
          Export uses your original upload — same layout, brand, and colors.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runExport("png")}
          className={btnClass}
        >
          {busy === "png" ? "…" : compact ? "PNG" : "Download PNG"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runExport("pdf")}
          className={btnClass}
        >
          {busy === "pdf" ? "…" : compact ? "PDF" : "Download PDF"}
        </button>
      </div>
    </div>
  );
}
