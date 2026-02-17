/**
 * Persuasion Engine — IMF Phase 1
 *
 * All persuasion framework constants, prompt builders, and quality checks.
 * Pure functions, no external dependencies.
 */

// ============================================================
// Types
// ============================================================

export interface BrandVoice {
  tone: string;
  terminology: {
    use: string[];
    avoid: string[];
  };
}

export interface QualityCheck {
  winThemePresent: boolean;
  lengthInRange: boolean;
  noBlockedTerms: boolean;
  hasProofPoint: boolean;
}

// ============================================================
// Constants
// ============================================================

export const SECTION_TYPES = [
  "executive_summary",
  "understanding",
  "approach",
  "methodology",
  "team",
  "case_studies",
  "timeline",
  "pricing",
  "risk_mitigation",
  "why_us",
] as const;

type _SectionType = (typeof SECTION_TYPES)[number];

const PERSUASION_FRAMEWORKS: Record<string, string> = {
  executive_summary: `### Persuasion Framework: AIDA (Attention-Interest-Desire-Action)
- ATTENTION: Open with a compelling insight about the client's situation — a bold stat, an industry shift, or a challenge they face
- INTEREST: Show deep understanding of their specific challenges and what's at stake
- DESIRE: Paint the transformation picture — current state vs. future state with your solution
- ACTION: Close with a confident partnership statement and clear next step`,

  understanding: `### Persuasion Framework: Problem-Agitate-Solve (PAS)
- Problem: Clearly articulate the client's core pain points in their own language
- Agitate: Amplify the urgency — what happens if these problems go unaddressed? What's the cost of inaction?
- Solve: Preview how your approach directly addresses each pain point (don't solve fully here — save that for the Approach section)`,

  approach: `### Persuasion Framework: Feature-Advantage-Benefit (FAB)
- Feature: Describe what you will do — the specific activities, tools, and methods
- Advantage: Explain why this approach is superior to alternatives — what makes it smarter, faster, or more reliable
- Benefit: Connect every feature to a tangible client outcome — reduced cost, faster time-to-market, lower risk`,

  methodology: `### Persuasion Framework: Before-After-Bridge
- Before: Paint the client's current state clearly — the inefficiencies, risks, or gaps
- After: Describe the transformed future state — what success looks like
- Bridge: Show how your methodology is the bridge between the two — the structured path from here to there`,

  team: `### Persuasion Framework: Social Proof + Authority
- Credentials: Lead with relevant certifications, years of experience, and domain expertise
- Relevance: Connect each team member's background directly to this engagement's challenges
- Trust: Include evidence of past success — similar projects delivered, client testimonials, industry recognition`,

  case_studies: `### Persuasion Framework: STAR (Situation-Task-Action-Result)
- Situation: Set the context — who was the client, what industry, what scale
- Task: Define the specific challenge or objective they faced
- Action: Describe what your team did — the approach, methodology, innovations
- Result: Quantify the outcomes with hard metrics — percentages, dollar amounts, time saved`,

  timeline: `### Persuasion Framework: Certainty Framework
- Phases: Break the engagement into clear, manageable phases with defined boundaries
- Milestones: Identify specific checkpoints where progress is measurable and demonstrable
- Risk Mitigation: Show what could go wrong at each phase and how you'll prevent/handle it
- Confidence: Build confidence through specificity — dates, deliverables, dependencies all mapped`,

  pricing: `### Persuasion Framework: Value Framing
- Investment Context: Frame pricing as an investment, not a cost — relate to business outcomes
- ROI: Connect pricing to measurable returns — show the math on value delivered
- Comparison: Position against the cost of doing nothing or the cost of getting it wrong
- Confidence: Provide transparency and flexibility that reduces perceived risk`,

  risk_mitigation: `### Persuasion Framework: Acknowledge-Address-Assure
- Acknowledge: Name the risks directly and honestly — show you've thought about what could go wrong
- Address: For each risk, describe your specific mitigation strategy — processes, tools, escalation paths
- Assure: Provide evidence that your mitigations work — reference past projects where you managed similar risks`,

  why_us: `### Persuasion Framework: Competitive Differentiation
- Unique: What do you offer that no one else does? Be specific, not generic
- Proven: Back every claim with evidence — case studies, metrics, certifications
- Relevant: Tie every differentiator directly to this client's specific needs and goals
- Urgent: Create a sense of why now — market timing, competitive pressure, opportunity cost of delay`,
};

const SECTION_BEST_PRACTICES: Record<string, string> = {
  executive_summary: `### Best Practices
- Length: 300-500 words (1 page)
- Must include: quantified value proposition, reference to methodology, clear understanding of client's #1 challenge
- Must NOT include: detailed pricing, deep technical jargon, lengthy company history
- Opening: Lead with the client's challenge or a bold industry insight, NOT your company description
- Closing: End with a transformation promise and partnership confidence, NOT generic "we look forward to..."
- Reference evidence and metrics where available`,

  understanding: `### Best Practices
- Length: 500-700 words
- Must include: specific industry context, client's business drivers, technical landscape understanding
- Must NOT include: proposed solutions (save for Approach), criticism of client's current state
- Opening: Demonstrate you've listened — reference specific details from the RFP/intake
- Closing: Transition to the solution with a "here's what we can do about it" hook
- Reference evidence and metrics where available`,

  approach: `### Best Practices
- Length: 800-1200 words
- Must include: phased approach, specific activities per phase, key deliverables, risk mitigation during execution
- Must NOT include: detailed pricing, team bios (save for Team section)
- Opening: Connect directly to the client's challenges identified in Understanding
- Closing: Summarize expected outcomes and transition to Methodology
- Include a visual (Mermaid diagram) showing the approach flow
- Reference evidence and metrics where available`,

  methodology: `### Best Practices
- Length: 500-800 words
- Must include: named methodology/framework, quality gates, governance structure, communication cadence
- Must NOT include: generic project management basics everyone does
- Opening: Introduce your methodology as battle-tested, not theoretical
- Closing: Connect methodology discipline to client confidence and risk reduction
- Reference evidence and metrics where available`,

  team: `### Best Practices
- Length: 400-600 words
- Must include: relevant certifications, years of domain experience, similar engagement experience
- Must NOT include: full resumes, irrelevant credentials
- Opening: Lead with the team's collective strength for THIS engagement
- Closing: Reinforce that this team has done this before and will do it again
- Reference evidence and metrics where available`,

  case_studies: `### Best Practices
- Length: 600-900 words (2-3 case studies)
- Must include: quantified results (percentages, dollar amounts, time saved), client industry context
- Must NOT include: confidential client details without permission, vague "improved efficiency" claims
- Opening: Select case studies most relevant to this client's industry and challenge
- Closing: Draw explicit parallels between case study outcomes and this client's goals
- Use STAR framework for each case study
- Reference evidence and metrics where available`,

  timeline: `### Best Practices
- Length: 400-600 words
- Must include: phase durations, key milestones, dependencies, go/no-go gates
- Must NOT include: overly optimistic timelines, missing contingency buffers
- Opening: Frame the timeline as realistic and achievable, built on experience
- Closing: Reinforce confidence with reference to similar successful delivery timelines
- Reference evidence and metrics where available`,

  pricing: `### Best Practices
- Length: 300-500 words
- Must include: pricing model explanation, what's included/excluded, payment milestones
- Must NOT include: competitor pricing comparisons, hidden fees
- Opening: Frame as investment with clear ROI, not just a cost number
- Closing: Provide confidence through transparency and flexibility
- Reference evidence and metrics where available`,

  risk_mitigation: `### Best Practices
- Length: 400-600 words
- Must include: specific risks (not generic), mitigation strategies per risk, escalation paths
- Must NOT include: risks that undermine confidence, risks without mitigations
- Opening: Show sophistication by naming risks proactively
- Closing: Reinforce that risk management is embedded in your approach, not an afterthought
- Reference evidence and metrics where available`,

  why_us: `### Best Practices
- Length: 400-600 words
- Must include: unique differentiators tied to client outcomes, partnership evidence, relevant scale/credentials
- Must NOT include: generic claims ("world-class"), competitor bashing, irrelevant accolades
- Opening: Lead with what makes you uniquely suited for THIS engagement
- Closing: Create urgency — why this partnership, why now
- Reference evidence and metrics where available`,
};

const GENERIC_FRAMEWORK = `### Persuasion Framework: Clear-Compelling-Confident
- Clear: State your point directly without jargon
- Compelling: Support with evidence and specific examples
- Confident: Close with a strong, forward-looking statement`;

const GENERIC_BEST_PRACTICES = `### Best Practices
- Length: 400-600 words
- Must include: specific details, evidence-based claims, client-focused language
- Must NOT include: vague generalities, unsupported claims
- Opening: Lead with the most relevant and compelling point
- Closing: End with a clear takeaway or next step
- Reference evidence and metrics where available`;

// Length ranges per section (word count)
const LENGTH_RANGES: Record<string, { min: number; max: number }> = {
  executive_summary: { min: 300, max: 500 },
  understanding: { min: 500, max: 700 },
  approach: { min: 800, max: 1200 },
  methodology: { min: 500, max: 800 },
  team: { min: 400, max: 600 },
  case_studies: { min: 600, max: 900 },
  timeline: { min: 400, max: 600 },
  pricing: { min: 300, max: 500 },
  risk_mitigation: { min: 400, max: 600 },
  why_us: { min: 400, max: 600 },
};

const DEFAULT_LENGTH = { min: 400, max: 600 };

// Proof point indicators (simple string matching)
const PROOF_INDICATORS = [
  /\d+%/, // percentages
  /\$[\d,.]+/, // dollar amounts
  /\d+x/i, // multipliers
  /reduced|improved|increased|achieved|delivered|saved/i,
  /case study|client|project|engagement/i,
  /ISO|AWS|Azure|GCP|certified/i,
];

// ============================================================
// Prompt Builders
// ============================================================

/**
 * Get the persuasion framework prompt for a section type.
 * Returns a generic framework for unknown section types.
 */
export function getPersuasionPrompt(sectionType: string): string {
  const normalized = sectionType.toLowerCase();
  return Object.prototype.hasOwnProperty.call(PERSUASION_FRAMEWORKS, normalized)
    ? PERSUASION_FRAMEWORKS[normalized]
    : GENERIC_FRAMEWORK;
}

/**
 * Get section-specific best practices prompt.
 * Returns generic best practices for unknown section types.
 */
export function getBestPracticesPrompt(sectionType: string): string {
  const normalized = sectionType.toLowerCase();
  return Object.prototype.hasOwnProperty.call(
    SECTION_BEST_PRACTICES,
    normalized,
  )
    ? SECTION_BEST_PRACTICES[normalized]
    : GENERIC_BEST_PRACTICES;
}

/**
 * Build a win themes prompt fragment.
 * Returns empty string if no themes provided.
 */
export function buildWinThemesPrompt(themes: string[]): string {
  if (!themes || themes.length === 0) return "";

  const themeList = themes.map((t, i) => `${i + 1}. ${t}`).join("\n");
  return `### Win Themes to Reinforce
Weave these themes naturally throughout the section. Do not state them verbatim — integrate them into your narrative so they feel organic, not forced.

${themeList}

Every section should reference at least one win theme. Vary which themes you emphasize to avoid repetition across the proposal.`;
}

/**
 * Build a competitive positioning prompt fragment.
 * Returns empty string if no differentiators provided.
 */
export function buildCompetitivePrompt(
  differentiators: string[],
  objections: string[],
): string {
  if (
    (!differentiators || differentiators.length === 0) &&
    (!objections || objections.length === 0)
  ) {
    return "";
  }

  let prompt = `### Competitive Positioning (Indirect Framing)
Position our strengths without naming competitors. Use indirect framing: "Some approaches fail because..." or "Unlike traditional methods..."

`;

  if (differentiators.length > 0) {
    prompt += `**Key Differentiators to Weave In:**\n`;
    prompt += differentiators.map((d) => `- ${d}`).join("\n");
    prompt += "\n\n";
  }

  if (objections.length > 0) {
    prompt += `**Objections to Preemptively Address:**\n`;
    prompt += objections.map((o) => `- ${o}`).join("\n");
    prompt += "\n";
  }

  return prompt;
}

/**
 * Build a brand voice system prompt fragment.
 * Returns empty string if brand voice has no meaningful content.
 */
export function buildBrandVoiceSystemPrompt(brandVoice: BrandVoice): string {
  if (
    !brandVoice.tone &&
    brandVoice.terminology.use.length === 0 &&
    brandVoice.terminology.avoid.length === 0
  ) {
    return "";
  }

  let prompt = "\n## Brand Voice\n";

  if (brandVoice.tone) {
    prompt += `Tone: ${brandVoice.tone}\n`;
  }

  if (brandVoice.terminology.use.length > 0) {
    prompt += `\nPreferred terminology: ${brandVoice.terminology.use.join(", ")}\n`;
  }

  if (brandVoice.terminology.avoid.length > 0) {
    prompt += `\nTerms to NEVER use: ${brandVoice.terminology.avoid.join(", ")}\n`;
  }

  return prompt;
}

// ============================================================
// Quality Checks
// ============================================================

/**
 * Run post-generation quality checks on section content.
 * All checks are simple string operations — no LLM call needed.
 * Returns a QualityCheck result object (booleans only, no internal details).
 */
export function runQualityChecks(
  content: string,
  sectionType: string,
  winThemes: string[],
  avoidTerms: string[],
): QualityCheck {
  if (!content) {
    return {
      winThemePresent: false,
      lengthInRange: false,
      noBlockedTerms: true, // empty content can't contain blocked terms
      hasProofPoint: false,
    };
  }

  const contentLower = content.toLowerCase();

  // Check 1: Win theme present (case-insensitive substring match)
  const winThemePresent =
    winThemes.length === 0 ||
    winThemes.some((theme) => contentLower.includes(theme.toLowerCase()));

  // Check 2: Length in range (word count)
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const range = LENGTH_RANGES[sectionType.toLowerCase()] ?? DEFAULT_LENGTH;
  const lengthInRange = wordCount >= range.min && wordCount <= range.max;

  // Check 3: No blocked terms (escape regex special chars in avoid terms)
  const noBlockedTerms = avoidTerms.every((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    return !regex.test(content);
  });

  // Check 4: Has proof point (metrics, numbers, evidence indicators)
  const hasProofPoint = PROOF_INDICATORS.some((pattern) =>
    pattern.test(content),
  );

  return {
    winThemePresent,
    lengthInRange,
    noBlockedTerms,
    hasProofPoint,
  };
}
