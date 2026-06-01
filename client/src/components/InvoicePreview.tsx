import type { InvoiceDocument } from "../types/receipt";

function formatMoney(currency: string, amount: number): string {
  const code = currency.trim() || "MYR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

function formatDate(value: string): string {
  if (!value.trim()) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface InvoicePreviewProps {
  invoice: InvoiceDocument;
  /** Shown in footer when viewing a saved record */
  savedAt?: string;
  className?: string;
}

export function InvoicePreview({
  invoice,
  savedAt,
  className = "",
}: InvoicePreviewProps) {
  const currency = invoice.currency || "MYR";
  const lineItems =
    invoice.lineItems?.length > 0
      ? invoice.lineItems
      : [
          {
            lineNo: 1,
            description: "",
            qty: 1,
            uom: "",
            unitPrice: invoice.totalAmount,
            discount: 0,
            netAmount: invoice.totalAmount,
          },
        ];

  return (
    <article
      className={`invoice-preview rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm ${className}`}
    >
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Tax Invoice
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {invoice.merchantName || "Vendor"}
            </h1>
          </div>
          <div className="text-right text-sm">
            {invoice.invoiceNumber?.trim() && (
              <p>
                <span className="text-slate-500">Invoice no.</span>
                <br />
                <span className="font-semibold">{invoice.invoiceNumber}</span>
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:gap-6 sm:px-8 sm:py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bill to
          </p>
          <p className="mt-1 text-base font-medium text-slate-900">
            {invoice.billTo?.trim() || "—"}
          </p>
        </div>
        <dl className="grid gap-2 text-sm sm:text-right">
          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-slate-500">Date</dt>
            <dd className="font-medium">{formatDate(invoice.date)}</dd>
          </div>
          {invoice.dueDate?.trim() && (
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-slate-500">Due date</dt>
              <dd className="font-medium">{formatDate(invoice.dueDate)}</dd>
            </div>
          )}
          {invoice.paymentTerm?.trim() && (
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-slate-500">Payment terms</dt>
              <dd className="font-medium">{invoice.paymentTerm}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="px-3 sm:px-6">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2.5 font-semibold">#</th>
                <th className="min-w-[12rem] px-3 py-2.5 font-semibold">
                  Description
                </th>
                <th className="px-3 py-2.5 font-semibold text-right">Qty</th>
                <th className="px-3 py-2.5 font-semibold">UOM</th>
                <th className="px-3 py-2.5 font-semibold text-right">
                  Unit price
                </th>
                <th className="px-3 py-2.5 font-semibold text-right">
                  Discount
                </th>
                <th className="px-3 py-2.5 font-semibold text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((row, i) => (
                <tr
                  key={`${row.lineNo}-${i}`}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-2 text-slate-600">{row.lineNo}</td>
                  <td className="px-3 py-2 font-medium">
                    {row.description?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.qty}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.uom?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(currency, row.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {row.discount > 0
                      ? formatMoney(currency, row.discount)
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {formatMoney(currency, row.netAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="border-t border-slate-200 px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-col gap-4 sm:ml-auto sm:max-w-xs">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="tabular-nums font-medium">
              {formatMoney(currency, invoice.subtotal ?? 0)}
            </span>
          </div>
          {(invoice.serviceTax ?? 0) !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Service tax</span>
              <span className="tabular-nums font-medium">
                {formatMoney(currency, invoice.serviceTax ?? 0)}
              </span>
            </div>
          )}
          {(invoice.rounding ?? 0) !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Rounding</span>
              <span className="tabular-nums font-medium">
                {formatMoney(currency, invoice.rounding ?? 0)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-3 text-sm sm:text-base">
            <span className="font-semibold text-slate-700">Total due</span>
            <span className="text-base font-bold text-primary tabular-nums sm:text-lg">
              {formatMoney(currency, invoice.totalAmount)}
            </span>
          </div>
        </div>

        {invoice.notes?.trim() && (
          <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {savedAt && (
          <p className="mt-4 text-xs text-slate-400">
            Saved {new Date(savedAt).toLocaleString()}
          </p>
        )}
      </footer>
    </article>
  );
}
