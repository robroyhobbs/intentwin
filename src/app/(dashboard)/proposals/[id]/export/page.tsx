"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Presentation,
  Loader2,
  Download,
  Globe,
  FileDown,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { Breadcrumb } from "@/components/ui/breadcrumb";

type ExportFormat = "docx" | "pptx" | "html" | "pdf";

const EXPORT_OPTIONS: {
  format: ExportFormat;
  label: string;
  sublabel: string;
  icon: typeof FileText;
  gradient: string;
  iconBg: string;
  description: string;
}[] = [
  {
    format: "html",
    label: "HTML Landing Page",
    sublabel: ".html",
    icon: Globe,
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-500/10 text-emerald-600",
    description: "Premium branded page with scroll animations, responsive layout, and Mermaid diagrams",
  },
  {
    format: "pdf",
    label: "PDF Document",
    sublabel: ".pdf",
    icon: FileDown,
    gradient: "from-red-500 to-rose-500",
    iconBg: "bg-red-500/10 text-red-600",
    description: "Print-ready A4 document with embedded diagrams and professional formatting",
  },
  {
    format: "docx",
    label: "Word Document",
    sublabel: ".docx",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-500",
    iconBg: "bg-blue-500/10 text-blue-600",
    description: "Editable Word document for team collaboration and revisions",
  },
  {
    format: "pptx",
    label: "PowerPoint",
    sublabel: ".pptx",
    icon: Presentation,
    gradient: "from-orange-500 to-amber-500",
    iconBg: "bg-orange-500/10 text-orange-600",
    description: "Branded presentation deck for client meetings and stakeholder reviews",
  },
];

export default function ExportPage() {
  const params = useParams();
  const id = params.id as string;
  const [exporting, setExporting] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [lastFormat, setLastFormat] = useState<ExportFormat | null>(null);

  const authFetch = useAuthFetch();

  async function handleExport(format: ExportFormat) {
    setExporting(format);
    setDownloadUrl(null);
    try {
      const response = await authFetch(`/api/proposals/${id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      setLastFormat(format);
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/proposals" },
          { label: "Proposal", href: `/proposals/${id}` },
          { label: "Export" },
        ]}
      />

      <div className="mt-6 mb-8">
        <h1 className="text-2xl font-bold text-[#1B365D]">Export Proposal</h1>
        <p className="mt-2 text-sm text-gray-500">
          Choose a format to export your proposal. HTML pages can be deployed live via MyVibe.
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-2 gap-4">
        {EXPORT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isExporting = exporting === opt.format;
          return (
            <button
              key={opt.format}
              onClick={() => handleExport(opt.format)}
              disabled={exporting !== null}
              className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm hover-lift overflow-hidden transition-all disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-sm"
            >
              {/* Top gradient bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${opt.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${opt.iconBg} transition-all duration-200`}>
                  {isExporting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#1B365D] group-hover:text-[#0070AD] transition-colors">
                    {opt.label}
                  </h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {opt.sublabel}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                {opt.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#0070AD] opacity-0 group-hover:opacity-100 transition-all">
                Export
                <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Download Ready */}
      {downloadUrl && (
        <div className="mt-8 animate-fade-in-up">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-emerald-900">
                  Export Ready
                </h3>
                <p className="mt-1 text-xs text-emerald-700/70">
                  Your {lastFormat?.toUpperCase()} file has been generated successfully.
                </p>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MyVibe Deploy Instructions */}
      {lastFormat === "html" && downloadUrl && (
        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="rounded-2xl border border-[#0070AD]/20 bg-gradient-to-br from-[#0070AD]/5 to-[#12ABDB]/5 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0070AD]/10">
                <Rocket className="h-5 w-5 text-[#0070AD]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#1B365D]">
                  Deploy as Live Landing Page
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Your HTML export is a self-contained, responsive landing page. Deploy it live in seconds with MyVibe.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0070AD]/10 text-[10px] font-bold text-[#0070AD] flex-shrink-0">1</div>
                    <p className="text-xs text-gray-600">Download the HTML file using the button above</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0070AD]/10 text-[10px] font-bold text-[#0070AD] flex-shrink-0">2</div>
                    <div>
                      <p className="text-xs text-gray-600">Run the deploy command in Claude Code:</p>
                      <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#1B365D] px-3 py-2">
                        <Terminal className="h-3.5 w-3.5 text-[#12ABDB]" />
                        <code className="text-xs text-emerald-300 font-mono">/myvibe:publish</code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0070AD]/10 text-[10px] font-bold text-[#0070AD] flex-shrink-0">3</div>
                    <p className="text-xs text-gray-600">Your proposal is live and shareable with stakeholders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
