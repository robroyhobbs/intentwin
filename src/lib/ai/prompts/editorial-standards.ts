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

/**
 * Builds the complete editorial standards block to append to any section prompt.
 */
export function buildEditorialStandards(): string {
  return `${FORMATTING_RULES}\n${ANTI_FLUFF_RULES}`;
}
