/**
 * Shared constants for the slide generator
 */

/** Enhanced brand palette */
export const COLORS = {
  navy: "#0A1628",
  navyLight: "#1B365D",
  blue: "#0070AD",
  cyan: "#12ABDB",
  cyanGlow: "rgba(18, 171, 219, 0.4)",
  white: "#FFFFFF",
  offWhite: "#F0F4F8",
  gray: "#64748B",
  grayLight: "#94A3B8",
  grayDark: "#334155",
};

/** Maps section types to narrative categories */
export const NARRATIVE_MAP: Record<string, string> = {
  executive_summary: "context",
  current_state: "challenge",
  pain_points: "challenge",
  challenges: "challenge",
  problem_statement: "challenge",
  solution_overview: "solution",
  proposed_solution: "solution",
  approach: "approach",
  methodology: "approach",
  technical_approach: "approach",
  implementation: "approach",
  roadmap: "approach",
  case_studies: "metrics",
  case_study: "metrics",
  relevant_experience: "metrics",
  track_record: "metrics",
  outcomes: "metrics",
  benefits: "metrics",
  success_metrics: "metrics",
  why_capgemini: "differentiator",
  why_us: "differentiator",
  differentiators: "differentiator",
  value_proposition: "differentiator",
  team: "differentiator",
  next_steps: "closing",
  timeline: "closing",
  commercial: "closing",
};
