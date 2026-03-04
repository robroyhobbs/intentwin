/**
 * Shared editorial standards injected into every section prompt.
 * Controls formatting, bans fluff, and enforces presentation-ready output.
 */

/** Phrases that scream "AI wrote this" or add zero value. */
export const BANNED_PHRASES = [
  "leverage",
  "synergize",
  "best-in-class",
  "world-class",
  "cutting-edge",
  "state-of-the-art",
  "paradigm shift",
  "holistic approach",
  "robust solution",
  "seamless integration",
  "deep dive",
  "move the needle",
  "game-changer",
  "thought leader",
  "value-add",
  "low-hanging fruit",
  "circle back",
  "at the end of the day",
  "it goes without saying",
  "in today's rapidly evolving",
  "in an era of",
  "digital transformation journey",
  "unprecedented",
  "mission-critical",
  "turn-key",
  "end-to-end solution",
  "one-stop shop",
  "proactive approach",
  "scalable and flexible",
  "comprehensive suite",
  "next-generation",
];

/**
 * Formatting rules appended to every section prompt.
 * Forces structured, scannable, presentation-ready output.
 */
export const FORMATTING_RULES = `
## OUTPUT FORMAT RULES (MANDATORY)

**Structure every section for executive scanning — a decision-maker should grasp the key points in 30 seconds.**

1. **Headings**: Use ## for main subsections, ### for supporting points. Never write more than 3 sentences before the next heading or bullet list.

2. **Paragraphs**: Maximum 3 sentences per paragraph. If you need more, break into bullets. No wall-of-text paragraphs.

3. **Bullet points**: Use bullets for:
   - Lists of 3+ items
   - Key benefits or features
   - Requirements or deliverables
   - Metrics and outcomes
   Use **bold lead-ins** for each bullet (e.g., "**Cloud Migration**: Migrate 200+ applications...").

4. **Tables**: Use markdown tables for:
   - Comparisons (before/after, current/proposed)
   - Metrics with numbers
   - Phase summaries with deliverables and timelines
   - Risk matrices

5. **Callout boxes**: Use blockquotes (> ) for:
   - Key metrics or statistics (one per section minimum)
   - Client-specific insights
   - Evidence citations

6. **Evidence citations**: When referencing company data, use this format:
   > **Proven Result**: 34% cost reduction over 18 months — Cloud Migration for Department of Veterans Affairs

7. **White space**: Leave blank lines between sections. Dense text loses readers.

8. **No filler**: Every sentence must either (a) make a specific claim backed by evidence, (b) describe a concrete deliverable, or (c) directly address a stated client need. Delete anything that doesn't pass this test.
`;

/**
 * Anti-fluff rules appended to every section prompt.
 */
export const ANTI_FLUFF_RULES = `
## WRITING QUALITY RULES (MANDATORY)

**BANNED PHRASES** — Do NOT use any of these: ${BANNED_PHRASES.join(", ")}. Replace with specific, concrete language.

**SPECIFICITY TEST** — Before writing any claim, ask: "Could a competitor say this exact same thing?" If yes, it's too generic. Add specifics:
- BAD: "We have extensive experience in this space"
- GOOD: "We have delivered 47 similar engagements across 12 federal agencies since 2019"

**EVIDENCE REQUIREMENT** — Every capability claim must cite specific evidence from the provided Company Context:
- BAD: "Our team brings deep expertise in cloud migration"
- GOOD: "Our team has completed 200+ cloud migrations, including a 10,000-user Azure migration for the Department of Veterans Affairs that reduced infrastructure costs by 34%"
- If specific evidence is not available in the Company Context, write a general but concrete statement WITHOUT placeholders: "Our team has delivered multiple large-scale cloud migrations for federal agencies, consistently reducing infrastructure costs by 25-40%"

**NEVER USE BRACKETS OF ANY KIND IN OUTPUT** — Do NOT write any text inside square brackets. This includes but is not limited to:
- Placeholders: [Insert X], [Client Name], [Agency], [Case Study], [TBD]
- Verification tags: [Verify], [VERIFY], [Needs Evidence], [NEEDS EVIDENCE], [Check], [Confirm]
- Fill-in markers: [Number], [Metric], [Date], [Amount]
This is a hard rule with ZERO exceptions. Every bracket in your output is a failure.
- If you have the data in Company Context or Evidence Library, use it directly
- If you don't have the data, write a confident general statement that doesn't need a fill-in
- BAD: "In our recent engagement with [Insert Client], we achieved..."
- GOOD: "In a recent federal engagement, we achieved..."
- BAD: "achieving [Verify retention rate] retention"
- GOOD: "achieving strong staff retention rates"
- BAD: "[Number] of certified engineers on our team"
- GOOD: "A dedicated team of certified engineers"

**ACTIVE VOICE** — Write in active voice. "We will deliver" not "It will be delivered." "Our team migrated" not "The migration was completed."

**CLIENT-FIRST** — Start sentences with the client's need or outcome, not your capability:
- BAD: "Our methodology includes a discovery phase..."
- GOOD: "To ensure zero disruption during transition, we begin with a 4-week discovery phase..."

**NO THROAT-CLEARING** — Delete opening phrases like "It is worth noting that", "It should be mentioned that", "In order to". Start with the point.

**CONCRETE NUMBERS** — Replace vague quantifiers with specific numbers from evidence:
- BAD: "significant cost savings"
- GOOD: "34% reduction in annual infrastructure costs"
`;

/** Audience profile for tone modulation */
export interface AudienceProfile {
  tech_level?: string; // "non_technical" | "moderate" | "highly_technical"
  evaluator?: string; // "county_board" | "procurement_office" | "engineering_team"
  size?: string; // "small_municipality" | "mid_market" | "enterprise"
}

/** Valid tone selections from the wizard */
export type ProposalTone =
  | "professional"
  | "conversational"
  | "technical"
  | "executive";

/**
 * Builds the complete editorial standards block to append to any section prompt.
 * Optional audience profile modulates vocabulary and technical depth.
 * Optional brand name enforces consistent naming throughout.
 * Optional priorDifferentiators triggers the repetition limiter.
 * Optional tone modulates the overall writing style.
 */
export function buildEditorialStandards(
  solicitationType: string = "RFP",
  audienceProfile?: AudienceProfile | null | unknown,
  primaryBrandName?: string,
  priorDifferentiators?: string[],
  tone?: ProposalTone | string,
  groundingLevel?: "high" | "medium" | "low",
): string {
  const audience = audienceProfile as AudienceProfile | null | undefined;
  let typeRules = "";
  if (solicitationType === "RFQ") {
    typeRules =
      "\n\n## SOLICITATION TONE: RFQ (Request for Quote)\nThis is an RFQ. Do NOT include visionary fluff, long narratives, or high-level strategic posturing. Keep everything bottom-line upfront, highly technical, and strictly focused on pricing, SLAs, and exact deliverables. Cut word counts by 40% compared to a normal proposal.";
  } else if (solicitationType === "RFI") {
    typeRules =
      "\n\n## SOLICITATION TONE: RFI (Request for Information)\nThis is an RFI. The client is researching options. Heavily emphasize case studies, high-level capabilities, industry vision, and differentiators. Do not make hard commitments on pricing or exact timelines unless explicitly requested.";
  } else if (solicitationType === "SOW") {
    typeRules =
      "\n\n## SOLICITATION TONE: SOW (Statement of Work)\nThis is a Statement of Work. Use highly contractual, precise language. Focus entirely on scope, deliverables, acceptance criteria, assumptions, and milestones. Remove marketing fluff.";
  }

  // Audience calibration — modulate tone based on evaluator profile
  let audienceRules = "";
  if (audience?.tech_level === "non_technical") {
    audienceRules = `\n\n## AUDIENCE CALIBRATION: NON-TECHNICAL AUDIENCE
The evaluators are non-technical (${audience.evaluator || "general decision-makers"}${audience.size ? `, ${audience.size}` : ""}).
- Use plain language and avoid jargon. Explain technical concepts in everyday terms.
- Lead with business outcomes and cost savings, not architecture diagrams.
- Replace acronyms with full names on first use.
- Use analogies to explain complex processes.
- Focus on "what it means for you" rather than "how it works."`;
  } else if (audience?.tech_level === "highly_technical") {
    audienceRules = `\n\n## AUDIENCE CALIBRATION: TECHNICAL AUDIENCE
The evaluators are highly technical (${audience.evaluator || "engineering team"}${audience.size ? `, ${audience.size}` : ""}).
- Provide technical depth: include architecture patterns, specifications, and implementation details.
- Reference specific technologies, protocols, and standards by name.
- Use precise technical vocabulary — don't dumb down.
- Include performance benchmarks, scalability metrics, and infrastructure specifications.
- Demonstrate deep domain expertise through technical specificity.`;
  }
  // "moderate" or unknown tech_level — no audience modifier (default balanced tone)

  // Tone modulation — user-selected writing style from wizard Step 3
  let toneRules = "";
  if (tone === "conversational") {
    toneRules = `\n\n## WRITING TONE: CONVERSATIONAL
- Write as if explaining to a smart colleague over coffee — warm, direct, approachable.
- Use contractions naturally (we'll, you'll, it's). Shorter sentences.
- Replace formal constructions with direct ones: "We recommend" instead of "It is recommended that."
- You can use first person freely. Address the client directly as "you" and "your."
- Still maintain credibility — conversational does NOT mean casual or sloppy.`;
  } else if (tone === "technical") {
    toneRules = `\n\n## WRITING TONE: TECHNICAL
- Write for engineers and technical evaluators. Precision over polish.
- Include architecture details, protocol names, version numbers, and implementation specifics.
- Use technical vocabulary without simplification — assume the reader is an expert.
- Prioritize diagrams, specifications, and metrics over narrative.
- Minimize marketing language. Let technical depth speak for itself.`;
  } else if (tone === "executive") {
    toneRules = `\n\n## WRITING TONE: EXECUTIVE
- Write for C-suite and senior decision-makers. Lead with outcomes and business impact.
- Every paragraph should connect to ROI, risk reduction, or strategic advantage.
- Use confident, authoritative language. Short, decisive sentences.
- Minimize technical details — reference them by outcome ("reduces processing time by 40%") not mechanism.
- Frame everything through the lens of business value, competitive position, and strategic goals.`;
  }
  // "professional" is the default — no additional tone modifier needed

  // Brand name lock — enforce consistent naming
  let brandLock = "";
  if (primaryBrandName && primaryBrandName.trim()) {
    brandLock = `\n\n## BRAND NAME LOCK
Use ONLY '${primaryBrandName}' when referring to our company throughout the entire section. No abbreviations, alternate names, DBAs, or variations. Every mention must use the exact string '${primaryBrandName}'.`;
  }

  // Repetition limiter — prevent every section from restating the same claims
  let repetitionLimiter = "";
  if (priorDifferentiators && priorDifferentiators.length > 0) {
    const diffList = priorDifferentiators.map((d) => `  - ${d}`).join("\n");
    repetitionLimiter = `\n\n## REPETITION LIMITER (MANDATORY)
The following differentiators were already stated in the Executive Summary:
${diffList}

DO NOT re-state these claims verbatim in this section. Instead:
- Demonstrate each differentiator through specific examples, metrics, or deliverables relevant to THIS section's topic
- Show, don't tell — if the Executive Summary said "47 federal migrations," this section should describe HOW a specific migration was executed, not repeat the count
- Each section should add NEW evidence and detail, not echo the same talking points
- If you must reference a differentiator, add new context: a different metric, a different client, a different angle`;
  }

  const chainOfThought = `
## MANDATORY OUTLINING (CHAIN OF THOUGHT)
Before generating the final markdown for the section, you MUST output a <thought_process> block.
Inside this block, map exactly how you will satisfy the persuasion framework (AIDA, PAS, etc.) using the provided Win Themes and Evidence. 
Example:
<thought_process>
1. Identify primary Win Theme: Speed to market.
2. Select L1 Evidence: Acme Corp 14-day deployment.
3. Map to PAS Framework:
   - Problem: ...
   - Agitation: ...
   - Solution: ...
</thought_process>

After the </thought_process> tag, write the final presentation-ready Markdown.
`;

  // When grounding is low, replace the evidence fallback instruction to prevent soft hallucination
  let effectiveAntiFluff = ANTI_FLUFF_RULES;
  if (groundingLevel === "low") {
    effectiveAntiFluff = effectiveAntiFluff.replace(
      `- If specific evidence is not available in the Company Context, write a general but concrete statement WITHOUT placeholders: "Our team has delivered multiple large-scale cloud migrations for federal agencies, consistently reducing infrastructure costs by 25-40%"`,
      `- If specific evidence is not available in the Company Context, use aspirational framing: "Our team would bring..." or "We are prepared to deliver..." — do NOT claim past delivery without evidence`,
    );
  }

  return `${FORMATTING_RULES}\n${effectiveAntiFluff}${typeRules}${toneRules}${audienceRules}${brandLock}${repetitionLimiter}\n${chainOfThought}`;
}
