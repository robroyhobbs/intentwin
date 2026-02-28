"use client";

import { useState, useCallback } from "react";
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
  Play,
  Sparkles,
  Monitor,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ExportGateModal } from "@/components/compliance/export-gate-modal";
import type { ExportFormat } from "@/lib/export/formats";

const EXPORT_OPTIONS: {
  format: ExportFormat;
  label: string;
  sublabel: string;
  icon: typeof FileText;
  gradient: string;
  iconBg: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    format: "slides",
    label: "Web Presentation",
    sublabel: "Interactive Slides",
    icon: Play,
    gradient: "from-[var(--brand-primary)] to-[var(--brand-accent)]",
    iconBg: "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]",
    description:
      "Modern, interactive slides for sales discussions. Keyboard/touch navigation, fullscreen mode, concise bullets.",
    recommended: true,
  },
  {
    format: "pptx",
    label: "PowerPoint",
    sublabel: ".pptx",
    icon: Presentation,
    gradient: "from-orange-500 to-amber-500",
    iconBg:
      "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    description:
      "Classic PowerPoint for team editing and enterprise compatibility.",
  },
  {
    format: "html",
    label: "Landing Page",
    sublabel: ".html",
    icon: Globe,
    gradient: "from-emerald-500 to-teal-500",
    iconBg:
      "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    description:
      "Premium branded page with scroll animations for detailed proposals.",
  },
  {
    format: "docx",
    label: "Word Document",
    sublabel: ".docx",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-500",
    iconBg:
      "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    description: "Editable document for team collaboration and revisions.",
  },
  {
    format: "pdf",
    label: "PDF Document",
    sublabel: ".pdf",
    icon: FileDown,
    gradient: "from-red-500 to-rose-500",
    iconBg: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    description: "Print-ready document with professional formatting.",
  },
];

interface UnaddressedRequirement {
  id: string;
  requirement_text: string;
  category: "mandatory" | "desirable" | "informational";
  compliance_status: string;
  suggested_section?: string | null;
}

export default function ExportPage() {
  const params = useParams();
  const id = params.id as string;
  const [exporting, setExporting] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [lastFormat, setLastFormat] = useState<ExportFormat | null>(null);
  const [gateRequirements, setGateRequirements] = useState<
    UnaddressedRequirement[] | null
  >(null);
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);

  const authFetch = useAuthFetch();

  const doExport = useCallback(
    async (format: ExportFormat) => {
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
        toast.success(
          `${format === "slides" ? "Presentation" : format.toUpperCase()} exported successfully`,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Export failed");
      } finally {
        setExporting(null);
      }
    },
    [authFetch, id],
  );

  // Track whether user explicitly dismissed the compliance gate this session
  const [gateBypassedThisSession, setGateBypassedThisSession] = useState(false);

  async function handleExport(format: ExportFormat) {
    // If user already chose "Export Anyway" this session, skip the gate
    if (gateBypassedThisSession) {
      doExport(format);
      return;
    }

    // Check for unaddressed requirements (fail-open: if check fails, proceed with export)
    try {
      const res = await authFetch(`/api/proposals/${id}/requirements`);
      if (res.ok) {
        const data = await res.json();
        const requirements = data.requirements || [];
        const unaddressed = requirements.filter(
          (r: UnaddressedRequirement) =>
            r.compliance_status === "not_addressed" ||
            r.compliance_status === "partially_met",
        );
        if (unaddressed.length > 0) {
          setGateRequirements(unaddressed);
          setPendingFormat(format);
          return;
        }
      }
    } catch {
      // Fail-open: proceed with export if gate check fails
    }
    doExport(format);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/proposals" },
          { label: "Proposal", href: `/proposals/${id}` },
          { label: "Export" },
        ]}
      />

      <div className="mt-8 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] shadow-lg">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Export Proposal
          </h1>
        </div>
        <p className="text-sm text-[var(--foreground-muted)] ml-[52px]">
          Choose a format to export your proposal. Web presentations are
          recommended for sales discussions.
        </p>
      </div>

      {/* Recommended Badge */}
      <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 w-fit">
        <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
        <span className="text-xs font-medium text-[var(--brand-primary)]">
          Web Presentation is optimized for sales-ready, concise slides
        </span>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isExporting = exporting === opt.format;
          const isRecommended = opt.recommended;
          return (
            <button
              key={opt.format}
              onClick={() => handleExport(opt.format)}
              disabled={exporting !== null}
              className={`group relative flex flex-col rounded-2xl border bg-[var(--card-bg)] p-5 text-left shadow-sm transition-all duration-200 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-sm hover:shadow-lg hover:border-[var(--brand-primary)]/50 hover:-translate-y-1 ${
                isRecommended
                  ? "border-[var(--brand-primary)]/30 ring-2 ring-[var(--brand-primary)]/10"
                  : "border-[var(--border)]"
              }`}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-semibold uppercase tracking-wider">
                  Recommended
                </div>
              )}

              {/* Top gradient bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${opt.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl`}
              />

              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${opt.iconBg} transition-all duration-200`}
                >
                  {isExporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--brand-primary)] transition-colors">
                    {opt.label}
                  </h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                    {opt.sublabel}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--foreground-muted)] leading-relaxed">
                {opt.description}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] opacity-0 group-hover:opacity-100 transition-all">
                {isExporting ? "Generating..." : "Export"}
                <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Download Ready */}
      {downloadUrl && (
        <div className="mt-8 animate-fade-in-up">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Export Ready
                </h3>
                <p className="mt-1 text-xs text-emerald-700/70 dark:text-emerald-300/70">
                  Your{" "}
                  {lastFormat === "slides"
                    ? "presentation"
                    : lastFormat?.toUpperCase()}{" "}
                  has been generated successfully.
                </p>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:bg-emerald-500 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Instructions for slides/html */}
      {(lastFormat === "slides" || lastFormat === "html") && downloadUrl && (
        <div
          className="mt-6 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="rounded-2xl border border-[var(--brand-primary)]/20 bg-gradient-to-br from-[var(--brand-primary)]/5 to-[var(--brand-accent)]/5 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
                <Rocket className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  Deploy as Live{" "}
                  {lastFormat === "slides" ? "Presentation" : "Landing Page"}
                </h3>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  {lastFormat === "slides"
                    ? "Share your interactive presentation with stakeholders via a live URL."
                    : "Your HTML export is a self-contained, responsive page. Deploy it live in seconds."}
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[10px] font-bold text-[var(--brand-primary)] flex-shrink-0">
                      1
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Download the file using the button above
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[10px] font-bold text-[var(--brand-primary)] flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Run the deploy command in Claude Code:
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] px-3 py-2">
                        <Terminal className="h-3.5 w-3.5 text-[var(--brand-accent)]" />
                        <code className="text-xs text-[var(--brand-primary)] font-mono">
                          /myvibe:publish
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[10px] font-bold text-[var(--brand-primary)] flex-shrink-0">
                      3
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Your{" "}
                      {lastFormat === "slides" ? "presentation" : "proposal"} is
                      live and shareable!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips for slides */}
      {lastFormat === "slides" && downloadUrl && (
        <div
          className="mt-6 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              Presentation Tips
            </h4>
            <ul className="space-y-2 text-xs text-[var(--foreground-muted)]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-accent)]">→</span>
                Use arrow keys or swipe to navigate between slides
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-accent)]">→</span>
                Press F for fullscreen presentation mode
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-accent)]">→</span>
                Works on desktop, tablet, and mobile devices
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-accent)]">→</span>
                Slides are optimized for discussion, not detail
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Export Gate Modal */}
      {gateRequirements && pendingFormat && (
        <ExportGateModal
          proposalId={id}
          requirements={gateRequirements}
          format={pendingFormat}
          onExportAnyway={() => {
            const format = pendingFormat;
            setGateRequirements(null);
            setPendingFormat(null);
            setGateBypassedThisSession(true);
            doExport(format);
          }}
          onCancel={() => {
            setGateRequirements(null);
            setPendingFormat(null);
          }}
        />
      )}
    </div>
  );
}
