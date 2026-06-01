import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { InvoiceDocument } from "../types/receipt";

function safeFilename(invoice: InvoiceDocument): string {
  const base =
    invoice.invoiceNumber?.trim() ||
    invoice.merchantName?.trim() ||
    "invoice";
  return base.replace(/[^\w\-]+/g, "_").slice(0, 80) || "invoice";
}

export async function exportInvoiceAsPng(
  element: HTMLElement,
  invoice: InvoiceDocument
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const link = document.createElement("a");
  link.download = `${safeFilename(invoice)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function exportInvoiceAsPdf(
  element: HTMLElement,
  invoice: InvoiceDocument
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  let imgWidth = maxWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const x = (pageWidth - imgWidth) / 2;
  pdf.addImage(imgData, "PNG", x, margin, imgWidth, imgHeight);
  pdf.save(`${safeFilename(invoice)}.pdf`);
}
