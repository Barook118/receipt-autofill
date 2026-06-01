import type { RefObject } from "react";
import type { ReceiptRecord } from "../types/receipt";

interface ReceiptHistoryProps {
  receipts: ReceiptRecord[];
  loading: boolean;
  error: string | null;
  highlightId?: string | null;
  listRef?: RefObject<HTMLElement | null>;
  onRefresh: () => void;
  onView: (record: ReceiptRecord) => void;
  onEdit: (record: ReceiptRecord) => void;
  onExport: (record: ReceiptRecord, format: "png" | "pdf") => void;
  onDelete: (record: ReceiptRecord) => void;
  exportBusyId?: string | null;
}

export function ReceiptHistory({
  receipts,
  loading,
  error,
  highlightId,
  listRef,
  onRefresh,
  onView,
  onEdit,
  onExport,
  onDelete,
  exportBusyId,
}: ReceiptHistoryProps) {
  return (
    <section
      ref={listRef}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Saved invoices</h2>
          <p className="text-sm text-slate-500">
            Stored in Convex. View, edit, download, or delete any invoice.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading && receipts.length === 0 ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : receipts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
          No invoices yet. Upload a file, extract, and save.
        </p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {receipts.map((row) => (
              <li
                key={row._id}
                className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${
                  highlightId === row._id
                    ? "ring-2 ring-emerald-200 bg-emerald-50"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {row.merchantName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.invoiceNumber || "No invoice #"} · {row.date}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-900">
                    {row.currency} {row.totalAmount.toFixed(2)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {row.lineItems?.length ?? 0} line item
                  {(row.lineItems?.length ?? 0) === 1 ? "" : "s"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onView(row)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={exportBusyId === row._id}
                    onClick={() => onExport(row, "png")}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {exportBusyId === row._id ? "…" : "PNG"}
                  </button>
                  <button
                    type="button"
                    disabled={exportBusyId === row._id}
                    onClick={() => onExport(row, "pdf")}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-3 py-2 font-medium">Vendor</th>
                <th className="px-3 py-2 font-medium">Invoice #</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Lines</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((row) => (
                <tr
                  key={row._id}
                  className={`border-b border-slate-100 ${
                    highlightId === row._id
                      ? "bg-emerald-50 ring-1 ring-inset ring-emerald-200"
                      : ""
                  }`}
                >
                  <td className="px-3 py-2">{row.merchantName}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.invoiceNumber || "—"}
                  </td>
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2">{row.lineItems?.length ?? 0}</td>
                  <td className="px-3 py-2 font-medium">
                    {row.currency} {row.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(row)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={exportBusyId === row._id}
                        onClick={() => onExport(row, "png")}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        title="Download as PNG"
                      >
                        {exportBusyId === row._id ? "…" : "PNG"}
                      </button>
                      <button
                        type="button"
                        disabled={exportBusyId === row._id}
                        onClick={() => onExport(row, "pdf")}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        title="Download as PDF"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </section>
  );
}
