import type {
  OpportunityMatch,
  OpportunityMatchAlertsResponse,
  OpportunityMatchFeedback,
  OpportunityMatchFeedbackStatus,
} from "./types";

interface BuildMatchAlertsInput {
  matches: OpportunityMatch[];
  feedbackByOpportunityId: Record<string, OpportunityMatchFeedback>;
  now?: string | Date;
  highSignalThreshold?: number;
  urgentDeadlineDays?: number;
  maxItemsPerBucket?: number;
}

const DEFAULT_HIGH_SIGNAL_THRESHOLD = 80;
const DEFAULT_URGENT_DEADLINE_DAYS = 10;
const DEFAULT_MAX_ITEMS_PER_BUCKET = 5;

export function buildMatchAlerts(
  input: BuildMatchAlertsInput,
): OpportunityMatchAlertsResponse {
  const now = normalizeNow(input.now);
  const highSignalThreshold =
    input.highSignalThreshold ?? DEFAULT_HIGH_SIGNAL_THRESHOLD;
  const urgentDeadlineDays =
    input.urgentDeadlineDays ?? DEFAULT_URGENT_DEADLINE_DAYS;
  const maxItemsPerBucket =
    input.maxItemsPerBucket ?? DEFAULT_MAX_ITEMS_PER_BUCKET;

  const newHighSignalMatches = input.matches
    .filter((match) => {
      const feedback = input.feedbackByOpportunityId[match.opportunity_id];
      return !feedback && match.score >= highSignalThreshold;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, maxItemsPerBucket)
    .map((match) => ({
      opportunity_id: match.opportunity_id,
      title: match.opportunity.title,
      agency: match.opportunity.agency,
      portal_url: match.opportunity.portal_url,
      response_deadline: match.opportunity.response_deadline,
      score: match.score,
      status: null,
      days_until_deadline: computeDaysUntilDeadline(
        match.opportunity.response_deadline,
        now,
      ),
    }));

  const urgentSavedMatches = input.matches
    .flatMap((match) => {
      const feedback = input.feedbackByOpportunityId[match.opportunity_id];
      if (!isTrackedStatus(feedback?.status)) return [];

      const daysUntilDeadline = computeDaysUntilDeadline(
        match.opportunity.response_deadline,
        now,
      );

      if (
        daysUntilDeadline == null ||
        daysUntilDeadline < 0 ||
        daysUntilDeadline > urgentDeadlineDays
      ) {
        return [];
      }

      return [
        {
          opportunity_id: match.opportunity_id,
          title: match.opportunity.title,
          agency: match.opportunity.agency,
          portal_url: match.opportunity.portal_url,
          response_deadline: match.opportunity.response_deadline,
          score: match.score,
          status: feedback.status,
          days_until_deadline: daysUntilDeadline,
        },
      ];
    })
    .sort((left, right) => {
      const leftDays = left.days_until_deadline ?? Number.MAX_SAFE_INTEGER;
      const rightDays = right.days_until_deadline ?? Number.MAX_SAFE_INTEGER;
      if (leftDays !== rightDays) return leftDays - rightDays;
      return right.score - left.score;
    })
    .slice(0, maxItemsPerBucket);

  return {
    summary: {
      new_high_signal_count: newHighSignalMatches.length,
      urgent_saved_count: urgentSavedMatches.length,
      total_attention_count:
        newHighSignalMatches.length + urgentSavedMatches.length,
      high_signal_threshold: highSignalThreshold,
      urgent_deadline_days: urgentDeadlineDays,
    },
    new_high_signal_matches: newHighSignalMatches,
    urgent_saved_matches: urgentSavedMatches,
  };
}

function normalizeNow(value?: string | Date): Date {
  if (!value) return new Date();
  return value instanceof Date ? value : new Date(value);
}

function computeDaysUntilDeadline(
  value: string | null,
  now: Date,
): number | null {
  if (!value) return null;
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((deadline.getTime() - now.getTime()) / msPerDay);
}

function isTrackedStatus(
  value: OpportunityMatchFeedbackStatus | undefined,
): value is Exclude<OpportunityMatchFeedbackStatus, "dismissed"> {
  return value === "saved" || value === "reviewing" || value === "proposal_started";
}
