import { useCallback, useRef, useState } from "react";
import {
  ALLOWED_FILE_HINT,
  isAllowedReceiptFile,
  isImageFile,
  isOfficeFile,
  isPdfFile,
  isSpreadsheetFile,
  isWordFile,
} from "../lib/fileValidation";

interface ReceiptUploaderProps {
  onExtract: (file: File) => void;
  loading: boolean;
  error: string | null;
}

export function ReceiptUploader({
  onExtract,
  loading,
  error,
}: ReceiptUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isOffice, setIsOffice] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback((selected: File) => {
    setLocalError(null);

    if (!isAllowedReceiptFile(selected)) {
      const name = selected.name.toLowerCase();
      if (selected.size === 0) {
        setLocalError("File is empty — choose another file");
      } else if (name.endsWith(".doc")) {
        setLocalError(
          "Legacy .doc is not supported. Save as .docx or export to PDF."
        );
      } else if (selected.size > 10 * 1024 * 1024) {
        setLocalError("File must be 10MB or smaller");
      } else {
        setLocalError(`Unsupported file. ${ALLOWED_FILE_HINT}`);
      }
      return;
    }

    setFile(selected);
    const pdf = isPdfFile(selected);
    const office = isOfficeFile(selected);
    setIsPdf(pdf);
    setIsOffice(office);

    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return pdf || office || !isImageFile(selected)
        ? null
        : URL.createObjectURL(selected);
    });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSet(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) validateAndSet(selected);
  };

  const handleExtract = () => {
    if (file) onExtract(file);
  };

  const displayError = localError || error;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Upload invoice or receipt</h2>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition sm:p-8 ${
          dragOver
            ? "border-primary bg-blue-50"
            : "border-slate-200 bg-white hover:border-primary/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf,.pdf,.xlsx,.xls,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleFile}
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-primary">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">
          Drag & drop or click to upload
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {ALLOWED_FILE_HINT} — up to 10MB
        </p>
      </div>

      {file && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-xs text-slate-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
            {isPdf ? " · PDF" : ""}
            {isOffice && isSpreadsheetFile(file)
              ? " · Excel (text extracted for AI)"
              : ""}
            {isOffice && isWordFile(file) ? " · Word (text extracted for AI)" : ""}
          </p>
        </div>
      )}

      {preview && !isPdf && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-48 w-full object-contain bg-slate-100 sm:max-h-64"
          />
        </div>
      )}

      {isPdf && file && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="text-2xl" aria-hidden="true">
            PDF
          </span>
          <span>Preview not available — first page is analyzed on extract.</span>
        </div>
      )}

      {isOffice && file && !isPdf && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="text-2xl" aria-hidden="true">
            {isSpreadsheetFile(file) ? "XLS" : "DOC"}
          </span>
          <span>
            Preview not available — document text is sent to AI on extract.
          </span>
        </div>
      )}

      {displayError && (
        <p className="text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}

      <button
        type="button"
        onClick={handleExtract}
        disabled={!file || loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Spinner />
            Extracting fields…
          </span>
        ) : (
          "Extract invoice"
        )}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
