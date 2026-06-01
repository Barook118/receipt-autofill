export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".msi", ".dll", ".sh"];

const IMAGE_EXT =
  /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif)$/i;
const PDF_EXT = /\.pdf$/i;
const OFFICE_EXT = /\.(xlsx|xls|docx)$/i;

export const ALLOWED_FILE_HINT =
  "Images (JPG, PNG, WEBP, HEIC…), PDF, Excel (.xlsx, .xls), or Word (.docx)";

export function isAllowedReceiptFile(file: File): boolean {
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return false;
  const name = file.name.toLowerCase();
  if (name.endsWith(".doc")) return false;
  if (BLOCKED_EXTENSIONS.some((ext) => name.endsWith(ext))) return false;
  return isPdfFile(file) || isImageFile(file) || isOfficeFile(file);
}

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || PDF_EXT.test(file.name)
  );
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}

export function isOfficeFile(file: File): boolean {
  const officeMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (file.type === "application/msword") return false;
  return officeMimes.includes(file.type) || OFFICE_EXT.test(file.name);
}

export function isSpreadsheetFile(file: File): boolean {
  return (
    /\.(xlsx|xls)$/i.test(file.name) ||
    file.type.includes("spreadsheet") ||
    file.type === "application/vnd.ms-excel"
  );
}

export function isWordFile(file: File): boolean {
  return (
    /\.docx$/i.test(file.name) ||
    file.type.includes("wordprocessingml")
  );
}
