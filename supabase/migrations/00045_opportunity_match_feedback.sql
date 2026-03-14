CREATE TABLE IF NOT EXISTS "public"."opportunity_match_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "opportunity_id" "text" NOT NULL,
    "source" "text" NOT NULL,
    "title" "text" NOT NULL,
    "agency" "text",
    "portal_url" "text",
    "status" "text" NOT NULL,
    "proposal_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "opportunity_match_feedback_status_check"
      CHECK (("status" = ANY (ARRAY['saved'::"text", 'reviewing'::"text", 'proposal_started'::"text", 'dismissed'::"text"])))
);

ALTER TABLE ONLY "public"."opportunity_match_feedback"
    ADD CONSTRAINT "opportunity_match_feedback_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."opportunity_match_feedback"
    ADD CONSTRAINT "opportunity_match_feedback_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."opportunity_match_feedback"
    ADD CONSTRAINT "opportunity_match_feedback_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."opportunity_match_feedback"
    ADD CONSTRAINT "opportunity_match_feedback_proposal_id_fkey"
    FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE SET NULL;

CREATE UNIQUE INDEX "idx_opportunity_match_feedback_org_opportunity"
    ON "public"."opportunity_match_feedback" USING "btree" ("organization_id", "opportunity_id");

CREATE INDEX "idx_opportunity_match_feedback_org_status_updated"
    ON "public"."opportunity_match_feedback" USING "btree" ("organization_id", "status", "updated_at" DESC);

CREATE OR REPLACE TRIGGER "opportunity_match_feedback_updated_at"
    BEFORE UPDATE ON "public"."opportunity_match_feedback"
    FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

ALTER TABLE "public"."opportunity_match_feedback" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunity_match_feedback_select_own_org"
    ON "public"."opportunity_match_feedback"
    FOR SELECT TO "authenticated"
    USING (("organization_id" = "public"."get_user_organization_id"()));

CREATE POLICY "opportunity_match_feedback_insert_own_org"
    ON "public"."opportunity_match_feedback"
    FOR INSERT TO "authenticated"
    WITH CHECK (("organization_id" = "public"."get_user_organization_id"()));

CREATE POLICY "opportunity_match_feedback_update_own_org"
    ON "public"."opportunity_match_feedback"
    FOR UPDATE TO "authenticated"
    USING (("organization_id" = "public"."get_user_organization_id"()))
    WITH CHECK (("organization_id" = "public"."get_user_organization_id"()));

CREATE POLICY "opportunity_match_feedback_delete_own_org"
    ON "public"."opportunity_match_feedback"
    FOR DELETE TO "authenticated"
    USING (("organization_id" = "public"."get_user_organization_id"()));

GRANT ALL ON TABLE "public"."opportunity_match_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."opportunity_match_feedback" TO "service_role";
