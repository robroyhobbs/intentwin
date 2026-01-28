import { z } from "zod";

export const intakeDataSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_industry: z.string().min(1, "Industry is required"),
  client_size: z.string().optional(),
  opportunity_type: z.enum([
    "cloud_migration",
    "app_modernization",
    "both",
    "other",
  ]),
  scope_description: z.string().min(10, "Please provide more detail on scope"),
  key_requirements: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  budget_range: z.string().optional(),
  timeline_expectation: z.string().optional(),
  competitive_intel: z.string().optional(),
  decision_criteria: z.array(z.string()).default([]),
  technical_environment: z.string().optional(),
  compliance_requirements: z.array(z.string()).default([]),
  additional_notes: z.string().optional(),
});

export type IntakeData = z.infer<typeof intakeDataSchema>;

export const documentUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  document_type: z.enum([
    "proposal",
    "case_study",
    "methodology",
    "capability",
    "team_bio",
    "template",
    "rfp",
    "other",
  ]),
  industry: z.string().optional(),
  service_line: z.string().optional(),
  client_name: z.string().optional(),
  win_status: z.enum(["won", "lost", "pending", "unknown"]).optional(),
  tags: z.array(z.string()).default([]),
});

export type DocumentUploadData = z.infer<typeof documentUploadSchema>;

export const targetOutcomeSchema = z.object({
  id: z.string(),
  outcome: z.string(),
  category: z.enum([
    "cost_optimization",
    "speed_to_value",
    "quality_improvement",
    "risk_reduction",
    "innovation",
    "compliance",
  ]),
  priority: z.enum(["high", "medium", "low"]),
  ai_suggested: z.boolean(),
  user_edited: z.boolean(),
});

export const winStrategySchema = z.object({
  win_themes: z.array(z.string()).min(1),
  success_metrics: z.array(z.string()).min(1),
  differentiators: z.array(z.string()).min(1),
  target_outcomes: z.array(targetOutcomeSchema).min(1),
  generated_at: z.string(),
});

export type WinStrategyValidated = z.infer<typeof winStrategySchema>;

export const searchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required"),
  document_type: z.string().optional(),
  industry: z.string().optional(),
  service_line: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
