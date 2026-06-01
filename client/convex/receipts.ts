import { mutation, query } from "./_generated/server";
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

const receiptInput = v.object({
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
});

const sourceMeta = {
  sourceStorageId: v.optional(v.id("_storage")),
  sourceFileName: v.optional(v.string()),
  sourceMimeType: v.optional(v.string()),
};

type ReceiptDoc = {
  userId: string;
  merchantName: string;
  invoiceNumber: string;
  billTo: string;
  date: string;
  dueDate: string;
  paymentTerm: string;
  currency: string;
  lineItems: Array<{
    lineNo: number;
    description: string;
    qty: number;
    uom: string;
    unitPrice: number;
    discount: number;
    netAmount: number;
  }>;
  subtotal: number;
  serviceTax: number;
  rounding: number;
  totalAmount: number;
  notes: string;
  updatedAt: number;
  _creationTime: number;
  sourceStorageId?: string;
  sourceFileName?: string;
  sourceMimeType?: string;
};

function toRecord(id: string, doc: ReceiptDoc) {
  return {
    _id: id,
    merchantName: doc.merchantName,
    invoiceNumber: doc.invoiceNumber,
    billTo: doc.billTo,
    date: doc.date,
    dueDate: doc.dueDate,
    paymentTerm: doc.paymentTerm,
    currency: doc.currency,
    lineItems: doc.lineItems,
    subtotal: doc.subtotal,
    serviceTax: doc.serviceTax,
    rounding: doc.rounding,
    totalAmount: doc.totalAmount,
    notes: doc.notes,
    sourceFileName: doc.sourceFileName,
    sourceMimeType: doc.sourceMimeType,
    hasSourceFile: Boolean(doc.sourceStorageId),
    createdAt: new Date(doc._creationTime).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("You must be signed in");
  }
  return identity.subject;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getSourceUrl = query({
  args: { id: v.id("receipts") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId || !doc.sourceStorageId) {
      return null;
    }

    return {
      url: await ctx.storage.getUrl(doc.sourceStorageId),
      fileName: doc.sourceFileName ?? "invoice",
      mimeType: doc.sourceMimeType ?? "application/octet-stream",
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("receipts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return rows.map((doc) => toRecord(doc._id, doc));
  },
});

export const create = mutation({
  args: {
    receipt: receiptInput,
    ...sourceMeta,
  },
  handler: async (ctx, { receipt, sourceStorageId, sourceFileName, sourceMimeType }) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("receipts", {
      userId,
      ...receipt,
      updatedAt: now,
      ...(sourceStorageId
        ? { sourceStorageId, sourceFileName, sourceMimeType }
        : {}),
    });
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Failed to create receipt");
    return toRecord(id, doc);
  },
});

export const update = mutation({
  args: { id: v.id("receipts"), receipt: receiptInput },
  handler: async (ctx, { id, receipt }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) return null;

    const now = Date.now();
    await ctx.db.patch(id, { ...receipt, updatedAt: now });
    const doc = await ctx.db.get(id);
    if (!doc) return null;
    return toRecord(id, doc);
  },
});

export const remove = mutation({
  args: { id: v.id("receipts") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) return false;
    if (existing.sourceStorageId) {
      await ctx.storage.delete(existing.sourceStorageId);
    }
    await ctx.db.delete(id);
    return true;
  },
});

/** Test endpoint - returns auth status without requiring authentication */
export const testConnection = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      status: "ok",
      authenticated: identity !== null,
      userId: identity?.subject ?? null,
      message: identity 
        ? "Connected and authenticated" 
        : "Connected but not authenticated - use receipts:list after signing in",
    };
  },
});
