export interface LineItem {
  lineNo: number;
  description: string;
  qty: number;
  uom: string;
  unitPrice: number;
  discount: number;
  netAmount: number;
}

export interface InvoiceDocument {
  merchantName: string;
  invoiceNumber: string;
  billTo: string;
  date: string;
  dueDate: string;
  paymentTerm: string;
  currency: string;
  lineItems: LineItem[];
  subtotal: number;
  serviceTax: number;
  rounding: number;
  totalAmount: number;
  notes: string;
}

export interface ReceiptRecord extends InvoiceDocument {
  _id: string;
  createdAt: string;
  updatedAt: string;
  hasSourceFile?: boolean;
  sourceFileName?: string;
  sourceMimeType?: string;
}

/** @deprecated use InvoiceDocument */
export type Receipt = InvoiceDocument;

export function emptyLineItem(lineNo = 1): LineItem {
  return {
    lineNo,
    description: "",
    qty: 1,
    uom: "",
    unitPrice: 0,
    discount: 0,
    netAmount: 0,
  };
}

export function emptyInvoice(): InvoiceDocument {
  return {
    merchantName: "",
    invoiceNumber: "",
    billTo: "",
    date: "",
    dueDate: "",
    paymentTerm: "",
    currency: "MYR",
    lineItems: [emptyLineItem(1)],
    subtotal: 0,
    serviceTax: 0,
    rounding: 0,
    totalAmount: 0,
    notes: "",
  };
}
