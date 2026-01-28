export interface ProposalReview {
  id: string;
  proposal_id: string;
  section_id: string | null;
  reviewer_id: string;
  reviewer_email: string | null;
  annotation_type: "comment" | "suggestion" | "approval" | "rejection";
  content: string;
  selector_data: {
    element?: string;
    elementPath?: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
    cssClasses?: string;
  };
  selected_text: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string;
}

export interface ReviewSummary {
  total: number;
  open: number;
  resolved: number;
  dismissed: number;
  approvals: number;
}
