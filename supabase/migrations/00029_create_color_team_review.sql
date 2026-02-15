-- ==================
-- COLOR TEAM REVIEW WORKFLOW
-- ==================
-- Implements the government proposal standard review process:
-- Pink (Storyboard) → Red (Final Draft) → Gold (Executive) → White (Production)

-- Review stages configuration per proposal
CREATE TABLE IF NOT EXISTS public.proposal_review_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('pink', 'red', 'gold', 'white')),
  stage_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, stage)
);

-- Index for proposal lookups
CREATE INDEX idx_review_stages_proposal_id
  ON public.proposal_review_stages(proposal_id);

-- Reviewer assignments per stage
CREATE TABLE IF NOT EXISTS public.stage_reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.proposal_review_stages(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(stage_id, reviewer_id)
);

-- Indexes for stage and reviewer lookups
CREATE INDEX idx_stage_reviewers_stage_id
  ON public.stage_reviewers(stage_id);
CREATE INDEX idx_stage_reviewers_reviewer_id
  ON public.stage_reviewers(reviewer_id);

-- Per-section review scores and comments
CREATE TABLE IF NOT EXISTS public.section_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.proposal_review_stages(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.stage_reviewers(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.proposal_sections(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  comment TEXT,
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, section_id)
);

-- Indexes for section review lookups
CREATE INDEX idx_section_reviews_stage_id
  ON public.section_reviews(stage_id);
CREATE INDEX idx_section_reviews_reviewer_id
  ON public.section_reviews(reviewer_id);
CREATE INDEX idx_section_reviews_section_id
  ON public.section_reviews(section_id);

-- Updated_at trigger for section_reviews
CREATE OR REPLACE FUNCTION update_section_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER section_reviews_updated_at
  BEFORE UPDATE ON public.section_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_section_reviews_updated_at();

-- ==================
-- RLS POLICIES
-- ==================

-- proposal_review_stages RLS
ALTER TABLE public.proposal_review_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_stages_select_own_org"
  ON public.proposal_review_stages
  FOR SELECT TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "review_stages_insert_own_org"
  ON public.proposal_review_stages
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "review_stages_update_own_org"
  ON public.proposal_review_stages
  FOR UPDATE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "review_stages_delete_own_org"
  ON public.proposal_review_stages
  FOR DELETE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- stage_reviewers RLS
ALTER TABLE public.stage_reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stage_reviewers_select_own_org"
  ON public.stage_reviewers
  FOR SELECT TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "stage_reviewers_insert_own_org"
  ON public.stage_reviewers
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "stage_reviewers_update_own_org"
  ON public.stage_reviewers
  FOR UPDATE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "stage_reviewers_delete_own_org"
  ON public.stage_reviewers
  FOR DELETE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- section_reviews RLS
ALTER TABLE public.section_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "section_reviews_select_own_org"
  ON public.section_reviews
  FOR SELECT TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "section_reviews_insert_own_org"
  ON public.section_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "section_reviews_update_own_org"
  ON public.section_reviews
  FOR UPDATE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "section_reviews_delete_own_org"
  ON public.section_reviews
  FOR DELETE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );
