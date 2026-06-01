import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist";
import * as XLSX from "xlsx";
import {
  isOfficeFile,
  isPdfFile,
  isSpreadsheetFile,
  isWordFile,
} from "./fileValidation";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

const MAX_TEXT_CHARS = 120_000;
const VISION_TARGET_BYTES = 3 * 1024 * 1024;

export type VisionMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

export interface VisionInput {
  base64: string;
  mimeType: VisionMimeType;
}

export type ExtractionInput =
  | { mode: "vision"; vision: VisionInput }
  | { mode: "text"; text: string; label: string };

function truncate(text: string): string {
  if (text.length <= MAX_TEXT_CHARS) return text;
  return `${text.slice(0, MAX_TEXT_CHARS)}\n\n[Document truncated for extraction]`;
}

async function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function compressImageIfNeeded(
  file: File
): Promise<{ base64: string; mimeType: VisionMimeType }> {
  const buffer = await readArrayBuffer(file);
  if (buffer.byteLength <= VISION_TARGET_BYTES) {
    const mime = (file.type || "image/jpeg") as VisionMimeType;
    return { base64: arrayBufferToBase64(buffer), mimeType: mime };
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process image in browser");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image compression failed"))),
      "image/jpeg",
      0.85
    );
  });

  const compressed = await blob.arrayBuffer();
  return {
    base64: arrayBufferToBase64(compressed),
    mimeType: "image/jpeg",
  };
}

async function excelToText(buffer: ArrayBuffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const parts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "\t", RS: "\n" });
    if (csv.trim()) {
      parts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
    }
  }

  const text = parts.join("\n\n").trim();
  if (!text) {
    throw new Error("Spreadsheet appears empty — add invoice rows and try again");
  }
  return truncate(text);
}

async function wordToText(buffer: ArrayBuffer, name: string): Promise<string> {
  if (name.toLowerCase().endsWith(".doc")) {
    throw new Error(
      "Legacy .doc files are not supported. Save as .docx or export to PDF."
    );
  }

  const result = await mammoth.extractRawText({
    arrayBuffer: buffer,
  });
  const text = result.value.trim();
  if (!text) {
    throw new Error("Word document has no readable text. Try exporting to PDF.");
  }
  return truncate(text);
}

async function canvasToJpegVision(
  canvas: HTMLCanvasElement,
  quality = 0.85
): Promise<{ base64: string; mimeType: VisionMimeType }> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PDF render failed"))),
      "image/jpeg",
      quality
    );
  });
  const buffer = await blob.arrayBuffer();
  if (buffer.byteLength > VISION_TARGET_BYTES) {
    throw new Error(
      "PDF page is too large after rendering. Export page 1 as JPG/PNG or use a smaller PDF."
    );
  }
  return {
    base64: arrayBufferToBase64(buffer),
    mimeType: "image/jpeg",
  };
}

async function pdfFirstPageToVision(
  buffer: ArrayBuffer
): Promise<{ base64: string; mimeType: VisionMimeType }> {
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  if (pdf.numPages < 1) {
    throw new Error("PDF has no pages.");
  }

  const page = await pdf.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2, 2000 / Math.max(baseViewport.width, baseViewport.height));
  const viewport = page.getViewport({ scale: Math.max(0.5, scale) });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not render PDF in browser");
  }

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvasToJpegVision(canvas);
}

async function extractDocumentText(file: File): Promise<string> {
  const buffer = await readArrayBuffer(file);
  if (isSpreadsheetFile(file)) {
    return excelToText(buffer);
  }
  if (isWordFile(file)) {
    return wordToText(buffer, file.name);
  }
  throw new Error("Unsupported office document type");
}

export async function prepareFileForExtraction(
  file: File
): Promise<ExtractionInput> {
  if (isOfficeFile(file)) {
    const text = await extractDocumentText(file);
    return { mode: "text", text, label: file.name };
  }

  if (isPdfFile(file)) {
    const buffer = await readArrayBuffer(file);
    if (buffer.byteLength > VISION_TARGET_BYTES) {
      throw new Error(
        "PDF is too large. Export page 1 as JPG/PNG or use a smaller PDF under 3MB."
      );
    }
    const vision = await pdfFirstPageToVision(buffer);
    return { mode: "vision", vision };
  }

  const vision = await compressImageIfNeeded(file);
  return { mode: "vision", vision };
}
