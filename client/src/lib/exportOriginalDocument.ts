import * as pdfjs from "pdfjs-dist";
import { jsPDF } from "jspdf";
import type { InvoiceDocument } from "../types/receipt";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

function safeFilename(invoice: InvoiceDocument, fileName?: string): string {
  if (fileName?.trim()) {
    return fileName.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  }
  const base =
    invoice.invoiceNumber?.trim() ||
    invoice.merchantName?.trim() ||
    "invoice";
  return base.replace(/[^\w\-]+/g, "_").slice(0, 80) || "invoice";
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function fetchSourceBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not load original invoice file");
  }
  return response.blob();
}

async function pdfFirstPageToPngBlob(pdfBlob: Blob): Promise<Blob> {
  const buffer = await pdfBlob.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not render original PDF");
  }
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
      "image/png"
    );
  });
}

async function imageBlobToPdfBlob(imageBlob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(imageBlob);
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process original image");
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imgData = canvas.toDataURL("image/png");
  const orientation = width > height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [width, height],
  });
  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  return pdf.output("blob");
}

export async function exportOriginalDocument(
  url: string,
  mimeType: string,
  format: "png" | "pdf",
  invoice: InvoiceDocument,
  fileName?: string
): Promise<void> {
  const baseName = safeFilename(invoice, fileName);
  const blob = await fetchSourceBlob(url);
  const type = mimeType.toLowerCase();

  if (format === "png") {
    if (type.startsWith("image/")) {
      const ext = type.includes("jpeg") || type.includes("jpg") ? "jpg" : "png";
      downloadBlob(blob, `${baseName}.${ext}`);
      return;
    }
    if (type === "application/pdf") {
      const pngBlob = await pdfFirstPageToPngBlob(blob);
      downloadBlob(pngBlob, `${baseName}.png`);
      return;
    }
    throw new Error("Original file type cannot be exported as PNG");
  }

  if (type === "application/pdf") {
    downloadBlob(blob, `${baseName}.pdf`);
    return;
  }
  if (type.startsWith("image/")) {
    const pdfBlob = await imageBlobToPdfBlob(blob);
    downloadBlob(pdfBlob, `${baseName}.pdf`);
    return;
  }
  throw new Error("Original file type cannot be exported as PDF");
}

export function canExportOriginalAsVisual(mimeType: string): boolean {
  const type = mimeType.toLowerCase();
  return type.startsWith("image/") || type === "application/pdf";
}
