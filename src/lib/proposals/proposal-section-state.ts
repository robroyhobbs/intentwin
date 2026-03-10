export type ProposalSectionStatus =
  | "pending"
  | "generating"
  | "completed"
  | "failed";

export type DraftSectionStatus = "pending" | "generating" | "complete" | "failed";

interface ProposalSectionProgressSource {
  section_type: string;
  title: string;
  generation_status: string;
}

export interface ProposalSectionProgress {
  type: string;
  title: string;
  status: ProposalSectionStatus;
}

export function normalizeProposalSectionStatus(
  generationStatus: string,
): ProposalSectionStatus {
  switch (generationStatus) {
    case "completed":
    case "failed":
    case "generating":
      return generationStatus;
    default:
      return "pending";
  }
}

export function normalizeDraftSectionStatus(
  generationStatus: string,
): DraftSectionStatus {
  switch (normalizeProposalSectionStatus(generationStatus)) {
    case "completed":
      return "complete";
    case "failed":
      return "failed";
    case "generating":
      return "generating";
    default:
      return "pending";
  }
}

export function mapProposalSectionsToProgress<
  TSection extends ProposalSectionProgressSource,
>(sections: TSection[]): ProposalSectionProgress[] {
  return sections.map((section) => ({
    type: section.section_type,
    title: section.title,
    status: normalizeProposalSectionStatus(section.generation_status),
  }));
}
