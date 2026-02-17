import {
  FileText,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Award,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export type EvidenceType =
  | "case_study"
  | "metric"
  | "testimonial"
  | "certification"
  | "award";

export interface OutcomeDemonstrated {
  outcome: string;
  description: string;
}

export interface EvidenceMetric {
  name: string;
  value: string;
  context: string;
}

export interface Evidence {
  id: string;
  evidence_type: EvidenceType;
  title: string;
  summary: string;
  full_content: string;
  client_industry: string | null;
  service_line: string | null;
  client_size: string | null;
  outcomes_demonstrated: OutcomeDemonstrated[];
  metrics: EvidenceMetric[];
  is_verified: boolean;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
}

export interface EvidenceForm {
  evidence_type: EvidenceType;
  title: string;
  summary: string;
  full_content: string;
  client_industry: string;
  service_line: string;
  client_size: string;
  outcomes_text: string;
  metrics_text: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const EVIDENCE_TYPES: {
  value: EvidenceType;
  label: string;
  icon: typeof FileText;
}[] = [
  { value: "case_study", label: "Case Studies", icon: FileText },
  { value: "metric", label: "Metrics", icon: BarChart3 },
  { value: "testimonial", label: "Testimonials", icon: MessageSquare },
  { value: "certification", label: "Certifications", icon: ShieldCheck },
  { value: "award", label: "Awards", icon: Award },
];

export const CLIENT_SIZES = [
  { value: "", label: "Any Size" },
  { value: "enterprise", label: "Enterprise" },
  { value: "mid_market", label: "Mid-Market" },
  { value: "smb", label: "SMB" },
];

export const EMPTY_FORM: EvidenceForm = {
  evidence_type: "case_study",
  title: "",
  summary: "",
  full_content: "",
  client_industry: "",
  service_line: "",
  client_size: "",
  outcomes_text: "",
  metrics_text: "",
};
