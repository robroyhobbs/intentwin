import { describe, expect, it } from "vitest";
import { mapCopilotNotification } from "../notifications";
import { emitProposalGenerationFailedEvent } from "../proposal-generation-failure";
import { InMemoryCopilotRepository } from "./helpers/in-memory-copilot-repository";

const ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const PROPOSAL_ID = "22222222-2222-4222-8222-222222222222";

describe("proposal generation copilot flow", () => {
  it("flows from producer to persisted intervention to notification mapping", async () => {
    const repository = new InMemoryCopilotRepository();
    repository.seedProposal(PROPOSAL_ID, ORGANIZATION_ID);

    const result = await emitProposalGenerationFailedEvent(
      {
        organizationId: ORGANIZATION_ID,
        proposalId: PROPOSAL_ID,
        retryable: true,
        stage: "section",
        errorMessage: "Gemini rate limit",
        attempts: 3,
        correlationId: "corr-1",
        sectionId: "sec-1",
        sectionType: "executive_summary",
      },
      { repository },
    );

    expect(result).toEqual({ ok: true });

    const notifications = repository
      .listNotificationRows(ORGANIZATION_ID)
      .map((row) => mapCopilotNotification(row));

    expect(notifications).toEqual([
      {
        id: "db-intervention-1",
        title: "Proposal generation issue detected",
        message:
          "IntentBid Copilot recorded a proposal generation issue and prepared the safest next step.",
        status: "open",
        assignedAgent: "reliability-overseer",
        actionMode: "auto",
        createdAt: expect.any(String),
        href: `/proposals/${PROPOSAL_ID}`,
        hrefLabel: "View proposal",
        requiresApproval: false,
      },
    ]);
  });
});
