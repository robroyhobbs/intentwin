-- ==================
-- PROPOSAL REQUIREMENTS (Compliance Matrix)
-- ==================
-- Stores extracted and manually-added requirements for compliance tracking.
-- Part of IMF Phase 2 (L0: Requirements Truth).

CREATE TABLE IF NOT EXISTS public.proposal_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requirement_text TEXT NOT NULL,
  source_reference TEXT,
  category TEXT NOT NULL DEFAULT 'desirable'
    CHECK (category IN ('mandatory', 'desirable', 'informational')),
  compliance_status TEXT NOT NULL DEFAULT 'not_addressed'
    CHECK (compliance_status IN ('met', 'partially_met', 'not_addressed', 'not_applicable')),
  mapped_section_id UUID REFERENCES public.proposal_sections(id) ON DELETE SET NULL,
  notes TEXT,
  is_extracted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for proposal lookups
CREATE INDEX idx_proposal_requirements_proposal_id
  ON public.proposal_requirements(proposal_id);

-- Enable RLS
ALTER TABLE public.proposal_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can manage requirements for their org's proposals
CREATE POLICY "requirements_select_own_org"
  ON public.proposal_requirements
  FOR SELECT TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "requirements_insert_own_org"
  ON public.proposal_requirements
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "requirements_update_own_org"
  ON public.proposal_requirements
  FOR UPDATE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "requirements_delete_own_org"
  ON public.proposal_requirements
  FOR DELETE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );
