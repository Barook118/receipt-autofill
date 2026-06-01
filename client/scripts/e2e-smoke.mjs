#!/usr/bin/env node
/**
 * Browser E2E smoke test — requires VITE_CLERK_PUBLISHABLE_KEY in client/.env
 * Run: node scripts/e2e-smoke.mjs
 * Optional: E2E_HEADLESS=false to watch the browser
 */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(new URL("../", import.meta.url)));
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const FIXTURE = path.join(ROOT, "test-fixtures/sample-invoice.xlsx");

function loadEnv() {
  const vars = {};
  for (const file of [".env.local", ".env"]) {
    const p = path.join(ROOT, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) vars[m[1]] = m[2].trim();
    }
  }
  return vars;
}

const env = loadEnv();
const clerkKey = env.VITE_CLERK_PUBLISHABLE_KEY;

async function screenshot(page, name) {
  const out = path.join(ROOT, "test-fixtures", `${name}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`  📸 ${out}`);
  return out;
}

async function main() {
  console.log(`\n=== E2E smoke test @ ${BASE} ===\n`);

  const launchOpts = {
    headless: process.env.E2E_HEADLESS !== "false",
  };
  let browser;
  try {
    browser = await chromium.launch(launchOpts);
  } catch {
    browser = await chromium.launch({ ...launchOpts, channel: "msedge" });
  }
  const page = await browser.newPage();

  try {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await screenshot(page, "01-initial-page");

    if (!clerkKey) {
      const missing = await page.getByText("VITE_CLERK_PUBLISHABLE_KEY").count();
      if (missing > 0) {
        console.log("✗ Clerk key missing — login page cannot load");
        console.log("  Add VITE_CLERK_PUBLISHABLE_KEY to client/.env and restart Vite");
        process.exitCode = 1;
        return;
      }
    }

    const signInVisible = await page.getByText("Sign in to continue").count();
    if (signInVisible > 0) {
      console.log("✓ Login page visible");
      await screenshot(page, "02-login-page");
      console.log("\n⚠ Manual step: sign in with Google in the browser, then re-run with E2E_SIGNED_IN=1");
      if (process.env.E2E_SIGNED_IN !== "1") {
        process.exitCode = 0;
        return;
      }
    }

    const uploadHeading = page.getByText("Drag & drop or click to upload");
    if ((await uploadHeading.count()) === 0) {
      console.log("✗ Upload section not found (not signed in?)");
      process.exitCode = 1;
      return;
    }
    console.log("✓ Upload section visible");
    await screenshot(page, "03-upload-section");

    if (!existsSync(FIXTURE)) {
      console.log("✗ Missing test-fixtures/sample-invoice.xlsx");
      process.exitCode = 1;
      return;
    }

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(FIXTURE);
    console.log("✓ File selected — waiting for Groq extraction…");

    await page.getByText("Invoice extracted", { exact: false }).waitFor({
      timeout: 120_000,
    });
    console.log("✓ Extraction completed");
    await screenshot(page, "04-after-extract");

    await page.getByRole("button", { name: /save/i }).click();
    await page.getByText("saved to database", { exact: false }).waitFor({
      timeout: 30_000,
    });
    console.log("✓ Saved to database");
    await screenshot(page, "05-after-save");

    await page.getByRole("button", { name: "View" }).first().click();
    await page.getByRole("button", { name: "Close" }).waitFor({ timeout: 5000 });
    console.log("✓ View modal works");
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.getByDisplayValue("Groq Test Vendor").waitFor({ timeout: 5000 });
    console.log("✓ Edit form loaded");
    await screenshot(page, "06-edit-form");

    await page.getByRole("button", { name: "PNG" }).first().click();
    await page.waitForTimeout(2000);
    console.log("✓ PNG export triggered");

    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.getByRole("button", { name: "Yes, delete" }).click();
    await page.getByText("deleted from database", { exact: false }).waitFor({
      timeout: 15_000,
    });
    console.log("✓ Delete confirmed");
    await screenshot(page, "07-after-delete");

    console.log("\nAll E2E checks passed.\n");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
