import { type NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { getSectionsForSolicitationType } from "@/lib/ai/pipeline/section-configs";

/**
 * GET /api/templates?solicitation_type=RFP
 *
 * Returns section template configuration for the given solicitation type.
 * Backed by the server-side `section-configs.ts` — single source of truth.
 *
 * Response shape:
 * {
 *   solicitation_type: string,
 *   label: string,
 *   sections: [{ type, title, order, required, defaultEnabled }]
 * }
 */

const TEMPLATE_LABELS: Record<string, string> = {
  RFP: "Standard RFP Response",
  RFI: "Request for Information",
  RFQ: "Request for Quotation",
  SOW: "Statement of Work",
  Proactive: "Proactive Proposal",
};

/** Sections that are always required (cannot be unchecked) */
const REQUIRED_SECTIONS = new Set([
  "executive_summary",
  "understanding",
  "approach",
]);

/** Sections that default to disabled (user opts in) */
const DEFAULT_DISABLED_SECTIONS = new Set([
  "risk_mitigation",
  "exceptions_terms",
]);

const VALID_SOLICITATION_TYPES = new Set(["RFP", "RFI", "RFQ", "SOW", "Proactive"]);

export async function GET(request: NextRequest) {
  const context = await getUserContext(request);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const solicitationType = searchParams.get("solicitation_type") || "RFP";

  if (!VALID_SOLICITATION_TYPES.has(solicitationType)) {
    return NextResponse.json(
      { error: `Invalid solicitation_type: ${solicitationType}. Valid values: ${[...VALID_SOLICITATION_TYPES].join(", ")}` },
      { status: 400 },
    );
  }

  const sectionConfigs = getSectionsForSolicitationType(solicitationType);

  const sections = sectionConfigs.map((config) => ({
    type: config.type,
    title: config.title,
    order: config.order,
    required: REQUIRED_SECTIONS.has(config.type),
    defaultEnabled: !DEFAULT_DISABLED_SECTIONS.has(config.type),
  }));

  return NextResponse.json({
    solicitation_type: solicitationType,
    label: TEMPLATE_LABELS[solicitationType] || `${solicitationType} Template`,
    sections,
  });
}
