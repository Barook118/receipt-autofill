#!/usr/bin/env node
/**
 * Tests Convex receipt CRUD + auth (no Gemini).
 * Run from client/: bun run test:endpoints
 */
import { spawnSync } from "node:child_process";

const USER_A = '{"subject":"test-user-a"}';
const USER_B = '{"subject":"test-user-b"}';

const sampleReceipt = {
  receipt: {
    merchantName: "Test Vendor Ltd",
    invoiceNumber: "TEST-001",
    billTo: "Test Customer",
    date: "2026-05-24",
    dueDate: "",
    paymentTerm: "COD",
    currency: "MYR",
    lineItems: [
      {
        lineNo: 1,
        description: "Test line item",
        qty: 2,
        uom: "ea",
        unitPrice: 50,
        discount: 0,
        netAmount: 100,
      },
    ],
    subtotal: 100,
    serviceTax: 0,
    rounding: 0,
    totalAmount: 100,
    notes: "Automated endpoint test",
  },
};

function run(fn, args = {}, identity) {
  const cmd = ["bunx", "convex", "run", fn, JSON.stringify(args)];
  if (identity) {
    cmd.push("--identity", identity);
  }
  const result = spawnSync(cmd[0], cmd.slice(1), {
    encoding: "utf8",
    shell: false,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  return { ok: result.status === 0, out };
}

function pass(label) {
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  console.log(`  ✗ ${label}`);
  if (detail) console.log(`    ${detail.slice(0, 400)}`);
}

let failed = 0;

console.log("\n=== Convex endpoint tests (no Gemini) ===\n");

console.log("1. Health check");
{
  const r = run("health:health");
  if (r.ok) {
    try {
      const data = JSON.parse(r.out);
      if (data.status === "ok") {
        pass("health:health returns ok");
      } else {
        fail("health:health status", r.out);
        failed++;
      }
    } catch {
      fail("health:health parse", r.out);
      failed++;
    }
  } else {
    fail("health:health", r.out);
    failed++;
  }
}

console.log("\n2. Auth — unauthenticated access blocked");
{
  const r = run("receipts:list");
  if (!r.ok && r.out.includes("signed in")) {
    pass("receipts:list rejects unauthenticated caller");
  } else {
    fail("receipts:list should require auth", r.out);
    failed++;
  }
}

console.log("\n3. CRUD — User A");
let receiptId = null;
{
  const create = run("receipts:create", sampleReceipt, USER_A);
  if (create.ok) {
    try {
      const parsed = JSON.parse(create.out);
      receiptId = parsed._id;
      pass(`receipts:create → id ${receiptId}`);
    } catch {
      fail("receipts:create parse response", create.out);
      failed++;
    }
  } else {
    fail("receipts:create", create.out);
    failed++;
  }

  const list = run("receipts:list", {}, USER_A);
  if (list.ok && list.out.includes("Test Vendor Ltd")) {
    pass("receipts:list returns User A invoice");
  } else {
    fail("receipts:list User A", list.out);
    failed++;
  }

  if (receiptId) {
    const updated = run(
      "receipts:update",
      {
        id: receiptId,
        receipt: { ...sampleReceipt.receipt, merchantName: "Updated Vendor" },
      },
      USER_A
    );
    if (updated.ok && updated.out.includes("Updated Vendor")) {
      pass("receipts:update saves changes");
    } else {
      fail("receipts:update", updated.out);
      failed++;
    }
  }
}

console.log("\n4. User isolation — User B");
{
  const listB = run("receipts:list", {}, USER_B);
  if (listB.ok && listB.out === "[]") {
    pass("User B list is empty (no mixed data)");
  } else if (listB.ok && !listB.out.includes("Test Vendor")) {
    pass("User B cannot see User A invoices");
  } else {
    fail("User B should not see User A data", listB.out);
    failed++;
  }

  if (receiptId) {
    const hijack = run(
      "receipts:update",
      {
        id: receiptId,
        receipt: { ...sampleReceipt.receipt, merchantName: "Hijacked" },
      },
      USER_B
    );
    const denied =
      hijack.out.trim() === "null" ||
      hijack.out.trim() === "" ||
      !hijack.ok;
    if (denied) {
      pass("User B cannot update User A invoice");
    } else {
      fail("User B update should be denied", hijack.out);
      failed++;
    }
  }
}

console.log("\n5. Delete — User A");
if (receiptId) {
  const del = run("receipts:remove", { id: receiptId }, USER_A);
  if (del.ok && del.out === "true") {
    pass("receipts:remove deletes own invoice");
  } else {
    fail("receipts:remove", del.out);
    failed++;
  }

  const listAfter = run("receipts:list", {}, USER_A);
  if (listAfter.ok && listAfter.out === "[]") {
    pass("receipts:list empty after delete");
  } else {
    fail("list after delete", listAfter.out);
    failed++;
  }
}

console.log("\n=== Summary ===");
if (failed === 0) {
  console.log("All tests passed.\n");
  process.exit(0);
} else {
  console.log(`${failed} test(s) failed.\n`);
  process.exit(1);
}
