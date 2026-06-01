import { z } from "zod";

const lineItemSchema = z.object({
  lineNo: z.coerce.number().optional(),
  description: z.string().nullable().optional(),
  qty: z.coerce.number().nullable().optional(),
  uom: z.string().nullable().optional(),
  unitPrice: z.coerce.number().nullable().optional(),
  discount: z.coerce.number().nullable().optional(),
  netAmount: z.coerce.number().nullable().optional(),
});

export const extractionSchema = z.object({
  merchantName: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  billTo: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  paymentTerm: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  lineItems: z.array(lineItemSchema).nullable().optional(),
  subtotal: z.coerce.number().nullable().optional(),
  serviceTax: z.coerce.number().nullable().optional(),
  rounding: z.coerce.number().nullable().optional(),
  totalAmount: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const lineItemSubmitSchema = z.object({
  lineNo: z.number().min(0),
  description: z.string(),
  qty: z.number().min(0),
  uom: z.string(),
  unitPrice: z.number(),
  discount: z.number(),
  netAmount: z.number(),
});

export const submitSchema = z.object({
  merchantName: z.string().min(1, "Merchant / vendor name is required").trim(),
  invoiceNumber: z.string(),
  billTo: z.string(),
  date: z
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  dueDate: z.string(),
  paymentTerm: z.string(),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .transform((v) => v.toUpperCase()),
  lineItems: z.array(lineItemSubmitSchema).min(1, "At least one line item"),
  subtotal: z.number().min(0),
  serviceTax: z.number(),
  rounding: z.number(),
  totalAmount: z.number().min(0, "Total must be non-negative"),
  notes: z.string(),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;
export type SubmitPayload = z.infer<typeof submitSchema>;
