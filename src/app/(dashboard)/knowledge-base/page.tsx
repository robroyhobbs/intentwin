import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Upload,
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  Database,
} from "lucide-react";
import { BulkImportButton } from "@/components/knowledge-base/bulk-import-button";
import { DeleteDocumentButton } from "@/components/knowledge-base/delete-document-button";

export const dynamic = "force-dynamic";

const fileTypeIcon: Record<string, React.ReactNode> = {
  docx: <FileText className="h-5 w-5 text-[var(--accent)]" />,
  pdf: <FileSpreadsheet className="h-5 w-5 text-[var(--destructive)]" />,
  pptx: <Presentation className="h-5 w-5 text-[var(--warning)]" />,
};

const statusBadge: Record<
  string,
  { icon: React.ReactNode; label: string; className: string }
> = {
  pending: {
    icon: <Clock className="h-3 w-3" />,
    label: "Pending",
    className: "badge badge-default",
  },
  processing: {
    icon: <Clock className="h-3 w-3 animate-spin" />,
    label: "Processing",
    className: "badge badge-generating",
  },
  completed: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Ready",
    className: "badge badge-success",
  },
  failed: {
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Failed",
    className: "badge badge-destructive",
  },
};

export default async function KnowledgeBasePage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, file_name, file_type, file_size_bytes, document_type, processing_status, processing_error, chunk_count, uploaded_by, created_at, updated_at")
    .order("created_at", { ascending: false });

  const totalDocs = documents?.length ?? 0;
  const completedDocs =
    documents?.filter((d) => d.processing_status === "completed").length ?? 0;
  const totalChunks =
    documents?.reduce((sum, d) => sum + (d.chunk_count || 0), 0) ?? 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Database className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Knowledge Base
            </h1>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              Manage uploaded documents for proposal generation
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href="/knowledge-base/search"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          <BulkImportButton />
          <Link
            href="/knowledge-base/upload"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-2">
        <Link
          href="/knowledge-base/sources"
          className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
        >
          <BookOpen className="h-4 w-4" />
          L1 Sources (Company Truth)
        </Link>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--accent)]">
          <Database className="h-4 w-4" />
          Uploaded Documents
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] text-[var(--accent)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {totalDocs}
            </p>
            <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Total Documents
            </p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--success)] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--success-subtle)] border border-[var(--success-muted)] text-[var(--success)]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {completedDocs}
            </p>
            <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Indexed
            </p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--info)] hover:shadow-[0_0_20px_rgba(0,102,255,0.15)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--info-subtle)] border border-[var(--info-muted)] text-[var(--info)]">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {totalChunks}
            </p>
            <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Total Chunks
            </p>
          </div>
        </div>
      </div>

      {/* Document list */}
      {!documents || documents.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-[var(--foreground-subtle)]" />
          <h3 className="mt-4 text-lg font-medium text-[var(--foreground)]">
            No documents uploaded
          </h3>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Upload winning proposals, case studies, and other source documents.
          </p>
          <Link
            href="/knowledge-base/upload"
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Documents
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {documents.map((doc) => {
              const status =
                statusBadge[doc.processing_status] ?? statusBadge.pending;
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    {fileTypeIcon[doc.file_type] ?? (
                      <FileText className="h-5 w-5 text-[var(--foreground-subtle)]" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {doc.title}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {doc.file_name} &middot;{" "}
                        {doc.document_type.replace("_", " ")}
                        {doc.chunk_count > 0 &&
                          ` \u00B7 ${doc.chunk_count} chunks`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-1 ${status.className}`}
                    >
                      {status.icon}
                      {status.label}
                    </div>
                    <DeleteDocumentButton
                      documentId={doc.id}
                      documentTitle={doc.title}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
