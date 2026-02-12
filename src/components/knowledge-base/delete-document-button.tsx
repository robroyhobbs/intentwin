"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { toast } from "sonner";

interface DeleteDocumentButtonProps {
  documentId: string;
  documentTitle: string;
}

export function DeleteDocumentButton({
  documentId,
  documentTitle,
}: DeleteDocumentButtonProps) {
  const authFetch = useAuthFetch();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Delete "${documentTitle}"? This will remove the document and all its chunks. This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await authFetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || "Failed to delete",
        );
      }

      toast.success("Document deleted");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete document",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg p-1.5 text-[var(--foreground-subtle)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors disabled:opacity-50"
      title="Delete document"
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
