/**
 * POST /api/proposals/[id]/outcomes
 *
 * AI win-strategy generation for an existing proposal.
 * Named "outcomes" (plural) = AI generation endpoint.
 *
 * Contrast with:
 *   /api/proposals/[id]/outcome  (singular) — deal outcome recording (GET+PATCH won/lost status)
 *   /api/proposals/temp/outcomes — same AI generation but pre-proposal (wizard flow)
 */
import { generateWinStrategy, OutcomeParseError } from "@/lib/ai/generate-outcomes";
import { badRequest, ok, serverError, withProposalRoute } from "@/lib/api/response";

/** AI outcome generation */
export const maxDuration = 120;

export const POST = withProposalRoute(
  async (request, { id: _id }, _context) => {
    const body = await request.json();
    const { intake_data } = body;

    if (!intake_data) {
      return badRequest("Intake data is required");
    }

    try {
      const winStrategy = await generateWinStrategy(intake_data);
      return ok({ win_strategy: winStrategy });
    } catch (error) {
      if (error instanceof OutcomeParseError) {
        return serverError(error.message, error.cause);
      }
      return serverError("Failed to generate outcomes", error);
    }
  },
);
