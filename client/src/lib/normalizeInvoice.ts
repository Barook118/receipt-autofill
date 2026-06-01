import type { ExtractionResult, SubmitPayload } from "./validateExtraction";

function parseDate(value: string | null | undefined): string {
  if (!value) return "";
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return value;
  const dmy = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return value;
}

export function extractionToSubmit(data: ExtractionResult): SubmitPayload {
  const lineItems = (data.lineItems ?? []).map((row, i) => ({
    lineNo: row.lineNo ?? i + 1,
    description: row.description ?? "",
    qty: row.qty ?? 1,
    uom: row.uom ?? "",
    unitPrice: row.unitPrice ?? 0,
    discount: row.discount ?? 0,
    netAmount: row.netAmount ?? 0,
  }));

  if (lineItems.length === 0) {
    lineItems.push({
      lineNo: 1,
      description: "",
      qty: 1,
      uom: "",
      unitPrice: 0,
      discount: 0,
      netAmount: data.totalAmount ?? 0,
    });
  }

  const date = parseDate(data.date);
  const today = new Date().toISOString().slice(0, 10);

  return {
    merchantName: (data.merchantName ?? "").trim() || "Unknown vendor",
    invoiceNumber: data.invoiceNumber ?? "",
    billTo: data.billTo ?? "",
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today,
    dueDate: parseDate(data.dueDate),
    paymentTerm: data.paymentTerm ?? "",
    currency: (data.currency ?? "MYR").toUpperCase().slice(0, 3) || "MYR",
    lineItems,
    subtotal: data.subtotal ?? 0,
    serviceTax: data.serviceTax ?? 0,
    rounding: data.rounding ?? 0,
    totalAmount: data.totalAmount ?? 0,
    notes: data.notes ?? "",
  };
}
