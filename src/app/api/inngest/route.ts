import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/index";

/**
 * POST/GET /api/inngest
 *
 * Inngest serve endpoint. Handles:
 * - GET: Introspection (Inngest dashboard discovers functions)
 * - POST: Event delivery (Inngest sends events to trigger functions)
 * - PUT: Sync/registration with Inngest cloud
 *
 * All registered functions are exposed via this single endpoint.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
