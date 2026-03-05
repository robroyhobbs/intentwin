/**
 * POST /api/proposals/[id]/generate
 *
 * @deprecated — All callers now use the client-orchestrated routes:
 *   - POST /generate/setup
 *   - POST /generate/section
 *   - POST /generate/finalize
 *
 * Returns 410 Gone for any straggling callers.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been replaced. Use /generate/setup, /generate/section, and /generate/finalize instead.",
      code: "DEPRECATED",
    },
    { status: 410 },
  );
}
