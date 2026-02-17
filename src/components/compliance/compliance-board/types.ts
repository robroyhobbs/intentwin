import {
  CheckCircle2,
  CircleDot,
  Circle,
  MinusCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Requirement {
  id: string;
  requirement_text: string;
  source_reference: string | null;
  category: "mandatory" | "desirable" | "informational";
  compliance_status:
    | "met"
    | "partially_met"
    | "not_addressed"
    | "not_applicable";
  mapped_section_id: string | null;
  notes: string | null;
  is_extracted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceSummary {
  total: number;
  met: number;
  partially_met: number;
  not_addressed: number;
  not_applicable: number;
  mandatory_gaps: number;
}

export interface ComplianceBoardProps {
  proposalId: string;
  sections?: { id: string; title: string; section_type: string }[];
}

// ── Constants ──────────────────────────────────────────────────────────────

export const COLUMNS = [
  {
    id: "met" as const,
    title: "Met",
    icon: CheckCircle2,
    color: "var(--success)",
  },
  {
    id: "partially_met" as const,
    title: "Partially Met",
    icon: CircleDot,
    color: "var(--warning)",
  },
  {
    id: "not_addressed" as const,
    title: "Not Addressed",
    icon: Circle,
    color: "var(--danger)",
  },
  {
    id: "not_applicable" as const,
    title: "N/A",
    icon: MinusCircle,
    color: "var(--foreground-muted)",
  },
] as const;

export const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  mandatory: {
    bg: "rgba(239, 68, 68, 0.1)",
    text: "#ef4444",
    label: "MANDATORY",
  },
  desirable: {
    bg: "rgba(234, 179, 8, 0.1)",
    text: "#eab308",
    label: "DESIRABLE",
  },
  informational: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "#3b82f6",
    label: "INFO",
  },
};

export const CATEGORY_ORDER: Record<string, number> = {
  mandatory: 0,
  desirable: 1,
  informational: 2,
};
