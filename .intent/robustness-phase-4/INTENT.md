# Phase 4: API Robustness

## Intent

Standardize API contracts, add comprehensive request validation, and ensure consistent error handling across all endpoints. Make the API predictable, well-documented, and resilient to malformed inputs.

## Problem Statement

Current state:
- No consistent request validation (Zod schemas not applied at boundaries)
- Error response formats vary across routes
- No API documentation (OpenAPI)
- Some routes may accept invalid data silently
- Inconsistent HTTP status codes
- No request/response logging for debugging

This creates issues:
- Invalid data reaches database
- Clients receive inconsistent error formats
- API contract is implicit, not explicit
- Hard to integrate for third parties

## Goals

1. **Request Validation** - Zod schemas for all API inputs
2. **Error Standardization** - Consistent error response format
3. **API Documentation** - OpenAPI spec generation
4. **Request Logging** - Structured logging for debugging
5. **Response Standardization** - Consistent success response format

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Routes with Zod validation | ~30% | 100% |
| Error format consistency | 60% | 100% |
| OpenAPI coverage | 0% | 100% |
| HTTP status code accuracy | 70% | 100% |

## Technical Approach

### 1. Zod Schema Definitions

Create comprehensive schemas:

```typescript
// src/lib/schemas/api.ts
import { z } from "zod";

// Common schemas
export const IdSchema = z.string().uuid();
export const OrganizationIdSchema = z.string().uuid();

// Proposal schemas
export const CreateProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  client_name: z.string().min(1).max(100),
  client_industry: z.string().max(50).optional(),
  rfp_deadline: z.string().datetime().optional(),
  budget_range: z.string().max(50).optional(),
  intake_data: z.record(z.unknown()).optional()
});

export const UpdateProposalSchema = CreateProposalSchema.partial();

// Document schemas
export const UploadDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  document_type: z.enum(["rfp", "capability", "past_performance", "reference"])
});

// AI Generation schemas
export const GenerateSectionSchema = z.object({
  section_type: z.enum([
    "executive_summary",
    "understanding",
    "approach",
    "methodology",
    "team",
    "case_studies",
    "timeline",
    "pricing",
    "risk_mitigation",
    "why_us"
  ]),
  feedback: z.string().max(1000).optional()
});

// Export schemas
export const ExportProposalSchema = z.object({
  format: z.enum(["html", "docx", "pptx", "pdf", "slides"]),
  include_sections: z.array(z.string()).optional(),
  branding_override: z.object({
    primary_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    logo_url: z.string().url().optional()
  }).optional()
});

// Query parameter schemas
export const ListProposalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["draft", "in_review", "complete"]).optional(),
  search: z.string().max(100).optional(),
  sort_by: z.enum(["created_at", "updated_at", "title"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc")
});

// Export types
export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;
export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>;
export type GenerateSectionInput = z.infer<typeof GenerateSectionSchema>;
export type ExportProposalInput = z.infer<typeof ExportProposalSchema>;
```

### 2. Validation Middleware

Create reusable validation wrapper:

```typescript
// src/lib/middleware/validate-request.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema, ZodError } from "zod";
import { logger } from "@/lib/utils/logger";

interface ValidationConfig<T, Q> {
  body?: ZodSchema<T>;
  query?: ZodSchema<Q>;
  params?: ZodSchema<Record<string, string>>;
}

export function validateRequest<T, Q>(config: ValidationConfig<T, Q>) {
  return (
    handler: (
      req: NextRequest,
      data: { body: T; query: Q; params: Record<string, string> }
    ) => Promise<NextResponse>
  ) => {
    return async (
      req: NextRequest,
      { params }: { params: Promise<Record<string, string>> }
    ): Promise<NextResponse> => {
      try {
        const validatedData: {
          body: T;
          query: Q;
          params: Record<string, string>;
        } = {
          body: {} as T,
          query: {} as Q,
          params: {}
        };

        // Validate body
        if (config.body) {
          const body = await req.json();
          validatedData.body = config.body.parse(body);
        }

        // Validate query params
        if (config.query) {
          const url = new URL(req.url);
          const query: Record<string, unknown> = {};
          url.searchParams.forEach((value, key) => {
            query[key] = value;
          });
          validatedData.query = config.query.parse(query);
        }

        // Validate route params
        if (config.params) {
          const routeParams = await params;
          validatedData.params = config.params.parse(routeParams);
        }

        return handler(req, validatedData);
      } catch (error) {
        if (error instanceof ZodError) {
          logger.warn("Validation failed", {
            url: req.url,
            errors: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message
            }))
          });

          return NextResponse.json(
            {
              error: "Validation failed",
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
                code: e.code
              }))
            },
            { status: 400 }
          );
        }

        throw error;
      }
    };
  };
}
```

### 3. Standardized Error Responses

Create error response utilities:

```typescript
// src/lib/api/errors.ts
import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export class ApiErrorResponse extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }

  toJSON(requestId?: string): ApiError {
    return {
      error: this.message,
      code: this.code,
      message: this.message,
      details: this.details,
      requestId
    };
  }
}

// Error factory functions
export const Errors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    new ApiErrorResponse(400, "BAD_REQUEST", message, details),

  unauthorized: (message = "Authentication required") =>
    new ApiErrorResponse(401, "UNAUTHORIZED", message),

  forbidden: (message = "Access denied") =>
    new ApiErrorResponse(403, "FORBIDDEN", message),

  notFound: (resource: string, id?: string) =>
    new ApiErrorResponse(
      404,
      "NOT_FOUND",
      `${resource}${id ? ` with id '${id}'` : ""} not found`
    ),

  conflict: (message: string) =>
    new ApiErrorResponse(409, "CONFLICT", message),

  validation: (errors: Array<{ field: string; message: string }>) =>
    new ApiErrorResponse(422, "VALIDATION_ERROR", "Validation failed", {
      errors
    }),

  rateLimited: (retryAfter?: number) =>
    new ApiErrorResponse(429, "RATE_LIMITED", "Too many requests", {
      retryAfter
    }),

  internal: (message = "Internal server error") =>
    new ApiErrorResponse(500, "INTERNAL_ERROR", message)
};

// Error handler middleware
export function errorHandler(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    const requestId = generateRequestId();

    try {
      return await handler(req);
    } catch (error) {
      logger.error("API Error", {
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url
      });

      if (error instanceof ApiErrorResponse) {
        return NextResponse.json(error.toJSON(requestId), {
          status: error.statusCode
        });
      }

      return NextResponse.json(
        {
          error: "Internal server error",
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          requestId
        },
        { status: 500 }
      );
    }
  };
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### 4. Request/Response Logging

Add structured logging:

```typescript
// src/lib/middleware/request-logger.ts
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

export async function logRequest(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const start = Date.now();
  const requestId = generateRequestId();

  // Log request
  logger.info("API Request", {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent"),
    ip: req.ip,
    orgId: extractOrgId(req)
  });

  try {
    const response = await handler();

    // Log response
    const duration = Date.now() - start;
    logger.info("API Response", {
      requestId,
      status: response.status,
      duration,
      contentLength: response.headers.get("content-length")
    });

    // Add request ID to response headers
    response.headers.set("X-Request-ID", requestId);

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error("API Error", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown",
      duration
    });
    throw error;
  }
}
```

### 5. Route Implementation Example

Refactored route with all patterns:

```typescript
// src/app/api/proposals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/middleware/validate-request";
import { CreateProposalSchema, ListProposalsQuerySchema } from "@/lib/schemas/api";
import { errorHandler, Errors } from "@/lib/api/errors";
import { getUserContext } from "@/lib/supabase/auth-api";
import { logRequest } from "@/lib/middleware/request-logger";

// GET /api/proposals
export const GET = errorHandler(async (req: NextRequest) => {
  return logRequest(req, async () => {
    const handler = validateRequest({ query: ListProposalsQuerySchema })(
      async (_req, { query }) => {
        const context = await getUserContext(_req);
        if (!context) throw Errors.unauthorized();

        const proposals = await fetchProposals(context.organizationId, query);

        return NextResponse.json({
          data: proposals.items,
          meta: {
            page: query.page,
            limit: query.limit,
            total: proposals.total,
            hasMore: proposals.hasMore
          }
        });
      }
    );

    return handler(req, { params: Promise.resolve({}) });
  });
});

// POST /api/proposals
export const POST = errorHandler(async (req: NextRequest) => {
  return logRequest(req, async () => {
    const handler = validateRequest({ body: CreateProposalSchema })(
      async (_req, { body }) => {
        const context = await getUserContext(_req);
        if (!context) throw Errors.unauthorized();

        // Check plan limits
        const limitCheck = await checkPlanLimit(
          context.organizationId,
          "proposals_per_month"
        );

        if (!limitCheck.allowed) {
          throw Errors.forbidden("Proposal limit reached for current plan");
        }

        const proposal = await createProposal(context.organizationId, body);

        return NextResponse.json({ data: proposal }, { status: 201 });
      }
    );

    return handler(req, { params: Promise.resolve({}) });
  });
});
```

### 6. OpenAPI Generation

Generate API docs from schemas:

```typescript
// src/lib/api/openapi.ts
import { OpenAPIV3 } from "openapi-types";
import * as schemas from "@/lib/schemas/api";

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "IntentBid API",
    version: "1.0.0",
    description: "AI-powered proposal generation API"
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || "https://api.intentwin.com",
      description: "Production API"
    }
  ],
  paths: {
    "/api/proposals": {
      get: {
        summary: "List proposals",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 }
          }
        ],
        responses: {
          "200": {
            description: "List of proposals",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Proposal" }
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create proposal",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: zodToJsonSchema(schemas.CreateProposalSchema)
            }
          }
        },
        responses: {
          "201": {
            description: "Proposal created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Proposal" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Proposal: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          status: {
            type: "string",
            enum: ["draft", "in_review", "complete"]
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      }
    }
  }
};
```

## File Structure

```
src/lib/
├── schemas/
│   ├── api.ts                 # All API input schemas
│   └── index.ts               # Schema exports
├── api/
│   ├── errors.ts              # Error handling utilities
│   ├── response.ts            # Response helpers
│   └── openapi.ts             # OpenAPI spec
└── middleware/
    ├── validate-request.ts    # Zod validation wrapper
    └── request-logger.ts      # Request logging

src/app/api/
└── openapi/
    └── route.ts               # Serve OpenAPI JSON
```

## Dependencies

Already have `zod`, no additional deps needed.

## Testing

```typescript
// __tests__/api/validation.test.ts
describe("API Validation", () => {
  test("rejects invalid proposal data", async () => {
    const res = await fetch("/api/proposals", {
      method: "POST",
      body: JSON.stringify({ title: "" }) // Empty title
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details).toContainEqual(
      expect.objectContaining({ field: "title" })
    );
  });

  test("accepts valid proposal data", async () => {
    const res = await fetch("/api/proposals", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Proposal",
        client_name: "Test Client"
      })
    });

    expect(res.status).toBe(201);
  });
});
```

## Verification Checklist

- [ ] All API routes use Zod validation
- [ ] Error response format consistent across routes
- [ ] OpenAPI spec generated and served at /api/openapi
- [ ] Request logging active with correlation IDs
- [ ] All error cases return appropriate HTTP status codes
- [ ] Validation tests cover edge cases

## Success Metrics

Upon completion:
- 100% of API routes validate inputs with Zod
- Consistent error format for all error responses
- OpenAPI documentation available
- All requests logged with correlation IDs
- API contract is explicit and documented
