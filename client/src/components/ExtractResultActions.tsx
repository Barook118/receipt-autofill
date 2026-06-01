interface ExtractResultActionsProps {
  onView: () => void;
  onEdit: () => void;
}

export function ExtractResultActions({
  onView,
  onEdit,
}: ExtractResultActionsProps) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
      <p className="text-sm font-medium text-emerald-900">
        Extraction complete — review below, then save to Convex
      </p>
      <p className="mt-1 text-xs text-emerald-800">
        All columns and line rows from your file are in the editor. Fix anything,
        then click <strong>Save to database</strong>. You can also view the layout first.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100"
        >
          View original invoice
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100"
        >
          Jump to editor
        </button>
      </div>
    </div>
  );
}
