import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, badRequest, serverError, ok, created, conflict } from "@/lib/api/response";
import { sanitizeTitle, sanitizeString } from "@/lib/security/sanitize";
import { clearL1Cache } from "@/lib/ai/pipeline/context";

const VALID_OUTCOMES = [
  "cost_optimization",
  "speed_to_value",
  "quality_improvement",
  "risk_reduction",
  "innovation",
  "compliance",
] as const;

const SELECT_FIELDS =
  "id, product_name, service_line, description, capabilities";

function validateCapabilities(
  capabilities: unknown
): { valid: boolean; error?: string } {
  if (!Array.isArray(capabilities)) {
    return { valid: false, error: "capabilities must be an array" };
  }
  for (const cap of capabilities) {
    if (!cap || typeof cap !== "object") {
      return { valid: false, error: "Each capability must be an object" };
    }
    if (!cap.name || typeof cap.name !== "string") {
      return {
        valid: false,
        error: "Each capability must have a name string",
      };
    }
    if (!cap.description || typeof cap.description !== "string") {
      return {
        valid: false,
        error: "Each capability must have a description string",
      };
    }
    if (cap.outcomes !== undefined) {
      if (!Array.isArray(cap.outcomes)) {
        return { valid: false, error: "Capability outcomes must be an array" };
      }
      for (const o of cap.outcomes) {
        if (
          !VALID_OUTCOMES.includes(
            o as (typeof VALID_OUTCOMES)[number]
          )
        ) {
          return {
            valid: false,
            error: `Invalid outcome: ${o}. Must be one of: ${VALID_OUTCOMES.join(", ")}`,
          };
        }
      }
    }
  }
  return { valid: true };
}

/**
 * GET /api/settings/products
 * List all products for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const adminClient = createAdminClient();
    const { data: products, error } = await adminClient
      .from("product_contexts")
      .select(SELECT_FIELDS)
      .eq("organization_id", context.organizationId)
      .order("product_name", { ascending: true });

    if (error) {
      return serverError("Failed to fetch products", error);
    }

    return ok({ products: products || [] });
  } catch (error) {
    return serverError("Failed to fetch products", error);
  }
}

/**
 * POST /api/settings/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const body = await request.json();
    const { product_name, service_line, description, capabilities } = body;

    if (
      !product_name ||
      typeof product_name !== "string" ||
      !product_name.trim()
    ) {
      return badRequest("product_name is required");
    }

    if (capabilities !== undefined) {
      const validation = validateCapabilities(capabilities);
      if (!validation.valid) {
        return badRequest(validation.error!);
      }
    }

    const adminClient = createAdminClient();
    const sanitizedName = sanitizeTitle(product_name);
    const sanitizedSvcLine = sanitizeTitle(service_line || "");
    const sanitizedDescription = sanitizeString(description || "");

    // Check for duplicate (product_name, service_line) within org
    const { data: existing } = await adminClient
      .from("product_contexts")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("product_name", sanitizedName)
      .eq("service_line", sanitizedSvcLine)
      .single();

    if (existing) {
      return conflict("A product with this name and service line already exists");
    }

    const { data: product, error } = await adminClient
      .from("product_contexts")
      .insert({
        organization_id: context.organizationId,
        product_name: sanitizedName,
        service_line: sanitizedSvcLine,
        description: sanitizedDescription,
        capabilities: capabilities || [],
        specifications: {},
        pricing_models: [],
        constraints: {},
        supported_outcomes: [],
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      return serverError("Failed to create product", error);
    }

    clearL1Cache();
    return created({ product });
  } catch (error) {
    return serverError("Failed to create product", error);
  }
}

/**
 * PATCH /api/settings/products
 * Update a product (id in request body)
 */
export async function PATCH(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return badRequest("id is required in request body");
    }

    if (fields.capabilities !== undefined) {
      const validation = validateCapabilities(fields.capabilities);
      if (!validation.valid) {
        return badRequest(validation.error!);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (fields.product_name !== undefined)
      updateData.product_name = sanitizeTitle(fields.product_name);
    if (fields.service_line !== undefined)
      updateData.service_line = sanitizeTitle(fields.service_line);
    if (fields.description !== undefined)
      updateData.description = sanitizeString(fields.description);
    if (fields.capabilities !== undefined)
      updateData.capabilities = fields.capabilities;

    const adminClient = createAdminClient();
    const { data: product, error } = await adminClient
      .from("product_contexts")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select(SELECT_FIELDS)
      .single();

    if (error || !product) {
      if (error?.code === "PGRST116" || !product) {
        return notFound("Product not found");
      }
      return serverError("Failed to update product", error);
    }

    clearL1Cache();
    return ok({ product });
  } catch (error) {
    return serverError("Failed to update product", error);
  }
}

/**
 * DELETE /api/settings/products?id=[id]
 * Delete a product by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return badRequest("id query parameter is required");
    }

    const adminClient = createAdminClient();

    // Verify product exists in this org
    const { data: existing } = await adminClient
      .from("product_contexts")
      .select("id")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!existing) {
      return notFound("Product not found");
    }

    const { error } = await adminClient
      .from("product_contexts")
      .delete()
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    if (error) {
      return serverError("Failed to delete product", error);
    }

    clearL1Cache();
    return ok({ deleted: true });
  } catch (error) {
    return serverError("Failed to delete product", error);
  }
}
