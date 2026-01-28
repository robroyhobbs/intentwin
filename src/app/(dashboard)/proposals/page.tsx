import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle, FileText, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
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
    <div>
      {/* Hero Section */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B365D] via-[#0070AD] to-[#12ABDB] p-8 shadow-lg">
        {/* Background shapes */}
        <div className="absolute top-4 right-8 h-24 w-24 rounded-full bg-white/5 animate-float" />
        <div className="absolute bottom-4 right-32 h-16 w-16 rounded-xl bg-white/5 animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Proposal Dashboard
          </h1>
          <p className="text-blue-100/70 text-sm max-w-lg">
            Create, manage, and export AI-powered proposals with outcome-driven strategy
          </p>

          {/* Stats Row */}
          <div className="mt-6 flex gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <FileText className="h-4.5 w-4.5 text-[#12ABDB]" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{totalCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-blue-200/50">Total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <TrendingUp className="h-4.5 w-4.5 text-amber-300" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{reviewCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-blue-200/50">In Review</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{exportedCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-blue-200/50">Exported</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-100/80 p-1 border border-gray-200/50">
          {STATUS_TABS.map((t) => (
            <Link
              key={t.value}
              href={t.value === "all" ? "/proposals" : `/proposals?tab=${t.value}`}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                tab === t.value
                  ? "bg-white text-[#1B365D] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {statusCounts[t.value] !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    tab === t.value
                      ? "bg-[#0070AD]/10 text-[#0070AD]"
                      : "bg-gray-200/80 text-gray-500"
                  }`}
                >
                  {statusCounts[t.value] || 0}
                </span>
              )}
            </Link>
          ))}
        </div>

        <Link
          href="/proposals/new"
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0070AD] to-[#12ABDB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
        >
          <Sparkles className="h-4 w-4" />
          New Proposal
        </Link>
      </div>

      {/* Content */}
      {!proposals || proposals.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0070AD]/10 to-[#12ABDB]/10">
            <FileText className="h-8 w-8 text-[#0070AD]" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-[#1B365D]">
            {tab === "all" ? "No proposals yet" : `No ${tab} proposals`}
          </h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Get started by creating your first AI-powered proposal with outcome-driven strategy.
          </p>
          <Link
            href="/proposals/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0070AD] to-[#12ABDB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Create Proposal
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal, index) => {
            const intake = proposal.intake_data as Record<string, string>;
            return (
              <div
                key={proposal.id}
                className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
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
