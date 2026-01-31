"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

const DOCUMENT_TYPES = [
  { value: "proposal", label: "Proposal" },
  { value: "case_study", label: "Case Study" },
  { value: "methodology", label: "Methodology" },
  { value: "capability", label: "Capability Statement" },
  { value: "team_bio", label: "Team Bio" },
  { value: "template", label: "Template" },
  { value: "rfp", label: "RFP" },
  { value: "other", label: "Other" },
];

const INDUSTRIES = [
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Energy & Utilities",
  "Public Sector",
  "Telecom",
  "Technology",
  "Other",
];

const SERVICE_LINES = [
  "Cloud Migration",
  "App Modernization",
  "Data & Analytics",
  "Digital Transformation",
  "Infrastructure",
  "Other",
];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState("proposal");
  const [industry, setIndustry] = useState("");
  const [serviceLine, setServiceLine] = useState("");
  const [clientName, setClientName] = useState("");
  const [winStatus, setWinStatus] = useState("unknown");
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.(docx|pdf|pptx)$/i, ""));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const authFetch = useAuthFetch();

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("document_type", documentType);
      if (industry) formData.append("industry", industry);
      if (serviceLine) formData.append("service_line", serviceLine);
      if (clientName) formData.append("client_name", clientName);
      formData.append("win_status", winStatus);

      const response = await authFetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      toast.success("Document uploaded and processing started");
      router.push("/knowledge-base");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const fieldClass =
    "mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";
  const labelClass = "block text-sm font-medium text-[var(--foreground)]";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Upload Document</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        Add a document to the knowledge base for proposal generation
      </p>

      <form onSubmit={handleUpload} className="mt-6 space-y-6">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
              : file
              ? "border-[var(--success)] bg-[var(--success-subtle)]"
              : "border-[var(--border)] hover:border-[var(--foreground-subtle)]"
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-[var(--success)]" />
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--foreground)]">{file.name}</p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="ml-2 rounded-full p-1 hover:bg-[var(--background-tertiary)]"
              >
                <X className="h-4 w-4 text-[var(--foreground-muted)]" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-10 w-10 text-[var(--foreground-subtle)]" />
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag and drop a file, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                DOCX, PDF, or PPTX (max 50MB)
              </p>
            </>
          )}
        </div>

        {/* Metadata fields */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className={fieldClass}
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Win Status
              </label>
              <select
                value={winStatus}
                onChange={(e) => setWinStatus(e.target.value)}
                className={fieldClass}
              >
                <option value="unknown">Unknown</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={fieldClass}
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i.toLowerCase().replace(/\s+/g, "_")}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Service Line
              </label>
              <select
                value={serviceLine}
                onChange={(e) => setServiceLine(e.target.value)}
                className={fieldClass}
              >
                <option value="">Select service line...</option>
                {SERVICE_LINES.map((s) => (
                  <option key={s} value={s.toLowerCase().replace(/\s+/g, "_")}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Client Name (optional, will be anonymized)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || !title || uploading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Document
            </>
          )}
        </button>
      </form>
    </div>
  );
}
