#!/usr/bin/env node
/**
 * Comprehensive test suite for Receipt Auto-Fill App
 * Tests all Convex endpoints, Groq AI extraction, and data operations
 * Run from client/: npm run test:comprehensive
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test identities
const USER_A = '{"subject":"test-user-a"}';
const USER_B = '{"subject":"test-user-b"}';

// Sample receipt data
const sampleReceipt = {
  receipt: {
    merchantName: "Test Vendor Ltd",
    invoiceNumber: "TEST-001",
    billTo: "Test Customer",
    date: "2026-05-24",
    dueDate: "2026-06-24",
    paymentTerm: "Net 30",
    currency: "MYR",
    lineItems: [
      {
        lineNo: 1,
        description: "Consulting Services",
        qty: 2,
        uom: "hr",
        unitPrice: 150,
        discount: 0,
        netAmount: 300,
      },
      {
        lineNo: 2,
        description: "Software License",
        qty: 1,
        uom: "ea",
        unitPrice: 500,
        discount: 50,
        netAmount: 450,
      },
    ],
    subtotal: 750,
    serviceTax: 45,
    rounding: -0.05,
    totalAmount: 794.95,
    notes: "Thank you for your business",
  },
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];
const startTime = Date.now();

// Helper functions
function run(fn, args = {}, identity) {
  const cmd = ["npx", "convex", "run", fn, JSON.stringify(args)];
  if (identity) {
    cmd.push("--identity", identity);
  }
  const result = spawnSync(cmd[0], cmd.slice(1), {
    encoding: "utf8",
    shell: false,
  });
  let out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  
  // Remove Convex warnings from output to get clean JSON
  const lines = out.split("\n");
  const jsonLines = [];
  let inJson = false;
  
  for (const line of lines) {
    // Skip warning lines
    if (line.includes("Warning:") || line.includes("These properties")) {
      continue;
    }
    // Detect start of JSON
    if (line.trim().startsWith("{") || line.trim().startsWith("[")) {
      inJson = true;
    }
    if (inJson) {
      jsonLines.push(line);
    }
  }
  
  out = jsonLines.join("\n").trim();
  
  return { ok: result.status === 0, out };
}

function test(name, fn) {
  totalTests++;
  const testStart = Date.now();
  try {
    fn();
    const duration = Date.now() - testStart;
    passedTests++;
    testResults.push({ name, status: "✅ PASS", duration, error: null });
    console.log(`  ✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - testStart;
    failedTests++;
    testResults.push({ name, status: "❌ FAIL", duration, error: error.message });
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(str, substring, message) {
  if (!str.includes(substring)) {
    throw new Error(message || `Expected "${str}" to include "${substring}"`);
  }
}

function assertNotIncludes(str, substring, message) {
  if (str.includes(substring)) {
    throw new Error(message || `Expected "${str}" to not include "${substring}"`);
  }
}

// Test suites
console.log("\n" + "=".repeat(70));
console.log("  COMPREHENSIVE TEST SUITE - Receipt Auto-Fill App");
console.log("=".repeat(70) + "\n");

// 1. Health Check Tests
console.log("📋 1. HEALTH CHECK TESTS\n");

test("Health endpoint returns OK status", () => {
  const r = run("health:health");
  assert(r.ok, "Health check failed");
  const data = JSON.parse(r.out);
  assert(data.status === "ok", "Health status is not 'ok'");
  assert(data.timestamp, "Health check missing timestamp");
});

test("Health endpoint is publicly accessible", () => {
  const r = run("health:health"); // No identity
  assert(r.ok, "Health check should be public");
  const data = JSON.parse(r.out);
  assert(data.authenticated === false, "Should show as not authenticated");
});

// 2. Authentication Tests
console.log("\n📋 2. AUTHENTICATION TESTS\n");

test("Unauthenticated access to receipts:list is blocked", () => {
  const r = run("receipts:list"); // No identity
  assert(!r.ok, "Should fail without authentication");
  assertIncludes(r.out, "signed in", "Should require sign in");
});

test("Unauthenticated access to receipts:create is blocked", () => {
  const r = run("receipts:create", sampleReceipt); // No identity
  assert(!r.ok, "Should fail without authentication");
  assertIncludes(r.out, "signed in", "Should require sign in");
});

test("Authenticated access with valid identity works", () => {
  const r = run("receipts:list", {}, USER_A);
  assert(r.ok, "Should succeed with valid identity");
});

// 3. CRUD Operations - User A
console.log("\n📋 3. CRUD OPERATIONS - USER A\n");

let receiptIdA = null;

test("Create receipt with valid data", () => {
  const r = run("receipts:create", sampleReceipt, USER_A);
  assert(r.ok, "Create should succeed");
  const data = JSON.parse(r.out);
  assert(data._id, "Should return receipt ID");
  assert(data.merchantName === "Test Vendor Ltd", "Merchant name mismatch");
  assert(data.totalAmount === 794.95, "Total amount mismatch");
  assert(data.lineItems.length === 2, "Should have 2 line items");
  receiptIdA = data._id;
});

test("List receipts returns created receipt", () => {
  const r = run("receipts:list", {}, USER_A);
  assert(r.ok, "List should succeed");
  const data = JSON.parse(r.out);
  assert(Array.isArray(data), "Should return array");
  assert(data.length > 0, "Should have at least one receipt");
  assertIncludes(r.out, "Test Vendor Ltd", "Should include created receipt");
});

test("Update receipt modifies data correctly", () => {
  assert(receiptIdA, "Receipt ID not available");
  const updatedReceipt = {
    ...sampleReceipt.receipt,
    merchantName: "Updated Vendor Name",
    notes: "Updated notes",
  };
  const r = run("receipts:update", { id: receiptIdA, receipt: updatedReceipt }, USER_A);
  assert(r.ok, "Update should succeed");
  const data = JSON.parse(r.out);
  assert(data.merchantName === "Updated Vendor Name", "Merchant name not updated");
  assert(data.notes === "Updated notes", "Notes not updated");
});

test("List shows updated receipt", () => {
  const r = run("receipts:list", {}, USER_A);
  assert(r.ok, "List should succeed");
  assertIncludes(r.out, "Updated Vendor Name", "Should show updated data");
});

// 4. User Isolation Tests
console.log("\n📋 4. USER ISOLATION TESTS\n");

test("User B cannot see User A's receipts", () => {
  const r = run("receipts:list", {}, USER_B);
  assert(r.ok, "List should succeed");
  const data = JSON.parse(r.out);
  assert(Array.isArray(data), "Should return array");
  assert(data.length === 0, "User B should have no receipts");
  assertNotIncludes(r.out, "Updated Vendor Name", "Should not see User A data");
});

test("User B cannot update User A's receipt", () => {
  assert(receiptIdA, "Receipt ID not available");
  const hijackReceipt = {
    ...sampleReceipt.receipt,
    merchantName: "Hijacked by User B",
  };
  const r = run("receipts:update", { id: receiptIdA, receipt: hijackReceipt }, USER_B);
  // Should return null or empty
  const output = r.out.trim();
  assert(output === "null" || output === "", "User B should not be able to update");
});

test("User A's receipt remains unchanged after User B attempt", () => {
  const r = run("receipts:list", {}, USER_A);
  assert(r.ok, "List should succeed");
  assertIncludes(r.out, "Updated Vendor Name", "Should still have original data");
  assertNotIncludes(r.out, "Hijacked", "Should not be hijacked");
});

let receiptIdB = null;

test("User B can create their own receipt", () => {
  const userBReceipt = {
    receipt: {
      ...sampleReceipt.receipt,
      merchantName: "User B Vendor",
      invoiceNumber: "B-001",
    },
  };
  const r = run("receipts:create", userBReceipt, USER_B);
  assert(r.ok, "User B create should succeed");
  const data = JSON.parse(r.out);
  receiptIdB = data._id;
  assert(data.merchantName === "User B Vendor", "User B receipt created");
});

test("User B sees only their own receipt", () => {
  const r = run("receipts:list", {}, USER_B);
  assert(r.ok, "List should succeed");
  const data = JSON.parse(r.out);
  assert(data.length === 1, "User B should have 1 receipt");
  assertIncludes(r.out, "User B Vendor", "Should see own receipt");
  assertNotIncludes(r.out, "Updated Vendor Name", "Should not see User A receipt");
});

test("User A cannot delete User B's receipt", () => {
  assert(receiptIdB, "User B receipt ID not available");
  const r = run("receipts:remove", { id: receiptIdB }, USER_A);
  // Should return false or fail
  const output = r.out.trim();
  assert(output === "false" || !r.ok, "User A should not delete User B receipt");
});

// 5. Delete Operations
console.log("\n📋 5. DELETE OPERATIONS\n");

test("User B can delete their own receipt", () => {
  assert(receiptIdB, "User B receipt ID not available");
  const r = run("receipts:remove", { id: receiptIdB }, USER_B);
  assert(r.ok, "Delete should succeed");
  assert(r.out.trim() === "true", "Should return true");
});

test("User B list is empty after delete", () => {
  const r = run("receipts:list", {}, USER_B);
  assert(r.ok, "List should succeed");
  const data = JSON.parse(r.out);
  assert(data.length === 0, "User B should have no receipts");
});

test("User A can delete their own receipt", () => {
  assert(receiptIdA, "User A receipt ID not available");
  const r = run("receipts:remove", { id: receiptIdA }, USER_A);
  assert(r.ok, "Delete should succeed");
  assert(r.out.trim() === "true", "Should return true");
});

test("User A list is empty after delete", () => {
  const r = run("receipts:list", {}, USER_A);
  assert(r.ok, "List should succeed");
  const data = JSON.parse(r.out);
  assert(data.length === 0, "User A should have no receipts");
});

// 6. Data Validation Tests
console.log("\n📋 6. DATA VALIDATION TESTS\n");

test("Create fails with missing required fields", () => {
  const invalidReceipt = {
    receipt: {
      merchantName: "", // Empty required field
      invoiceNumber: "INV-001",
      date: "2026-05-24",
      currency: "MYR",
      lineItems: [],
      totalAmount: 0,
    },
  };
  const r = run("receipts:create", invalidReceipt, USER_A);
  // Should fail validation
  assert(!r.ok || r.out.includes("error"), "Should fail with empty merchant name");
});

test("Create succeeds with minimal valid data", () => {
  const minimalReceipt = {
    receipt: {
      merchantName: "Minimal Vendor",
      invoiceNumber: "MIN-001",
      billTo: "Customer",
      date: "2026-05-24",
      dueDate: "",
      paymentTerm: "COD",
      currency: "MYR",
      lineItems: [
        {
          lineNo: 1,
          description: "Item",
          qty: 1,
          uom: "ea",
          unitPrice: 100,
          discount: 0,
          netAmount: 100,
        },
      ],
      subtotal: 100,
      serviceTax: 0,
      rounding: 0,
      totalAmount: 100,
      notes: "",
    },
  };
  const r = run("receipts:create", minimalReceipt, USER_A);
  assert(r.ok, "Should succeed with minimal valid data");
  const data = JSON.parse(r.out);
  // Clean up
  run("receipts:remove", { id: data._id }, USER_A);
});

// 7. Groq AI Extraction Tests
console.log("\n📋 7. GROQ AI EXTRACTION TESTS\n");

test("Groq extraction test script exists", () => {
  const testPath = join(__dirname, "test-groq-extract.mjs");
  try {
    readFileSync(testPath, "utf8");
  } catch (error) {
    throw new Error("Groq test script not found");
  }
});

test("Groq extraction works with sample file", () => {
  const result = spawnSync("node", [join(__dirname, "test-groq-extract.mjs")], {
    encoding: "utf8",
    shell: false,
  });
  assert(result.status === 0, "Groq extraction test failed");
  assertIncludes(result.stdout, "Groq returned valid JSON", "Groq should return valid JSON");
});

// 8. Edge Cases
console.log("\n📋 8. EDGE CASE TESTS\n");

test("Handle receipt with many line items", () => {
  const manyItemsReceipt = {
    receipt: {
      merchantName: "Bulk Vendor",
      invoiceNumber: "BULK-001",
      billTo: "Customer",
      date: "2026-05-24",
      dueDate: "",
      paymentTerm: "COD",
      currency: "MYR",
      lineItems: Array.from({ length: 20 }, (_, i) => ({
        lineNo: i + 1,
        description: `Item ${i + 1}`,
        qty: 1,
        uom: "ea",
        unitPrice: 10,
        discount: 0,
        netAmount: 10,
      })),
      subtotal: 200,
      serviceTax: 0,
      rounding: 0,
      totalAmount: 200,
      notes: "",
    },
  };
  const r = run("receipts:create", manyItemsReceipt, USER_A);
  assert(r.ok, "Should handle many line items");
  const data = JSON.parse(r.out);
  assert(data.lineItems.length === 20, "Should have 20 line items");
  // Clean up
  run("receipts:remove", { id: data._id }, USER_A);
});

test("Handle special characters in merchant name", () => {
  const specialCharsReceipt = {
    receipt: {
      merchantName: "Test & Co. (Pvt.) Ltd. — Special™",
      invoiceNumber: "SPEC-001",
      billTo: "Customer",
      date: "2026-05-24",
      dueDate: "",
      paymentTerm: "COD",
      currency: "MYR",
      lineItems: [
        {
          lineNo: 1,
          description: "Item",
          qty: 1,
          uom: "ea",
          unitPrice: 100,
          discount: 0,
          netAmount: 100,
        },
      ],
      subtotal: 100,
      serviceTax: 0,
      rounding: 0,
      totalAmount: 100,
      notes: "",
    },
  };
  const r = run("receipts:create", specialCharsReceipt, USER_A);
  assert(r.ok, "Should handle special characters");
  const data = JSON.parse(r.out);
  assertIncludes(data.merchantName, "™", "Should preserve special characters");
  // Clean up
  run("receipts:remove", { id: data._id }, USER_A);
});

test("Handle large monetary amounts", () => {
  const largeAmountReceipt = {
    receipt: {
      merchantName: "Large Amount Vendor",
      invoiceNumber: "LARGE-001",
      billTo: "Customer",
      date: "2026-05-24",
      dueDate: "",
      paymentTerm: "COD",
      currency: "MYR",
      lineItems: [
        {
          lineNo: 1,
          description: "Expensive Item",
          qty: 1,
          uom: "ea",
          unitPrice: 999999.99,
          discount: 0,
          netAmount: 999999.99,
        },
      ],
      subtotal: 999999.99,
      serviceTax: 0,
      rounding: 0,
      totalAmount: 999999.99,
      notes: "",
    },
  };
  const r = run("receipts:create", largeAmountReceipt, USER_A);
  assert(r.ok, "Should handle large amounts");
  const data = JSON.parse(r.out);
  assert(data.totalAmount === 999999.99, "Should preserve large amounts");
  // Clean up
  run("receipts:remove", { id: data._id }, USER_A);
});

// Final Summary
const endTime = Date.now();
const totalDuration = endTime - startTime;

console.log("\n" + "=".repeat(70));
console.log("  TEST SUMMARY");
console.log("=".repeat(70) + "\n");

console.log(`Total Tests:    ${totalTests}`);
console.log(`Passed:         ${passedTests} ✅`);
console.log(`Failed:         ${failedTests} ❌`);
console.log(`Success Rate:   ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log(`Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);

if (failedTests > 0) {
  console.log("\n" + "=".repeat(70));
  console.log("  FAILED TESTS");
  console.log("=".repeat(70) + "\n");
  testResults
    .filter((t) => t.status === "❌ FAIL")
    .forEach((t) => {
      console.log(`❌ ${t.name}`);
      console.log(`   Error: ${t.error}`);
      console.log();
    });
}

console.log("\n" + "=".repeat(70));
console.log("  DETAILED RESULTS");
console.log("=".repeat(70) + "\n");

testResults.forEach((t) => {
  console.log(`${t.status} ${t.name} (${t.duration}ms)`);
  if (t.error) {
    console.log(`   ${t.error}`);
  }
});

console.log("\n" + "=".repeat(70) + "\n");

if (failedTests === 0) {
  console.log("🎉 All tests passed! The application is working correctly.\n");
  process.exit(0);
} else {
  console.log(`⚠️  ${failedTests} test(s) failed. Please review the errors above.\n`);
  process.exit(1);
}
