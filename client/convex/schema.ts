import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const lineItem = v.object({
  lineNo: v.number(),
  description: v.string(),
  qty: v.number(),
  uom: v.string(),
  unitPrice: v.number(),
  discount: v.number(),
  netAmount: v.number(),
});

export default defineSchema({
  receipts: defineTable({
    userId: v.string(),
    merchantName: v.string(),
    invoiceNumber: v.string(),
    billTo: v.string(),
    date: v.string(),
    dueDate: v.string(),
    paymentTerm: v.string(),
    currency: v.string(),
    lineItems: v.array(lineItem),
    subtotal: v.number(),
    serviceTax: v.number(),
    rounding: v.number(),
    totalAmount: v.number(),
    notes: v.string(),
    updatedAt: v.number(),
    sourceStorageId: v.optional(v.id("_storage")),
    sourceFileName: v.optional(v.string()),
    sourceMimeType: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
