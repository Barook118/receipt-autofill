# Submission Guide — TP Malaysia AI Intern Assessment

## Assessment requirements checklist

| Requirement | Status in this repo |
|-------------|---------------------|
| Upload receipt **image** | Done — `ReceiptUploader` (JPG, PNG, WEBP, etc.) |
| Generative AI extraction | Done — Google **Gemini** `gemini-flash-latest` |
| Pre-filled form + edit | Done — `InvoiceEditor` |
| Submit / save data | Done — Convex `receipts` table |
| Deploy (optional) | Optional — local + demo video is fine |
| Extract **merchant name** | Done |
| Extract **date** | Done (YYYY-MM-DD) |
| Extract **total amount** | Done |
| Extract **currency** | Done (3-letter code) |
| README (run + model/prompt) | Done — root `README.md` |
| Demo video 1–2 min | **You record** |
| Public GitHub repo | **You push** |
| PDF upload | Done (bonus — not required by brief) |

---

## Before you submit

### Step 1 — Screening form
Complete: https://forms.gle/43emtLmoAo7ct7se8

### Step 2 — Build deliverables

| Deliverable | Status |
|-------------|--------|
| Working upload → extract → edit → submit | Test locally |
| Public GitHub repo + README | Push to GitHub |
| README: how to run, model, prompt | See root `README.md` |
| Demo video (1–2 min) | Record screen capture |
| Live URL (optional) | Vercel + Convex |

### Step 3 — Email submission

Send to **all** of:

- Amr.Mihany@teleperformance.com
- Partiban.Periannan@teleperformance.com
- TarekEzzElDean.Osman@tp.com
- Laci.Al.Sabahi@tp.com

**Subject suggestion:** `AI Intern Assessment — Receipt Auto-Fill — [Your Name]`

**Include in email:**

1. GitHub repository URL
2. Demo video link (YouTube unlisted / Google Drive / Loom)
3. Live URL (if deployed)
4. Brief note on AI model used (Google Gemini `gemini-flash-latest`)

---

## Demo video script (~90 seconds)

1. **Intro (10s)** — App title, explain: upload receipt → AI extracts fields → user reviews → submit.
2. **Upload (15s)** — Drag/drop or select a receipt image or PDF, show preview (or PDF badge).
3. **Extract (20s)** — Click “Extract invoice”, show loading, form auto-fills.
4. **Edit (15s)** — Change one field to show review/edit works.
5. **Submit (15s)** — Submit, show success toast with ID.
6. **History (15s)** — Scroll to “Submitted Receipts”, show saved row.
7. **Outro (10s)** — Mention stack (React, Convex, Gemini, Bun) and GitHub link.

---

## Quick local run

```bash
cd client
bun install
# client/.env — VITE_GEMINI_API_KEY + VITE_CONVEX_URL
bun start
```

Open http://localhost:5173 — receipts persist in **Convex**.

---

## Architecture reference

See [ARCHITECTURE.md](./ARCHITECTURE.md) for diagrams, API contract, and component map.
