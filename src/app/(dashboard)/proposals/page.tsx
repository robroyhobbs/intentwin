import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle, FileText, Sparkles, TrendingUp, CheckCircle2, Zap, Target } from "lucide-react";
import { ProposalCard } from "@/components/ui/proposal-card";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Exported", value: "exported" },
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
    .select("*")
    .order("created_at", { ascending: false });

  if (tab !== "all") {
    if (tab === "draft") {
      query = query.in("status", ["draft", "intake", "generating"]);
    } else {
      query = query.eq("status", tab);
    }
  }

  const { data: proposals } = await query;

  // Count by status for tab badges
  const { data: allProposals } = await supabase
    .from("proposals")
    .select("status");

  const statusCounts: Record<string, number> = { all: allProposals?.length || 0 };
  for (const p of allProposals || []) {
    if (["draft", "intake", "generating"].includes(p.status)) {
      statusCounts["draft"] = (statusCounts["draft"] || 0) + 1;
    } else {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }
  }

  const totalCount = allProposals?.length || 0;
  const reviewCount = statusCounts["review"] || 0;
  const exportedCount = statusCounts["exported"] || 0;

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
                Create and manage AI-powered proposals with Intent-Driven Development
              </p>
            </div>
          </div>

          <Link href="/proposals/new" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5">
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
              <p className="text-2xl font-bold text-[var(--foreground)]">{totalCount}</p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Total Proposals</p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--warning)] hover:shadow-[0_0_20px_rgba(255,170,0,0.15)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--warning-subtle)] border border-[var(--warning-muted)] transition-all">
              <TrendingUp className="h-5 w-5 text-[var(--warning)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{reviewCount}</p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">In Review</p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--success)] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--success-subtle)] border border-[var(--success-muted)] transition-all">
              <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{exportedCount}</p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Exported</p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--info)] hover:shadow-[0_0_20px_rgba(0,102,255,0.15)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--info-subtle)] border border-[var(--info-muted)] transition-all">
              <Target className="h-5 w-5 text-[var(--info)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">IDD</p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Methodology</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-[var(--background-tertiary)] p-1.5 w-fit border border-[var(--border)]">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "all" ? "/proposals" : `/proposals?tab=${t.value}`}
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
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--card-bg)] p-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] shadow-[var(--shadow-glow)]">
            <FileText className="h-10 w-10 text-[var(--accent)]" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-[var(--foreground)]">
            {tab === "all" ? "No proposals yet" : `No ${tab} proposals`}
          </h3>
          <p className="mt-2 text-sm text-[var(--foreground-muted)] max-w-md mx-auto">
            Get started by creating your first AI-powered proposal. Define your intent, and let AI generate winning content backed by verified case studies.
          </p>
          <Link href="/proposals/new" className="btn-primary mt-8 inline-flex items-center gap-2 px-6 py-3">
            <Sparkles className="h-5 w-5" />
            Create Your First Proposal
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {proposals.map((proposal, index) => {
            const intake = proposal.intake_data as Record<string, string>;
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
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
