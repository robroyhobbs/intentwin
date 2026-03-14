import type { OpportunityRecord } from "./types";

export interface OpportunityProposalPrefill {
  client_name: string;
  scope_description: string;
  solicitation_type: "RFP";
  timeline_expectation: string;
  opportunity_source: {
    id: string;
    title: string;
    portal_url: string | null;
  };
}

export function buildOpportunityProposalPrefill(
  opportunity: OpportunityRecord,
): OpportunityProposalPrefill {
  return {
    client_name: opportunity.agency,
    scope_description: opportunity.description ?? opportunity.title,
    solicitation_type: "RFP",
    timeline_expectation: opportunity.response_deadline ?? "",
    opportunity_source: {
      id: opportunity.id,
      title: opportunity.title,
      portal_url: opportunity.portal_url,
    },
  };
}
