CREATE TABLE IF NOT EXISTS "public"."copilot_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_event_id" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "source_system" "text" NOT NULL,
    "correlation_id" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "dedupe_key" "text" NOT NULL,
    "routed_agent" "text" NOT NULL,
    "action_mode" "text" NOT NULL,
    "status" "text" DEFAULT 'routed'::"text" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "copilot_events_action_mode_check" CHECK (("action_mode" = ANY (ARRAY['auto'::"text", 'approval_required'::"text"]))),
    CONSTRAINT "copilot_events_source_system_check" CHECK (("source_system" = ANY (ARRAY['intentwin'::"text", 'intentbid-intelligence'::"text", 'monitoring'::"text"]))),
    CONSTRAINT "copilot_events_status_check" CHECK (("status" = ANY (ARRAY['received'::"text", 'routed'::"text", 'rejected'::"text"])))
);

ALTER TABLE ONLY "public"."copilot_events"
    ADD CONSTRAINT "copilot_events_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."copilot_events"
    ADD CONSTRAINT "copilot_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "idx_copilot_events_org_dedupe" ON "public"."copilot_events" USING "btree" ("organization_id", "dedupe_key");
CREATE INDEX "idx_copilot_events_org_type_received" ON "public"."copilot_events" USING "btree" ("organization_id", "event_type", "received_at" DESC);
CREATE INDEX "idx_copilot_events_correlation" ON "public"."copilot_events" USING "btree" ("correlation_id");

ALTER TABLE "public"."copilot_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "copilot_events_select_own_org" ON "public"."copilot_events"
    FOR SELECT TO "authenticated"
    USING (("organization_id" = "public"."get_user_organization_id"()));

GRANT ALL ON TABLE "public"."copilot_events" TO "authenticated";
GRANT ALL ON TABLE "public"."copilot_events" TO "service_role";

CREATE TABLE IF NOT EXISTS "public"."copilot_interventions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "proposal_id" "uuid",
    "opportunity_id" "text",
    "assigned_agent" "text" NOT NULL,
    "action_mode" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "user_safe_title" "text",
    "user_safe_message" "text",
    "internal_reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "copilot_interventions_action_mode_check" CHECK (("action_mode" = ANY (ARRAY['auto'::"text", 'approval_required'::"text"]))),
    CONSTRAINT "copilot_interventions_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'awaiting_approval'::"text", 'resolved'::"text"])))
);

ALTER TABLE ONLY "public"."copilot_interventions"
    ADD CONSTRAINT "copilot_interventions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."copilot_interventions"
    ADD CONSTRAINT "copilot_interventions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."copilot_events"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."copilot_interventions"
    ADD CONSTRAINT "copilot_interventions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."copilot_interventions"
    ADD CONSTRAINT "copilot_interventions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE SET NULL;

CREATE UNIQUE INDEX "idx_copilot_interventions_event" ON "public"."copilot_interventions" USING "btree" ("event_id");
CREATE INDEX "idx_copilot_interventions_org_status_created" ON "public"."copilot_interventions" USING "btree" ("organization_id", "status", "created_at" DESC);
CREATE INDEX "idx_copilot_interventions_proposal" ON "public"."copilot_interventions" USING "btree" ("proposal_id");

CREATE OR REPLACE TRIGGER "copilot_interventions_updated_at"
    BEFORE UPDATE ON "public"."copilot_interventions"
    FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

ALTER TABLE "public"."copilot_interventions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "copilot_interventions_select_own_org" ON "public"."copilot_interventions"
    FOR SELECT TO "authenticated"
    USING (("organization_id" = "public"."get_user_organization_id"()));

GRANT ALL ON TABLE "public"."copilot_interventions" TO "authenticated";
GRANT ALL ON TABLE "public"."copilot_interventions" TO "service_role";
