-- Add win strategy / outcomes data column to proposals
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS win_strategy_data jsonb DEFAULT '{}';

-- Add comment explaining the JSONB structure
COMMENT ON COLUMN public.proposals.win_strategy_data IS 'IDD outcome-focused workflow data: win_themes, success_metrics, differentiators, target_outcomes';
