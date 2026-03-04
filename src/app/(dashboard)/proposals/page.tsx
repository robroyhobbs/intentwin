import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  FileText,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Zap,
  Target,
} from "lucide-react";
import { ProposalCard } from "@/components/ui/proposal-card";
import { GettingStartedChecklist } from "@/components/dashboard/getting-started-checklist";
import { ProposalStatus, GenerationStatus } from "@/lib/constants/statuses";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Draft", value: ProposalStatus.DRAFT },
  { label: "Review", value: ProposalStatus.REVIEW },
  { label: "Exported", value: ProposalStatus.EXPORTED },
];

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("proposals")
    .select("*, proposal_sections(id, generation_status)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (tab !== "all") {
    if (tab === ProposalStatus.DRAFT) {
      query = query.in("status", [
        ProposalStatus.DRAFT,
        ProposalStatus.INTAKE,
        ProposalStatus.GENERATING,
      ]);
    } else {
      query = query.eq("status", tab);
    }
  }

  const { data: proposals } = await query;

  // Count by status for tab badges — lightweight head-only counts (no row data fetched)
  const [
    totalResult,
    draftResult,
    intakeResult,
    generatingResult,
    reviewResult,
    exportedResult,
  ] = await Promise.all([
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", ProposalStatus.DRAFT),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", ProposalStatus.INTAKE),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", ProposalStatus.GENERATING),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", ProposalStatus.REVIEW),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", ProposalStatus.EXPORTED),
  ]);

  const totalCount = totalResult.count ?? 0;
  const reviewCount = reviewResult.count ?? 0;
  const exportedCount = exportedResult.count ?? 0;
  // "Draft" tab groups DRAFT + INTAKE + GENERATING
  const draftGroupCount =
    (draftResult.count ?? 0) +
    (intakeResult.count ?? 0) +
    (generatingResult.count ?? 0);

  const statusCounts: Record<string, number> = {
    all: totalCount,
    [ProposalStatus.DRAFT]: draftGroupCount,
    [ProposalStatus.REVIEW]: reviewCount,
    [ProposalStatus.EXPORTED]: exportedCount,
  };

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
              <Zap className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Proposals
              </h1>
              <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
                Build, track, and refine your proposals
              </p>
            </div>
          </div>

          <Link
            href="/proposals/create"
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5"
          >
            <Sparkles className="h-4 w-4" />
            New Proposal
          </Link>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] group-hover:shadow-[var(--shadow-glow)] transition-all">
              <FileText className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {totalCount}
              </p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
                Total Proposals
              </p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--warning)] hover:shadow-[0_0_20px_rgba(255,170,0,0.15)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--warning-subtle)] border border-[var(--warning-muted)] transition-all">
              <TrendingUp className="h-5 w-5 text-[var(--warning)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {reviewCount}
              </p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
                In Review
              </p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--success)] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--success-subtle)] border border-[var(--success-muted)] transition-all">
              <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {exportedCount}
              </p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
                Exported
              </p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--info)] hover:shadow-[0_0_20px_rgba(0,102,255,0.15)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--info-subtle)] border border-[var(--info-muted)] transition-all">
              <Target className="h-5 w-5 text-[var(--info)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">IDD</p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
                Methodology
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Checklist */}
      <GettingStartedChecklist />

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-[var(--background-tertiary)] p-1.5 w-fit border border-[var(--border)]">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.value}
            href={
              t.value === "all" ? "/proposals" : `/proposals?tab=${t.value}`
            }
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
              tab === t.value
                ? "bg-[var(--card-bg)] text-[var(--accent)] shadow-sm border border-[var(--accent-muted)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-elevated)]"
            }`}
          >
            {t.label}
            {statusCounts[t.value] !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  tab === t.value
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "bg-[var(--border)] text-[var(--foreground-muted)]"
                }`}
              >
                {statusCounts[t.value] || 0}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Content */}
      {!proposals || proposals.length === 0 ? (
        <div className="relative rounded-2xl border border-[var(--border)] bg-[#09090b] p-16 text-center overflow-hidden flex flex-col items-center justify-center">
          {/* Subtle glowing background orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#18181b] border border-[#27272a] shadow-[0_0_30px_rgba(192,132,252,0.15)] mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="url(#gradient_file)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
              <defs>
                <linearGradient
                  id="gradient_file"
                  x1="4"
                  y1="2"
                  x2="20"
                  y2="22"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#818CF8" />
                  <stop offset="1" stopColor="#C084FC" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 className="relative z-10 text-2xl font-bold text-white tracking-tight mb-3">
            {tab === "all"
              ? "Engineer your first proposal"
              : `No ${tab} proposals`}
          </h3>
          <p className="relative z-10 text-base text-zinc-400 max-w-lg mx-auto mb-10 leading-relaxed font-light">
            Skip the blank page. Define your win strategy, upload an RFP, and
            let the 6-layer Intent framework generate a fully compliant, highly
            persuasive first draft in minutes.
          </p>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              href="/proposals/create"
              className="bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all text-sm px-6 py-3 shadow-[0_0_20px_rgba(192,132,252,0.3)] hover:shadow-[0_0_30px_rgba(192,132,252,0.5)] flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              Start New Proposal
            </Link>
            <Link
              href="/knowledge-base/upload"
              className="bg-zinc-900 border border-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-800 transition-all text-sm px-6 py-3 flex items-center gap-2"
            >
              Upload RFP Documents
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {proposals.map((proposal, index) => {
            const intake = proposal.intake_data as Record<string, string>;
            const sections = (proposal as Record<string, unknown>)
              .proposal_sections as
              | { id: string; generation_status: string }[]
              | undefined;
            const sectionCount = sections?.length || 0;
            const completedSections =
              sections?.filter(
                (s) => s.generation_status === GenerationStatus.COMPLETED,
              ).length || 0;
            return (
              <div
                key={proposal.id}
                className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
              >
                <ProposalCard
                  id={proposal.id}
                  title={proposal.title}
                  status={proposal.status}
                  clientName={intake?.client_name || "No client"}
                  opportunityType={intake?.opportunity_type || ""}
                  createdAt={proposal.created_at}
                  sectionCount={sectionCount}
                  completedSections={completedSections}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
