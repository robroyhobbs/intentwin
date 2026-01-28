export interface TargetOutcome {
  id: string;
  outcome: string;
  category:
    | "cost_optimization"
    | "speed_to_value"
    | "quality_improvement"
    | "risk_reduction"
    | "innovation"
    | "compliance";
  priority: "high" | "medium" | "low";
  ai_suggested: boolean;
  user_edited: boolean;
}

export interface WinStrategyData {
  win_themes: string[];
  success_metrics: string[];
  differentiators: string[];
  target_outcomes: TargetOutcome[];
  generated_at: string;
}

export const OUTCOME_CATEGORIES = [
  { value: "cost_optimization", label: "Cost Optimization" },
  { value: "speed_to_value", label: "Speed to Value" },
  { value: "quality_improvement", label: "Quality Improvement" },
  { value: "risk_reduction", label: "Risk Reduction" },
  { value: "innovation", label: "Innovation" },
  { value: "compliance", label: "Compliance" },
] as const;
