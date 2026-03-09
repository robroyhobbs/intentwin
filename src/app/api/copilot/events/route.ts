import { NextRequest } from "next/server";
import {
  apiError,
  badRequest,
  created,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { ingestCopilotEvent } from "@/lib/copilot/ingest-event";
import { createRequestLogger } from "@/lib/utils/logger";

export async function POST(request: NextRequest): Promise<Response> {
  const { log, requestId } = createRequestLogger(request, {
    route: "/api/copilot/events",
  });

  try {
    const secret = process.env.COPILOT_SERVICE_SECRET?.trim() || null;
    if (!secret) {
      return withRequestId(
        apiError({
          message: "Copilot service auth is not configured",
          status: 503,
          code: "SERVICE_UNAVAILABLE",
        }),
        requestId,
      );
    }

    if (!hasValidServiceAuthorization(request, secret)) {
      log.warn("Rejected copilot event request with invalid service auth");
      return withRequestId(
        unauthorized("Invalid copilot service authorization"),
        requestId,
      );
    }

    const body = await parseRequestBody(request);
    if (!body.ok) {
      return withRequestId(badRequest("Invalid JSON body"), requestId);
    }

    const result = await ingestCopilotEvent(body.data, { requestId });
    if (!result.ok) {
      return withRequestId(
        apiError({
          message: result.message,
          status: result.status,
          code: result.code,
        }),
        requestId,
      );
    }

    const responseBody = {
      event: result.data.event,
      intervention: result.data.intervention,
      deduplicated: result.deduplicated,
    };
    const response = result.deduplicated ? ok(responseBody) : created(responseBody);

    return withRequestId(response, requestId);
  } catch (error) {
    log.error("Failed to ingest copilot event", error);
    return withRequestId(serverError("Failed to ingest copilot event", error), requestId);
  }
}

function hasValidServiceAuthorization(
  request: NextRequest,
  secret: string,
): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function parseRequestBody(
  request: NextRequest,
): Promise<{ ok: true; data: unknown } | { ok: false }> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return { ok: false };
  }
}

function withRequestId(response: Response, requestId: string): Response {
  response.headers.set("x-request-id", requestId);
  return response;
}
