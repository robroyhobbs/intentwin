"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { BulkImportModal } from "./bulk-import-modal";

export function BulkImportButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <Layers className="h-4 w-4" />
        Bulk Import
      </button>
      <BulkImportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={() => {
          router.refresh();
        }}
      />
    </>
  );
}
