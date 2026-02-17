"use client";

import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  deleteConfirm: { id: string; type: "context" | "product" };
  setDeleteConfirm: (
    value: { id: string; type: "context" | "product" } | null,
  ) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteContext: (id: string) => void;
}

export function DeleteConfirmModal({
  deleteConfirm,
  setDeleteConfirm,
  onDeleteProduct,
  onDeleteContext,
}: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setDeleteConfirm(null)}
    >
      <div
        className="card p-6 max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-[var(--foreground)]">
          Are you sure you want to delete this{" "}
          {deleteConfirm.type === "product" ? "product" : "item"}?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              deleteConfirm.type === "product"
                ? onDeleteProduct(deleteConfirm.id)
                : onDeleteContext(deleteConfirm.id)
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--danger)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
