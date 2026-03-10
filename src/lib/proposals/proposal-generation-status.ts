import { areAllSectionsTerminal } from "@/lib/proposals/generation-poll";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

export interface ProposalGenerationSectionSnapshot {
  generation_status: string;
}

export interface ProposalGenerationSnapshot<
  TSection extends ProposalGenerationSectionSnapshot = ProposalGenerationSectionSnapshot,
> {
  proposal?: {
    status?: string | null;
  };
  sections?: TSection[];
}

export interface ProposalGenerationSummary {
  phase: "generating" | "complete" | "failed";
  completedCount: number;
  failedCount: number;
  totalCount: number;
}

export async function fetchProposalGenerationSnapshot<
  TSection extends ProposalGenerationSectionSnapshot,
>(
  proposalId: string,
  fetchFn: FetchFn,
): Promise<ProposalGenerationSnapshot<TSection> | null> {
  const response = await fetchFn(`/api/proposals/${proposalId}`);
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ProposalGenerationSnapshot<TSection>;
}

export function summarizeProposalGeneration<
  TSection extends ProposalGenerationSectionSnapshot,
>(
  snapshot: ProposalGenerationSnapshot<TSection>,
): ProposalGenerationSummary {
  const sections = snapshot.sections ?? [];
  const completedCount = sections.filter(
    (section) => section.generation_status === "completed",
  ).length;
  const failedCount = sections.filter(
    (section) => section.generation_status === "failed",
  ).length;
  const totalCount = sections.length;

  if (
    snapshot.proposal?.status === "generating" ||
    totalCount === 0 ||
    !areAllSectionsTerminal(sections)
  ) {
    return {
      phase: "generating",
      completedCount,
      failedCount,
      totalCount,
    };
  }

  return {
    phase: completedCount > 0 ? "complete" : "failed",
    completedCount,
    failedCount,
    totalCount,
  };
}
