import { useState, useEffect, useRef, useCallback } from "react";
import { UserButton } from "@clerk/clerk-react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ReceiptUploader } from "../components/ReceiptUploader";
import { InvoiceEditor } from "../components/InvoiceEditor";
import { ReceiptHistory } from "../components/ReceiptHistory";
import { ReceiptViewModal } from "../components/ReceiptViewModal";
import { ExtractResultActions } from "../components/ExtractResultActions";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Toast } from "../components/Toast";
import { useReceiptExtract } from "../hooks/useReceiptExtract";
import { useReceiptSubmit } from "../hooks/useReceiptSubmit";
import { useReceiptUpdate } from "../hooks/useReceiptUpdate";
import { useReceiptDelete } from "../hooks/useReceiptDelete";
import { useReceiptList } from "../hooks/useReceiptList";
import {
  recordToInvoice,
  normalizeInvoiceForForm,
} from "../lib/receiptUtils";
import {
  exportInvoiceAsPdf,
  exportInvoiceAsPng,
} from "../lib/exportInvoice";
import {
  canExportOriginalAsVisual,
  exportOriginalDocument,
} from "../lib/exportOriginalDocument";
import { InvoicePreview } from "../components/InvoicePreview";
import type { InvoiceDocument, ReceiptRecord } from "../types/receipt";

export function HomePage() {
  const [formData, setFormData] = useState<InvoiceDocument | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptRecord | null>(
    null
  );
  const [viewingDraft, setViewingDraft] = useState<InvoiceDocument | null>(
    null
  );
  const [pendingDelete, setPendingDelete] = useState<ReceiptRecord | null>(
    null
  );
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [exportTarget, setExportTarget] = useState<InvoiceDocument | null>(null);
  const [exportBusyId, setExportBusyId] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const savedListRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const exportPreviewRef = useRef<HTMLDivElement>(null);
  const convex = useConvex();

  const {
    extract,
    loading: extracting,
    error: extractError,
    setError: setExtractError,
  } = useReceiptExtract();
  const {
    submit,
    loading: submitting,
    error: submitError,
    setError: setSubmitError,
  } = useReceiptSubmit();
  const {
    update,
    loading: updating,
    error: updateError,
    setError: setUpdateError,
  } = useReceiptUpdate();
  const {
    remove,
    loading: deleting,
    error: deleteError,
    setError: setDeleteError,
  } = useReceiptDelete();
  const {
    receipts,
    loading: listLoading,
    error: listError,
    refresh: refreshList,
    upsertReceipt,
    removeReceipt,
  } = useReceiptList();

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    const message =
      extractError || submitError || updateError || deleteError || null;
    if (message) setToast({ message, type: "error" });
  }, [extractError, submitError, updateError, deleteError]);

  const scrollToSavedList = useCallback(() => {
    savedListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToEditor = useCallback(() => {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => setHighlightId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  const openEditor = useCallback(
    (invoice: InvoiceDocument, recordId?: string | null) => {
      setViewingDraft(null);
      setViewingReceipt(null);
      setFormData(normalizeInvoiceForForm(invoice));
      setEditingId(recordId ?? null);
      setEditorOpen(true);
      setEditorKey((k) => k + 1);
      requestAnimationFrame(() => scrollToEditor());
    },
    [scrollToEditor]
  );

  const handleExtract = async (file: File) => {
    setExtractError(null);
    setEditingId(null);
    setEditorOpen(false);
    setViewingDraft(null);
    setViewingReceipt(null);
    setSourceFile(file);
    const data = await extract(file);
    if (data) {
      setFormData(normalizeInvoiceForForm(data));
      setEditorOpen(true);
      setEditorKey((k) => k + 1);
      setToast({
        message: "Invoice extracted — review fields below, then Save to database",
        type: "success",
      });
      requestAnimationFrame(() => scrollToEditor());
    }
  };

  const handleFormSave = async (invoice: InvoiceDocument) => {
    if (editingId) {
      setUpdateError(null);
      const updated = await update(editingId, invoice);
      if (updated) {
        upsertReceipt(updated);
        setHighlightId(updated._id);
        if (viewingReceipt?._id === updated._id) {
          setViewingReceipt(updated);
        }
        setToast({ message: "Changes saved to database", type: "success" });
        setFormData(null);
        setEditingId(null);
        setEditorOpen(false);
        void refreshList();
        scrollToSavedList();
      }
      return;
    }

    setSubmitError(null);
    const saved = await submit(invoice, sourceFile);
    if (saved) {
      upsertReceipt(saved);
      setHighlightId(saved._id);
      setToast({ message: "Invoice saved to database", type: "success" });
      setFormData(null);
      setEditorOpen(false);
      setViewingDraft(null);
      setSourceFile(null);
      void refreshList();
      scrollToSavedList();
    }
  };

  const handleViewFromHistory = (record: ReceiptRecord) => {
    setViewingDraft(null);
    setViewingReceipt(record);
  };

  const handleViewExtracted = () => {
    if (!formData) return;
    setViewingReceipt(null);
    setViewingDraft(formData);
  };

  const handleEditFromHistory = (record: ReceiptRecord) => {
    openEditor(recordToInvoice(record), record._id);
  };

  const handleEditFromModal = (
    invoice: InvoiceDocument,
    recordId?: string
  ) => {
    openEditor(invoice, recordId ?? null);
  };

  const handleExportFromHistory = async (
    record: ReceiptRecord,
    format: "png" | "pdf"
  ) => {
    const invoice = recordToInvoice(record);
    setExportBusyId(record._id);
    try {
      if (record.hasSourceFile) {
        const original = await convex.query(api.receipts.getSourceUrl, {
          id: record._id as Id<"receipts">,
        });
        if (
          original?.url &&
          canExportOriginalAsVisual(original.mimeType)
        ) {
          await exportOriginalDocument(
            original.url,
            original.mimeType,
            format,
            invoice,
            original.fileName
          );
          return;
        }
      }

      setExportTarget(invoice);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const element = exportPreviewRef.current;
      if (!element) return;
      if (format === "png") {
        await exportInvoiceAsPng(element, invoice);
      } else {
        await exportInvoiceAsPdf(element, invoice);
      }
    } finally {
      setExportTarget(null);
      setExportBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteError(null);
    const id = pendingDelete._id;
    const ok = await remove(id);
    if (ok) {
      removeReceipt(id);
      if (viewingReceipt?._id === id) setViewingReceipt(null);
      if (editingId === id) {
        setEditingId(null);
        setFormData(null);
        setEditorOpen(false);
      }
      setPendingDelete(null);
      setToast({ message: "Invoice deleted from database", type: "success" });
      void refreshList();
    }
  };

  const showExtractActions =
    Boolean(formData) && !editingId && editorOpen;

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <h1 className="min-w-0 text-lg font-bold leading-tight text-slate-900 sm:text-2xl lg:text-3xl">
            Invoice &amp; Receipt Auto-Fill
          </h1>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 sm:h-9 sm:w-9",
                },
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-5 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <ReceiptUploader
            onExtract={handleExtract}
            loading={extracting}
            error={extractError}
          />
          {showExtractActions && (
            <div className="mt-4">
              <ExtractResultActions
                onView={handleViewExtracted}
                onEdit={() => openEditor(formData!, null)}
              />
            </div>
          )}
        </section>

        <section
          ref={editorRef}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <InvoiceEditor
            key={editorKey}
            initialData={editorOpen && formData ? formData : null}
            editingId={editingId}
            onSubmit={handleFormSave}
            onCancelEdit={() => {
              setEditingId(null);
              setFormData(null);
              setEditorOpen(false);
            }}
            loading={submitting || updating}
          />
        </section>

        <ReceiptHistory
          receipts={receipts}
          loading={listLoading}
          error={listError}
          highlightId={highlightId}
          listRef={savedListRef}
          onRefresh={() => void refreshList()}
          onView={handleViewFromHistory}
          onEdit={handleEditFromHistory}
          onExport={handleExportFromHistory}
          onDelete={setPendingDelete}
          exportBusyId={exportBusyId}
        />
      </main>

      {exportTarget && (
        <div
          className="pointer-events-none fixed -left-[9999px] top-0"
          aria-hidden
        >
          <div ref={exportPreviewRef}>
            <InvoicePreview invoice={exportTarget} />
          </div>
        </div>
      )}

      <ReceiptViewModal
        receipt={viewingReceipt}
        draft={viewingDraft}
        draftSourceFile={viewingDraft ? sourceFile : null}
        onClose={() => {
          setViewingReceipt(null);
          setViewingDraft(null);
        }}
        onEdit={handleEditFromModal}
        onDelete={setPendingDelete}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete invoice?"
        message={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.merchantName || "this invoice"}" (${pendingDelete.invoiceNumber || "no number"})? This cannot be undone.`
            : ""
        }
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
