interface OriginalDocumentViewerProps {
  url: string;
  mimeType: string;
  fileName: string;
  className?: string;
}

export function OriginalDocumentViewer({
  url,
  mimeType,
  fileName,
  className = "",
}: OriginalDocumentViewerProps) {
  const type = mimeType.toLowerCase();

  if (type.startsWith("image/")) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>
        <img
          src={url}
          alt={fileName}
          className="mx-auto block h-auto max-h-[70vh] w-full object-contain"
        />
      </div>
    );
  }

  if (type === "application/pdf") {
    return (
      <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}>
        <iframe
          src={`${url}#view=FitH`}
          title={fileName}
          className="h-[min(70vh,900px)] w-full bg-white"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-6 text-center ${className}`}
    >
      <p className="text-sm font-medium text-slate-800">Original file preserved</p>
      <p className="mt-1 truncate text-xs text-slate-500">{fileName}</p>
      <a
        href={url}
        download={fileName}
        className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
      >
        Download original
      </a>
    </div>
  );
}
