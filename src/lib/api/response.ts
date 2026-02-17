/**
 * Standardized API Response Utilities
 *
 * Provides consistent response formatting, error handling,
 * and logging across all API routes.
 *
 * @module api/response
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

// ── Response Types ─────────────────────────────────────────────────

interface ApiErrorOptions {
  /** Error message for the client */
  message: string;
  /** HTTP status code (default: 500) */
  status?: number;
  /** Error code for programmatic handling */
  code?: string;
  /** Additional context for logging (not sent to client) */
  internal?: unknown;
}

interface ApiSuccessOptions<T> {
  /** Response data */
  data: T;
  /** HTTP status code (default: 200) */
  status?: number;
  /** Additional headers */
  headers?: Record<string, string>;
}

// ── Error Responses ────────────────────────────────────────────────

/**
 * Create a standardized error response.
 * Logs the error internally and returns a safe client response.
 */
export function apiError(opts: ApiErrorOptions): NextResponse {
  const { message, status = 500, code, internal } = opts;

  // Log internal details (never sent to client)
  if (status >= 500 && internal) {
    logger.error(`[API Error] ${code || "INTERNAL_ERROR"}: ${message}`, internal);
  }

  return NextResponse.json(
    {
      error: message,
      ...(code ? { code } : {}),
    },
    { status },
  );
}

/** 400 Bad Request */
export function badRequest(message: string = "Bad request"): NextResponse {
  return apiError({ message, status: 400, code: "BAD_REQUEST" });
}

/** 401 Unauthorized */
export function unauthorized(message: string = "Unauthorized"): NextResponse {
  return apiError({ message, status: 401, code: "UNAUTHORIZED" });
}

/** 403 Forbidden */
export function forbidden(message: string = "Forbidden"): NextResponse {
  return apiError({ message, status: 403, code: "FORBIDDEN" });
}

/** 404 Not Found */
export function notFound(message: string = "Not found"): NextResponse {
  return apiError({ message, status: 404, code: "NOT_FOUND" });
}

/** 409 Conflict */
export function conflict(message: string = "Conflict"): NextResponse {
  return apiError({ message, status: 409, code: "CONFLICT" });
}

/** 413 Payload Too Large */
export function payloadTooLarge(message: string = "Payload too large"): NextResponse {
  return apiError({ message, status: 413, code: "PAYLOAD_TOO_LARGE" });
}

/** 429 Too Many Requests */
export function tooManyRequests(message: string = "Too many requests", retryAfter?: number): NextResponse {
  const response = apiError({ message, status: 429, code: "RATE_LIMITED" });
  if (retryAfter) {
    response.headers.set("Retry-After", String(retryAfter));
  }
  return response;
}

/** 500 Internal Server Error */
export function serverError(
  message: string = "Internal server error",
  internal?: unknown,
): NextResponse {
  return apiError({
    message,
    status: 500,
    code: "INTERNAL_ERROR",
    internal,
  });
}

// ── Success Responses ──────────────────────────────────────────────

/**
 * Create a standardized success response.
 */
export function apiSuccess<T>(opts: ApiSuccessOptions<T>): NextResponse {
  const { data, status = 200, headers } = opts;
  return NextResponse.json(data, { status, headers });
}

/** 200 OK with data */
export function ok<T>(data: T): NextResponse {
  return apiSuccess({ data });
}

/** 201 Created with data */
export function created<T>(data: T): NextResponse {
  return apiSuccess({ data, status: 201 });
}

/** 204 No Content */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ── Error Handler Wrapper ──────────────────────────────────────────

/**
 * Wrap an API route handler with standardized error handling.
 * Catches unhandled errors and returns a 500 response.
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await getData();
 *   return ok({ data });
 * });
 */
export function withErrorHandler(
  handler: (
    request: Request,
    context?: { params: Promise<Record<string, string>> },
  ) => Promise<Response>,
) {
  return async (
    request: Request,
    context?: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      const _message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Unhandled API Error]", error);
      return serverError();
    }
  };
}
