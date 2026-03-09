import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

export const maxDuration = 30;

// ── SAM.gov URL Detection ──────────────────────────────────────────────────

interface SamGovDetection {
  isWorkspace: boolean;
  opportunityId?: string;
}

const SAM_WORKSPACE_PATTERN =
  /sam\.gov\/workspace\/contract\/opp\/([0-9a-f-]{36})\/view/i;
const SAM_PUBLIC_PATTERN = /sam\.gov\/opp\/([0-9a-f-]{36})\/view/i;

export function detectSamGovUrl(url: string): SamGovDetection {
  const workspaceMatch = url.match(SAM_WORKSPACE_PATTERN);
  if (workspaceMatch) {
    return { isWorkspace: true, opportunityId: workspaceMatch[1] };
  }

  const publicMatch = url.match(SAM_PUBLIC_PATTERN);
  if (publicMatch) {
    return { isWorkspace: false, opportunityId: publicMatch[1] };
  }

  return { isWorkspace: false };
}

export function constructPublicSamUrl(opportunityId: string): string {
  return `https://sam.gov/opp/${opportunityId}/view`;
}

// Strip HTML tags and collapse whitespace into readable plain text
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: NextRequest) {
  const context = await getUserContext(request);
  if (!context) return unauthorized();

  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid request body");
  }

  const { url } = body;
  if (!url?.trim()) return badRequest("URL is required");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return badRequest("Only http and https URLs are supported");
    }
  } catch {
    return badRequest("Invalid URL format");
  }

  // SAM.gov workspace URL detection + redirect
  const samDetection = detectSamGovUrl(parsedUrl.toString());
  if (samDetection.isWorkspace && samDetection.opportunityId) {
    const publicUrl = constructPublicSamUrl(samDetection.opportunityId);
    logger.info("SAM.gov workspace URL redirected to public URL", {
      originalHost: parsedUrl.hostname,
      opportunityId: samDetection.opportunityId,
    });
    parsedUrl = new URL(publicUrl);
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; IntentBid/1.0; +https://intentbid.com)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return badRequest(
        `URL returned ${response.status}. Check that the link is publicly accessible.`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    let text: string;

    if (contentType.includes("text/html")) {
      const html = await response.text();
      text = htmlToText(html);
    } else if (contentType.includes("text/plain")) {
      text = await response.text();
    } else {
      return badRequest(
        `This URL returns ${contentType || "an unsupported format"}. Only HTML and plain text pages are supported. For PDF or Word attachments, download the file and upload it directly.`,
      );
    }

    // Cap at ~100k chars (~25k tokens) — enough for any solicitation page
    const truncated = text.length > 100_000;
    const content = text.slice(0, 100_000);

    if (content.trim().length < 50) {
      const samHint = samDetection.opportunityId
        ? " SAM.gov opportunities may require authentication. Try copying the opportunity text and pasting it directly."
        : "";
      return badRequest(
        `The page appears to be empty or requires a login to view.${samHint}`,
      );
    }

    logger.info("URL fetch success", {
      url: parsedUrl.hostname,
      contentLength: content.length,
      truncated,
    });

    return ok({
      content,
      truncated,
      url: parsedUrl.toString(),
      hostname: parsedUrl.hostname,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("timeout") || msg.includes("abort")) {
      return badRequest(
        "The URL took too long to respond (15s timeout). Try pasting the content directly instead.",
      );
    }
    logger.error("URL fetch failed", { url: parsedUrl.hostname, error: msg });
    return serverError("Failed to fetch URL", error);
  }
}
