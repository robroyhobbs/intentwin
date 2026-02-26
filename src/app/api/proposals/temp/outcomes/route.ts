/**
 * POST /api/proposals/temp/outcomes
 *
 * AI win-strategy generation for a pre-proposal (wizard flow, before a proposal record exists).
 * Uses raw getUserContext instead of withProposalRoute since there's no proposal ID yet.
 *
 * Contrast with:
 *   /api/proposals/[id]/outcomes — same AI generation for an existing proposal
 *   /api/proposals/[id]/outcome  (singular) — deal outcome recording (GET+PATCH won/lost status)
 */
import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { generateWinStrategy, OutcomeParseError } from "@/lib/ai/generate-outcomes";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";

/** AI outcome generation (pre-proposal) */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const body = await request.json();
    const { intake_data } = body;

    if (!intake_data) {
      return badRequest("Intake data is required");
    }

    const winStrategy = await generateWinStrategy(intake_data);
    return ok({ win_strategy: winStrategy });
  } catch (error) {
    if (error instanceof OutcomeParseError) {
      return serverError(error.message, error.cause);
    }
    return serverError("Failed to generate outcomes", error);
  }
}
