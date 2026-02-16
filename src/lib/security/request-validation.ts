/**
 * Request Validation — Body size limits and content type checking.
 *
 * Prevents DoS via oversized payloads and ensures proper content types.
 *
 * @module security/request-validation
 */

import { NextRequest, NextResponse } from "next/server";

/** Default max body size: 1MB for JSON requests */
const DEFAULT_MAX_BODY_SIZE = 1 * 1024 * 1024;

/** Max body size for file uploads: 50MB */
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

/**
 * Validate request body size.
 * Returns a 413 response if the body exceeds the limit.
 * Returns null if the request is valid.
 */
export function validateBodySize(
  request: NextRequest,
  maxSize: number = DEFAULT_MAX_BODY_SIZE,
): Response | null {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > maxSize) {
      return NextResponse.json(
        {
          error: "Request body too large",
          maxSize: `${Math.round(maxSize / 1024)}KB`,
        },
        { status: 413 },
      );
    }
  }

  return null;
}

/**
 * Validate that the request has the expected content type.
 * Returns a 415 response if the content type doesn't match.
 * Returns null if valid.
 */
export function validateContentType(
  request: NextRequest,
  expectedTypes: string[] = ["application/json"],
): Response | null {
  // Skip for GET, HEAD, OPTIONS (no body)
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return null;
  }

  const contentType = request.headers.get("content-type");
  if (!contentType) {
    // Allow requests without content-type if they have no body
    const contentLength = request.headers.get("content-length");
    if (!contentLength || contentLength === "0") return null;

    return NextResponse.json(
      { error: "Content-Type header is required" },
      { status: 415 },
    );
  }

  // Check if the content type matches any expected type
  const normalizedType = contentType.split(";")[0]?.trim().toLowerCase();
  if (!normalizedType || !expectedTypes.some((t) => normalizedType === t)) {
    return NextResponse.json(
      {
        error: `Unsupported content type: ${normalizedType}`,
        expected: expectedTypes,
      },
      { status: 415 },
    );
  }

  return null;
}

/**
 * Parse JSON body safely with size limit.
 * Returns the parsed body or a 400/413 error response.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: NextRequest,
  maxSize: number = DEFAULT_MAX_BODY_SIZE,
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  // Check size
  const sizeError = validateBodySize(request, maxSize);
  if (sizeError) return { data: null, error: sizeError };

  try {
    const data = (await request.json()) as T;
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      ),
    };
  }
}
