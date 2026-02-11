import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: products, error } = await adminClient
      .from("product_contexts")
      .select(SELECT_FIELDS)
      .eq("organization_id", context.organizationId)
      .order("product_name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: products || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { product_name, service_line, description, capabilities } = body;

    if (
      !product_name ||
      typeof product_name !== "string" ||
      !product_name.trim()
    ) {
      return NextResponse.json(
        { error: "product_name is required" },
        { status: 400 }
      );
    }

    if (capabilities !== undefined) {
      const validation = validateCapabilities(capabilities);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    const adminClient = createAdminClient();
    const trimmedName = product_name.trim();
    const svcLine = service_line || "";

    // Check for duplicate (product_name, service_line) within org
    const { data: existing } = await adminClient
      .from("product_contexts")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("product_name", trimmedName)
      .eq("service_line", svcLine)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A product with this name and service line already exists" },
        { status: 409 }
      );
    }

    const { data: product, error } = await adminClient
      .from("product_contexts")
      .insert({
        organization_id: context.organizationId,
        product_name: trimmedName,
        service_line: svcLine,
        description: description || "",
        capabilities: capabilities || [],
        specifications: {},
        pricing_models: [],
        constraints: {},
        supported_outcomes: [],
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required in request body" },
        { status: 400 }
      );
    }

    if (fields.capabilities !== undefined) {
      const validation = validateCapabilities(fields.capabilities);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (fields.product_name !== undefined)
      updateData.product_name =
        typeof fields.product_name === "string"
          ? fields.product_name.trim()
          : fields.product_name;
    if (fields.service_line !== undefined)
      updateData.service_line = fields.service_line;
    if (fields.description !== undefined)
      updateData.description = fields.description;
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
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const { error } = await adminClient
      .from("product_contexts")
      .delete()
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
