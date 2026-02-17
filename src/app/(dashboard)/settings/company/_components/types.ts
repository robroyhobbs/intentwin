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
