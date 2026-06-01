import { useEffect, useState } from "react";
import type { InvoiceDocument, LineItem } from "../types/receipt";
import { emptyInvoice, emptyLineItem } from "../types/receipt";
import {
  normalizeInvoice,
  validateInvoice,
  type InvoiceFieldErrors,
} from "../lib/validateReceipt";

interface InvoiceEditorProps {
  initialData: InvoiceDocument | null;
  editingId: string | null;
  onSubmit: (data: InvoiceDocument) => void;
  onCancelEdit: () => void;
  loading: boolean;
}

export function InvoiceEditor({
  initialData,
  editingId,
  onSubmit,
  onCancelEdit,
  loading,
}: InvoiceEditorProps) {
  const [form, setForm] = useState<InvoiceDocument>(emptyInvoice());
  const [errors, setErrors] = useState<InvoiceFieldErrors>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        ...emptyInvoice(),
        ...initialData,
        lineItems:
          initialData.lineItems?.length > 0
            ? initialData.lineItems.map((r, i) => ({
                ...emptyLineItem(i + 1),
                ...r,
                lineNo: r.lineNo || i + 1,
              }))
            : [emptyLineItem(1)],
      });
      setErrors({});
    } else {
      setForm(emptyInvoice());
      setErrors({});
    }
  }, [initialData, editingId]);

  if (!initialData) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 sm:min-h-[12rem] sm:p-6">
        Upload an invoice or receipt, then click Extract. You can edit every
        field and line item before saving.
      </div>
    );
  }

  const setField = <K extends keyof InvoiceDocument>(
    key: K,
    value: InvoiceDocument[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as keyof InvoiceFieldErrors];
      return next;
    });
  };

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.lineItems;
      return next;
    });
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        emptyLineItem(prev.lineItems.length + 1),
      ],
    }));
  };

  const removeLine = (index: number) => {
    setForm((prev) => {
      const next = prev.lineItems.filter((_, i) => i !== index);
      return {
        ...prev,
        lineItems: next.length
          ? next.map((r, i) => ({ ...r, lineNo: i + 1 }))
          : [emptyLineItem(1)],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeInvoice(form);
    const fieldErrors = validateInvoice(normalized);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    onSubmit(normalized);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">
          {editingId ? "Edit invoice" : "Review & save"}
        </h2>
        {editingId && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            Cancel edit
          </button>
        )}
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Header</legend>
        <Field
          label="Vendor / company"
          value={form.merchantName}
          onChange={(v) => setField("merchantName", v)}
          error={errors.merchantName}
        />
        <Field
          label="Invoice no."
          value={form.invoiceNumber}
          onChange={(v) => setField("invoiceNumber", v)}
        />
        <Field
          label="Bill to"
          value={form.billTo}
          onChange={(v) => setField("billTo", v)}
        />
        <Field
          label="Payment term"
          value={form.paymentTerm}
          onChange={(v) => setField("paymentTerm", v)}
        />
        <Field
          label="Date"
          type="date"
          value={form.date}
          onChange={(v) => setField("date", v)}
          error={errors.date}
        />
        <Field
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={(v) => setField("dueDate", v)}
        />
        <Field
          label="Currency"
          value={form.currency}
          maxLength={3}
          className="uppercase"
          onChange={(v) => setField("currency", v.toUpperCase())}
          error={errors.currency}
        />
      </fieldset>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Line items</h3>
          <button
            type="button"
            onClick={addLine}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + Add row
          </button>
        </div>
        {errors.lineItems && (
          <p className="mb-2 text-xs text-red-600">{errors.lineItems}</p>
        )}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="px-2 py-2 font-medium">#</th>
                <th className="min-w-[10rem] px-2 py-2 font-medium">
                  Description
                </th>
                <th className="px-2 py-2 font-medium">Qty</th>
                <th className="px-2 py-2 font-medium">UOM</th>
                <th className="px-2 py-2 font-medium">U/Price</th>
                <th className="px-2 py-2 font-medium">Disc</th>
                <th className="px-2 py-2 font-medium">Net</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {form.lineItems.map((row, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      value={row.lineNo}
                      onChange={(e) =>
                        updateLine(index, {
                          lineNo: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-12 rounded border-slate-300 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={row.description}
                      onChange={(e) =>
                        updateLine(index, { description: e.target.value })
                      }
                      className="w-full min-w-[8rem] rounded border-slate-300 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.qty}
                      onChange={(e) =>
                        updateLine(index, {
                          qty: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-16 rounded border-slate-300 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={row.uom}
                      onChange={(e) =>
                        updateLine(index, { uom: e.target.value })
                      }
                      className="w-14 rounded border-slate-300 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(e) =>
                        updateLine(index, {
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 rounded border-slate-300 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={row.discount}
                      onChange={(e) =>
                        updateLine(index, {
                          discount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-16 rounded border-slate-300 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={row.netAmount}
                      onChange={(e) =>
                        updateLine(index, {
                          netAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 rounded border-slate-300 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={form.lineItems.length <= 1}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                      title="Remove row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label="Subtotal"
          value={form.subtotal}
          onChange={(v) => setField("subtotal", v)}
        />
        <NumberField
          label="Service tax"
          value={form.serviceTax}
          onChange={(v) => setField("serviceTax", v)}
        />
        <NumberField
          label="Rounding"
          value={form.rounding}
          onChange={(v) => setField("rounding", v)}
        />
        <NumberField
          label="Total"
          value={form.totalAmount}
          onChange={(v) => setField("totalAmount", v)}
          error={errors.totalAmount}
        />
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Notes / footer text
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          rows={2}
          className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading
          ? "Saving…"
          : editingId
            ? "Save changes"
            : "Save to database"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  maxLength,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-primary focus:ring-primary ${className}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-primary focus:ring-primary"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
