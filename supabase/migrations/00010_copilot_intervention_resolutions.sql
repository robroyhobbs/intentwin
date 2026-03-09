ALTER TABLE "public"."copilot_interventions"
    ADD COLUMN IF NOT EXISTS "resolution_decision" "text",
    ADD COLUMN IF NOT EXISTS "resolution_notes" "text",
    ADD COLUMN IF NOT EXISTS "resolved_by" "uuid",
    ADD COLUMN IF NOT EXISTS "resolved_at" timestamp with time zone;

ALTER TABLE ONLY "public"."copilot_interventions"
    DROP CONSTRAINT IF EXISTS "copilot_interventions_resolution_decision_check";

ALTER TABLE ONLY "public"."copilot_interventions"
    ADD CONSTRAINT "copilot_interventions_resolution_decision_check"
    CHECK (
      "resolution_decision" IS NULL
      OR "resolution_decision" = ANY (ARRAY['approve'::"text", 'reject'::"text"])
    );

ALTER TABLE ONLY "public"."copilot_interventions"
    ADD CONSTRAINT "copilot_interventions_resolved_by_fkey"
    FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_copilot_interventions_org_resolved"
    ON "public"."copilot_interventions" USING "btree" ("organization_id", "resolved_at" DESC);
