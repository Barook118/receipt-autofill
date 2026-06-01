import type { InvoiceDocument, LineItem } from "../types/receipt";

export interface InvoiceFieldErrors {
  merchantName?: string;
  date?: string;
  totalAmount?: string;
  currency?: string;
  lineItems?: string;
}

export function validateInvoice(data: InvoiceDocument): InvoiceFieldErrors {
  const errors: InvoiceFieldErrors = {};

  if (!data.merchantName.trim()) {
    errors.merchantName = "Required";
  }
  if (!data.date.trim()) {
    errors.date = "Required";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.date = "YYYY-MM-DD";
  }
  if (data.totalAmount < 0 || Number.isNaN(data.totalAmount)) {
    errors.totalAmount = "Invalid";
  }
  if (!data.currency.trim() || data.currency.length !== 3) {
    errors.currency = "3 letters";
  }
  if (!data.lineItems.length) {
    errors.lineItems = "Add at least one line";
  }

  return errors;
}

export function normalizeInvoice(data: InvoiceDocument): InvoiceDocument {
  const lineItems: LineItem[] = data.lineItems.map((row, i) => ({
    lineNo: row.lineNo || i + 1,
    description: row.description.trim(),
    qty: Number(row.qty) || 0,
    uom: row.uom.trim(),
    unitPrice: Number(row.unitPrice) || 0,
    discount: Number(row.discount) || 0,
    netAmount: Number(row.netAmount) || 0,
  }));

  return {
    merchantName: data.merchantName.trim(),
    invoiceNumber: data.invoiceNumber.trim(),
    billTo: data.billTo.trim(),
    date: data.date.trim(),
    dueDate: data.dueDate.trim(),
    paymentTerm: data.paymentTerm.trim(),
    currency: data.currency.trim().toUpperCase(),
    lineItems,
    subtotal: Number(data.subtotal) || 0,
    serviceTax: Number(data.serviceTax) || 0,
    rounding: Number(data.rounding) || 0,
    totalAmount: Number(data.totalAmount) || 0,
    notes: data.notes.trim(),
  };
}

/** @deprecated */
export type ReceiptFieldErrors = InvoiceFieldErrors;
export const validateReceipt = validateInvoice;
export const normalizeReceipt = normalizeInvoice;
