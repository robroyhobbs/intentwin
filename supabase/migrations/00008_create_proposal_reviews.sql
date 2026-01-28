-- Create proposal_reviews table for team review annotations
CREATE TABLE IF NOT EXISTS public.proposal_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  section_id uuid REFERENCES public.proposal_sections(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewer_email text,
  annotation_type text DEFAULT 'comment' CHECK (annotation_type IN ('comment', 'suggestion', 'approval', 'rejection')),
  content text NOT NULL,
  selector_data jsonb DEFAULT '{}',
  selected_text text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_proposal ON public.proposal_reviews(proposal_id);
CREATE INDEX IF NOT EXISTS idx_reviews_section ON public.proposal_reviews(section_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.proposal_reviews(status);

-- RLS
ALTER TABLE public.proposal_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews for their proposals" ON public.proposal_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.proposal_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reviews" ON public.proposal_reviews
  FOR UPDATE USING (reviewer_id = auth.uid());
