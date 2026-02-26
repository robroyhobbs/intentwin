/**
 * Shared constants for the slide generator
 */

import type { BrandingSettings } from "./types";

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

/** Convert hex to rgba for glow / transparency effects */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Build a COLORS-compatible palette from optional BrandingSettings.
 * Falls back to the default COLORS for any missing value.
 */
export function buildColors(branding?: BrandingSettings): typeof COLORS {
  if (!branding) return COLORS;
  return {
    navy: COLORS.navy, // background stays fixed
    navyLight: branding.secondary_color || COLORS.navyLight,
    blue: branding.primary_color || COLORS.blue,
    cyan: branding.accent_color || COLORS.cyan,
    cyanGlow: hexToRgba(branding.accent_color || COLORS.cyan, 0.4),
    white: COLORS.white,
    offWhite: COLORS.offWhite,
    gray: COLORS.gray,
    grayLight: COLORS.grayLight,
    grayDark: COLORS.grayDark,
  };
}

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
  why_company: "differentiator",
  why_us: "differentiator",
  differentiators: "differentiator",
  value_proposition: "differentiator",
  team: "differentiator",
  rfp_task: "approach",        // Task-mirrored sections use the approach slide layout
  next_steps: "closing",
  timeline: "closing",
  commercial: "closing",
};
