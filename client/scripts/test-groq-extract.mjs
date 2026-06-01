#!/usr/bin/env node
/**
 * Tests Groq extraction pipeline (text path) without browser auth.
 * Run from client/: node scripts/test-groq-extract.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function loadEnv() {
  const vars = {};
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m) vars[m[1]] = m[2].trim();
      }
    } catch {
      /* ignore */
    }
  }
  return vars;
}

function excelToText(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const parts = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "\t", RS: "\n" });
    if (csv.trim()) parts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
  }
  return parts.join("\n\n").trim();
}

async function callGroq(apiKey, text) {
  const systemPrompt = `You are an invoice extraction assistant. Return ONLY valid JSON with merchantName, invoiceNumber, billTo, date, dueDate, paymentTerm, currency, lineItems (array with lineNo, description, qty, uom, unitPrice, discount, netAmount), subtotal, serviceTax, rounding, totalAmount, notes.`;
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Source: sample-invoice.xlsx\n\n--- Document text ---\n${text}\n\n--- End ---\n\nExtract the full invoice.`,
        },
      ],
      temperature: 0.1,
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error?.message ?? response.statusText);
  }
  return body.choices?.[0]?.message?.content;
}

const env = loadEnv();
const apiKey = env.VITE_GROQ_API_KEY;
if (!apiKey) {
  console.error("✗ VITE_GROQ_API_KEY missing in .env.local");
  process.exit(1);
}

const fixture = new URL("../test-fixtures/sample-invoice.xlsx", import.meta.url);
const buffer = readFileSync(fixture);
const text = excelToText(buffer);

console.log("\n=== Groq extraction test (text/xlsx path) ===\n");
console.log(`Fixture: sample-invoice.xlsx (${buffer.length} bytes)`);

try {
  const content = await callGroq(apiKey, text);
  const parsed = JSON.parse(content);
  console.log("✓ Groq returned valid JSON");
  console.log(`  Vendor: ${parsed.merchantName ?? "(missing)"}`);
  console.log(`  Invoice #: ${parsed.invoiceNumber ?? "(missing)"}`);
  console.log(`  Total: ${parsed.currency ?? ""} ${parsed.totalAmount ?? "?"}`);
  console.log(`  Line items: ${parsed.lineItems?.length ?? 0}`);
  if (!parsed.merchantName && !parsed.invoiceNumber) {
    console.error("✗ Extraction missing key fields");
    process.exit(1);
  }
  console.log("\nAll Groq extraction checks passed.\n");
} catch (err) {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
}
