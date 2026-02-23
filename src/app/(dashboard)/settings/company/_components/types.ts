export interface CompanyContext {
  id?: string;
  category: string;
  key: string;
  title: string;
  content: string;
}

export interface Organization {
  id: string;
  name: string;
  settings: {
    description?: string;
    differentiators?: string[];
    industries?: string[];
    services?: string[];
  };
}

export interface ProductCapability {
  name: string;
  description: string;
  outcomes: string[];
}

export interface Product {
  id: string;
  product_name: string;
  service_line: string;
  description: string;
  capabilities: ProductCapability[];
}

export const OUTCOME_OPTIONS = [
  { value: "cost_optimization", label: "Cost Optimization" },
  { value: "speed_to_value", label: "Speed to Value" },
  { value: "quality_improvement", label: "Quality Improvement" },
  { value: "risk_reduction", label: "Risk Reduction" },
  { value: "innovation", label: "Innovation" },
  { value: "compliance", label: "Compliance" },
];

export interface TeamMemberProjectHistory {
  title: string;
  client_industry?: string;
  scope?: string;
  results?: string;
  dates?: string;
}

export interface TeamMemberFormData {
  name: string;
  role: string;
  title: string;
  email: string;
  skills: string[];
  certifications: string[];
  clearance_level: string;
  years_experience: number | null;
  bio: string;
  project_history: TeamMemberProjectHistory[];
}

export interface TeamMember extends TeamMemberFormData {
  id: string;
  is_verified: boolean;
  resume_document_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const CLEARANCE_OPTIONS = [
  { value: "", label: "None / Not Applicable" },
  { value: "Public Trust", label: "Public Trust" },
  { value: "Secret", label: "Secret" },
  { value: "Top Secret", label: "Top Secret" },
  { value: "Top Secret/SCI", label: "Top Secret/SCI" },
];
