export interface Section {
  id: string;
  section_type: string;
  title: string;
  section_order: number;
  generated_content: string | null;
  edited_content: string | null;
  is_edited: boolean;
  generation_status: string;
  generation_error: string | null;
  review_status: string;
}

export interface QualityReviewSection {
  section_id: string;
  score: number;
}

export interface L1Summary {
  companyContextCount: number;
  productContextCount: number;
  evidenceCount: number;
  evidenceIds?: string[];
  productIds?: string[];
  l1StringLength: number;
  staticSourcesIncluded: boolean;
  fetchedAt: string;
}

export interface Proposal {
  id: string;
  title: string;
  status: string;
  intake_data: Record<string, unknown>;
  created_at: string;
  deal_outcome?: string;
  deal_value?: number;
  generation_error?: string | null;
  l1_summary?: L1Summary | null;
  quality_review?: {
    status: string;
    sections?: QualityReviewSection[];
  } | null;
}
