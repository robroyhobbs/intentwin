import { QualityReviewStatus } from "@/lib/constants/statuses";

export interface DimensionScores {
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
  grounding?: number;
}

export interface JudgeReviewData {
  judge_id: string;
  judge_name: string;
  provider: string;
  scores: DimensionScores;
  score: number;
  feedback: string;
  status: "completed" | "failed" | "timeout";
  error?: string;
}

export interface JudgeInfoData {
  judge_id: string;
  judge_name: string;
  provider: string;
  status: "completed" | "failed" | "timeout";
  error?: string;
}

export interface SectionReview {
  section_id: string;
  section_type: string;
  score: number;
  dimensions: DimensionScores;
  feedback: string;
  /** Individual judge results — present only in council mode */
  judge_reviews?: JudgeReviewData[];
}

export interface RemediationEntry {
  section_id: string;
  round: number;
  original_score: number;
  issues: string[];
  new_score: number;
}

export interface QualityReviewData {
  status:
    | typeof QualityReviewStatus.REVIEWING
    | typeof QualityReviewStatus.COMPLETED
    | typeof QualityReviewStatus.FAILED;
  run_at: string;
  trigger: "auto_post_generation" | "manual";
  model: string;
  overall_score: number;
  pass: boolean;
  sections: SectionReview[];
  remediation: RemediationEntry[];
  /** Council fields — present when model === "council" */
  judges?: JudgeInfoData[];
  consensus?: "unanimous" | "majority" | "split";
}

export interface QualityReportProps {
  proposalId: string;
  initialData?: QualityReviewData | null;
  /** Current proposal status — disables trigger when "generating" */
  proposalStatus?: string;
}
