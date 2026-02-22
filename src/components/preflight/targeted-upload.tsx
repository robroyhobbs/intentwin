"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

interface TargetedUploadProps {
  gapType: "evidence" | "personnel" | "product" | "compliance";
  onUploadComplete?: () => void;
}

const ACCEPTED_TYPES = {
  evidence: {
    accept: ".pdf,.docx,.txt",
    label: "Upload Case Study",
    hint: "PDF, DOCX, or TXT (max 10MB)",
    endpoint: "/api/evidence/extract",
  },
  personnel: {
    accept: ".pdf,.docx,.txt",
    label: "Upload Resume",
    hint: "PDF, DOCX, or TXT (max 10MB)",
    endpoint: "/api/settings/team-members",
  },
  product: {
    accept: "",
    label: "Add in Settings",
    hint: "Go to Settings > Products & Services",
    endpoint: "",
  },
  compliance: {
    accept: "",
    label: "Add in Settings",
    hint: "Go to Settings > Company Profile",
    endpoint: "",
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function TargetedUpload({
  gapType,
  onUploadComplete,
}: TargetedUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authFetch = useAuthFetch();

  const config = ACCEPTED_TYPES[gapType];

  // For product and compliance gaps, show a link to settings instead of upload
  if (!config.endpoint) {
    return (
      <p className="text-xs text-[var(--accent)] cursor-pointer hover:underline">
        {config.label}: {config.hint}
      </p>
    );
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = config.accept.split(",");
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      toast.error(`Invalid file type. Accepted: ${config.accept}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    setUploadStatus("idle");

    try {
      if (gapType === "evidence") {
        // Upload as knowledge base document first, then extract evidence
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await authFetch("/api/knowledge-base/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload document");
        }

        const { document } = await uploadResponse.json();

        // Trigger evidence extraction
        const extractResponse = await authFetch("/api/evidence/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document_id: document.id }),
        });

        if (!extractResponse.ok) {
          throw new Error("Failed to extract evidence");
        }

        toast.success("Case study uploaded and extracted");
      } else if (gapType === "personnel") {
        // Upload resume for team member extraction
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await authFetch("/api/knowledge-base/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload resume");
        }

        const { document } = await uploadResponse.json();

        // Trigger resume extraction to create team member
        const extractResponse = await authFetch("/api/settings/team-members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_document_id: document.id,
            extract_from_resume: true,
          }),
        });

        if (!extractResponse.ok) {
          throw new Error("Failed to extract team member from resume");
        }

        toast.success("Resume uploaded and team member created");
      }

      setUploadStatus("success");
      onUploadComplete?.();
    } catch (error) {
      setUploadStatus("error");
      toast.error(
        error instanceof Error ? error.message : "Upload failed",
      );
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium",
          "border border-dashed border-[var(--border)]",
          "hover:border-[var(--accent)] hover:text-[var(--accent)]",
          "transition-colors",
          uploading && "opacity-50 cursor-not-allowed",
          uploadStatus === "success" && "border-emerald-500 text-emerald-500",
          uploadStatus === "error" && "border-red-500 text-red-500",
        )}
      >
        {uploading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : uploadStatus === "success" ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : uploadStatus === "error" ? (
          <AlertTriangle className="h-3 w-3" />
        ) : (
          <Upload className="h-3 w-3" />
        )}
        {uploading
          ? "Processing..."
          : uploadStatus === "success"
            ? "Uploaded"
            : config.label}
      </button>
      <p className="text-[10px] text-[var(--foreground-subtle)] mt-1">
        {config.hint}
      </p>
    </div>
  );
}
