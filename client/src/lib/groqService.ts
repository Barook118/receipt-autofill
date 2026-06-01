import {
  extractionSchema,
  type SubmitPayload,
} from "./validateExtraction";
import { extractionToSubmit } from "./normalizeInvoice";
import type { VisionMimeType } from "./prepareFileForExtraction";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an invoice and receipt extraction assistant. Analyze the document image (receipt, invoice, PDF page, etc.) and extract structured data.

Return ONLY valid JSON (no markdown) with this shape:
{
  "merchantName": "vendor / company name",
  "invoiceNumber": "invoice or receipt number",
  "billTo": "customer or bill-to name",
  "date": "YYYY-MM-DD (transaction/invoice date)",
  "dueDate": "YYYY-MM-DD or empty",
  "paymentTerm": "e.g. COD, Net 30",
  "currency": "3-letter code e.g. MYR",
  "lineItems": [
    {
      "lineNo": 1,
      "description": "item description",
      "qty": 1,
      "uom": "unit or empty string",
      "unitPrice": 0.00,
      "discount": 0.00,
      "netAmount": 0.00
    }
  ],
  "subtotal": 0.00,
  "serviceTax": 0.00,
  "rounding": 0.00,
  "totalAmount": 0.00,
  "notes": "any footer or custom message"
}

Rules:
- Extract ALL line item rows from tables (description, qty, unit price, discount, net amount).
- Convert dates like 17/05/2026 to 2026-05-17.
- Numbers only (no currency symbols).
- Use null only if a top-level field is truly missing; use empty array if no line items.`;

const TEXT_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

The user uploaded a spreadsheet or Word document. The following is plain text extracted from that file. Infer invoice fields from tables and labels even if formatting is imperfect.`;

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

const FALLBACK_VISION_MODELS = [
  VISION_MODEL,
] as const;

const FALLBACK_TEXT_MODELS = [
  TEXT_MODEL,
  "llama-3.1-8b-instant",
] as const;

const MAX_RETRIES_PER_MODEL = 4;
const RETRY_BASE_MS = 1000;

function getGroqApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "VITE_GROQ_API_KEY is missing. Add it locally in client/.env.local, or in Vercel env vars for production, then redeploy."
    );
  }
  return key;
}

function getGroqVisionModel(): string {
  return import.meta.env.VITE_GROQ_VISION_MODEL?.trim() || VISION_MODEL;
}

function getGroqTextModel(): string {
  return import.meta.env.VITE_GROQ_TEXT_MODEL?.trim() || TEXT_MODEL;
}

function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  const withoutFences = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(withoutFences);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503 || status === 500;
}

function retryDelayMs(status: number, attempt: number): number {
  if (status === 429) return Math.min(30_000, 2000 * Math.pow(2, attempt));
  return RETRY_BASE_MS * Math.pow(2, attempt);
}

function visionModelsToTry(): string[] {
  const primary = getGroqVisionModel();
  const list: string[] = [primary];
  for (const m of FALLBACK_VISION_MODELS) {
    if (!list.includes(m)) list.push(m);
  }
  return list;
}

function textModelsToTry(): string[] {
  const primary = getGroqTextModel();
  const list: string[] = [primary];
  for (const m of FALLBACK_TEXT_MODELS) {
    if (!list.includes(m)) list.push(m);
  }
  return list;
}

type GroqMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

interface GroqChatResponse {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: { message?: string; type?: string; code?: string };
}

async function callGroqWithRetry(
  messages: Array<{ role: "system" | "user"; content: GroqMessageContent }>,
  models: string[]
): Promise<string> {
  const apiKey = getGroqApiKey();
  let lastError: Error | null = null;

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.1,
            max_completion_tokens: 4096,
            response_format: { type: "json_object" },
          }),
        });

        const body = (await response.json()) as GroqChatResponse;

        if (!response.ok) {
          const apiMessage = body.error?.message ?? response.statusText;
          const err = new Error(
            `Groq API error (${response.status}): ${apiMessage}`
          );
          lastError = err;

          if (
            (response.status === 404 || response.status === 400) &&
            apiMessage.toLowerCase().includes("model")
          ) {
            break;
          }
          if (isRetryableStatus(response.status) && attempt < MAX_RETRIES_PER_MODEL - 1) {
            await sleep(retryDelayMs(response.status, attempt));
            continue;
          }
          if (isRetryableStatus(response.status)) break;
          throw err;
        }

        const content = body.choices?.[0]?.message?.content?.trim();

        if (!content) {
          lastError = new Error("No text response from Groq");
          break;
        }

        return content;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES_PER_MODEL - 1) {
          await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
          continue;
        }
        break;
      }
    }
  }

  const msg = lastError?.message ?? "Groq API request failed";
  if (msg.includes("503") || msg.toLowerCase().includes("high demand")) {
    throw new Error("AI service is busy. Wait a few seconds and click Extract again.");
  }
  if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
    throw new Error(
      "Groq rate limit exceeded. Wait a moment and try again."
    );
  }
  if (
    msg.toLowerCase().includes("invalid api key") ||
    msg.includes("401") ||
    msg.toLowerCase().includes("invalid_api_key")
  ) {
    throw new Error(
      "Invalid Groq API key. Check VITE_GROQ_API_KEY in Vercel (production) or client/.env.local (local), then redeploy."
    );
  }
  if (
    msg.toLowerCase().includes("invalid image") ||
    msg.toLowerCase().includes("failed to decode")
  ) {
    throw new Error(
      "Could not read this file as an image. Try a clearer scan, JPG/PNG, or a smaller PDF."
    );
  }
  throw new Error(msg);
}

function parseExtractionContent(content: string): SubmitPayload {
  let parsed: unknown;
  try {
    parsed = parseJsonResponse(content);
  } catch {
    throw new Error("AI returned invalid JSON — try again or use a clearer scan");
  }

  const result = extractionSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.issues.map((e) => e.message).join(", "));
  }

  return extractionToSubmit(result.data);
}

export async function extractReceiptFields(
  base64Data: string,
  mediaType: VisionMimeType
): Promise<SubmitPayload> {
  const dataUrl = `data:${mediaType};base64,${base64Data}`;
  const content = await callGroqWithRetry(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the full invoice including every line item row and totals.",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    visionModelsToTry()
  );

  return parseExtractionContent(content);
}

export async function extractReceiptFieldsFromText(
  documentText: string,
  sourceLabel: string
): Promise<SubmitPayload> {
  const content = await callGroqWithRetry(
    [
      { role: "system", content: TEXT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Source file: ${sourceLabel}\n\n--- Document text ---\n${documentText}\n\n--- End ---\n\nExtract the full invoice including every line item row and totals.`,
      },
    ],
    textModelsToTry()
  );

  return parseExtractionContent(content);
}
