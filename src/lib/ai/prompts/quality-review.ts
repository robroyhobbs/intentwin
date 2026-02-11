/**
 * Quality Review Prompt — GPT-4o Review of Gemini-Generated Sections
 *
 * Scores each section across 4 quality dimensions (1-10):
 * 1. Content Quality — Persuasive, clear, specific, actionable
 * 2. Client Fit — Addresses their pains, outcomes, aligns with win strategy
 * 3. Evidence — Cites case studies, metrics, testimonials from knowledge base
 * 4. Brand Voice — Matches tone settings, uses/avoids correct terminology
 */

import type { BrandVoice } from "../persuasion";

// ============================================================
// Types
// ============================================================

export interface QualityScores {
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
  feedback: string;
}

export interface QualityReviewPromptInput {
  sectionContent: string;
  sectionType: string;
  proposalContext: {
    clientName?: string;
    industry?: string;
    opportunityType?: string;
  };
  brandVoice?: BrandVoice | null;
  winStrategy?: {
    win_themes?: string[];
    differentiators?: string[];
  } | null;
}

// ============================================================
// Constants
// ============================================================

export const QUALITY_DIMENSIONS = [
  "content_quality",
  "client_fit",
  "evidence",
  "brand_voice",
] as const;

export const PASS_THRESHOLD = 9.0;
export const REGEN_THRESHOLD = 8.5;

const MAX_CONTENT_LENGTH = 30000;

// ============================================================
// Scoring
// ============================================================

/**
 * Calculate section average score from 4 dimension scores.
 * Rounds to 1 decimal place.
 */
export function calculateSectionScore(scores: QualityScores): number {
  const sum =
    scores.content_quality +
    scores.client_fit +
    scores.evidence +
    scores.brand_voice;
  return Math.round((sum / 4) * 10) / 10;
}

// ============================================================
// Prompt Builder
// ============================================================

/**
 * Build the GPT-4o quality review prompt for a single proposal section.
 * Returns a string prompt that instructs GPT-4o to return JSON scores.
 */
export function buildQualityReviewPrompt(
  input: QualityReviewPromptInput,
): string {
  const { sectionContent, sectionType, proposalContext, brandVoice, winStrategy } = input;

  const content =
    sectionContent.trim() === ""
      ? "[No content provided — this section is empty]"
      : sectionContent.length > MAX_CONTENT_LENGTH
        ? sectionContent.slice(0, MAX_CONTENT_LENGTH) + "\n\n[Content truncated for review]"
        : sectionContent;

  const contentLabel = sectionContent.trim() === "" ? "No content provided" : "";

  let prompt = `You are a senior proposal quality reviewer. Review the following proposal section and score it across 4 quality dimensions.

## Section Type
${sectionType}

## Proposal Context
- Client: ${proposalContext.clientName || "Unknown"}
- Industry: ${proposalContext.industry || "Not specified"}
${proposalContext.opportunityType ? `- Opportunity: ${proposalContext.opportunityType}` : ""}
${contentLabel ? `\nNote: ${contentLabel}` : ""}

## Section Content
${content}
`;

  // Inject brand voice context if available
  if (brandVoice) {
    prompt += `
## Brand Voice Settings:
- Tone: ${brandVoice.tone}
- Preferred terminology: ${brandVoice.terminology.use.join(", ")}
- Terms to avoid: ${brandVoice.terminology.avoid.join(", ")}
`;
  }

  // Inject win strategy context if available
  if (winStrategy) {
    if (winStrategy.win_themes?.length) {
      prompt += `
## Win Strategy — Themes to Align With:
${winStrategy.win_themes.map((t) => `- ${t}`).join("\n")}
`;
    }
    if (winStrategy.differentiators?.length) {
      prompt += `
## Key Differentiators (should be reflected):
${winStrategy.differentiators.map((d) => `- ${d}`).join("\n")}
`;
    }
  }

  prompt += `
## Scoring Rubric (1-10 per dimension)

1. **content_quality** — Is the writing persuasive, clear, specific, and actionable? Does it avoid vague generalities? Score 9-10 for exceptional prose that would impress a senior buyer.

2. **client_fit** — Does it address the client's specific pains and desired outcomes? Does it align with the win strategy (if provided)? Score 9-10 for content that feels custom-written for this client.

3. **evidence** — Does it cite concrete case studies, metrics, testimonials, or verifiable proof points? Score 9-10 for rich evidence with specific numbers. Score low if claims lack supporting data.

4. **brand_voice** — Does it match the expected tone and terminology? ${brandVoice ? "Check against the Brand Voice Settings above." : "Use a professional, confident consulting tone."} Score 9-10 for consistent, on-brand writing.

## Instructions

Return a JSON object with exactly these fields:
- content_quality: integer 1-10
- client_fit: integer 1-10
- evidence: integer 1-10
- brand_voice: integer 1-10
- feedback: string with 1-3 sentences of actionable improvement suggestions. Be specific about what to add, remove, or change. Do not repeat the rubric.

Be a tough but fair reviewer. Enterprise proposals must be exceptional to win.
Return ONLY the JSON object, no other text.`;

  return prompt;
}
