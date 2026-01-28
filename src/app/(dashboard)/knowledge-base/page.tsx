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
} from "lucide-react";

export const dynamic = "force-dynamic";

const fileTypeIcon: Record<string, React.ReactNode> = {
  docx: <FileText className="h-5 w-5 text-blue-500" />,
  pdf: <FileSpreadsheet className="h-5 w-5 text-red-500" />,
  pptx: <Presentation className="h-5 w-5 text-orange-500" />,
};

const statusBadge: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  pending: {
    icon: <Clock className="h-3 w-3" />,
    label: "Pending",
    className: "bg-gray-100 text-gray-700",
  },
  processing: {
    icon: <Clock className="h-3 w-3 animate-spin" />,
    label: "Processing",
    className: "bg-blue-100 text-blue-700",
  },
  completed: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Ready",
    className: "bg-green-100 text-green-700",
  },
  failed: {
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Failed",
    className: "bg-red-100 text-red-700",
  },
};

export default async function KnowledgeBasePage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  const totalDocs = documents?.length ?? 0;
  const completedDocs =
    documents?.filter((d) => d.processing_status === "completed").length ?? 0;
  const totalChunks =
    documents?.reduce((sum, d) => sum + (d.chunk_count || 0), 0) ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your source documents for proposal generation
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/knowledge-base/search"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          <Link
            href="/knowledge-base/upload"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Documents</p>
          <p className="text-2xl font-bold text-gray-900">{totalDocs}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Indexed</p>
          <p className="text-2xl font-bold text-gray-900">{completedDocs}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Chunks</p>
          <p className="text-2xl font-bold text-gray-900">{totalChunks}</p>
        </div>
      </div>

      {/* Document list */}
      {!documents || documents.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No documents uploaded
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Upload winning proposals, case studies, and other source documents.
          </p>
          <Link
            href="/knowledge-base/upload"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload Documents
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => {
              const status = statusBadge[doc.processing_status] ?? statusBadge.pending;
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    {fileTypeIcon[doc.file_type] ?? (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.file_name} &middot;{" "}
                        {doc.document_type.replace("_", " ")}
                        {doc.chunk_count > 0 && ` \u00B7 ${doc.chunk_count} chunks`}
                      </p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.icon}
                    {status.label}
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
