interface ProposalDetailSectionSnapshot {
  id: string;
  generation_status: string;
}

interface ProposalDetailSnapshot<
  TProposal,
  TSection extends ProposalDetailSectionSnapshot,
> {
  proposal: TProposal;
  sections?: TSection[];
  initialSectionSet: boolean;
}

interface PreparedProposalDetailSnapshot<
  TProposal,
  TSection extends ProposalDetailSectionSnapshot,
> {
  proposal: TProposal;
  sections: TSection[];
  activeSectionId: string | null;
  shouldSetInitialSection: boolean;
}

export function prepareProposalDetailSnapshot<
  TProposal,
  TSection extends ProposalDetailSectionSnapshot,
>(
  snapshot: ProposalDetailSnapshot<TProposal, TSection>,
): PreparedProposalDetailSnapshot<TProposal, TSection> {
  const sections = snapshot.sections ?? [];

  if (snapshot.initialSectionSet || sections.length === 0) {
    return {
      proposal: snapshot.proposal,
      sections,
      activeSectionId: null,
      shouldSetInitialSection: false,
    };
  }

  const firstCompleted = sections.find(
    (section) => section.generation_status === "completed",
  );

  return {
    proposal: snapshot.proposal,
    sections,
    activeSectionId: firstCompleted?.id ?? sections[0].id,
    shouldSetInitialSection: true,
  };
}
