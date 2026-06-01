import type { InvoiceDocument, ReceiptRecord } from "../types/receipt";
import { emptyLineItem } from "../types/receipt";

export function recordToInvoice(record: ReceiptRecord): InvoiceDocument {
  const {
    _id: _omit,
    createdAt: _c,
    updatedAt: _u,
    ...invoice
  } = record;
  return {
    ...invoice,
    lineItems: record.lineItems?.length
      ? record.lineItems
      : [
          {
            lineNo: 1,
            description: "",
            qty: 1,
            uom: "",
            unitPrice: record.totalAmount,
            discount: 0,
            netAmount: record.totalAmount,
          },
        ],
  };
}

export function normalizeInvoiceForForm(data: InvoiceDocument): InvoiceDocument {
  return {
    ...data,
    lineItems:
      data.lineItems?.length > 0
        ? data.lineItems.map((r, i) => ({
            ...emptyLineItem(i + 1),
            ...r,
            lineNo: r.lineNo || i + 1,
          }))
        : [emptyLineItem(1)],
  };
}
