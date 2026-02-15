import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = "IntentWin <notifications@intentwin.com>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://intentwin.com";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function sendReviewerAssignedEmail(params: {
  reviewerEmail: string;
  reviewerName: string;
  proposalTitle: string;
  proposalId: string;
  stage: string;
}): Promise<void> {
  try {
    if (!resend) {
      console.warn(
        "[REVIEW-EMAIL] RESEND_API_KEY not configured — skipping reviewer assigned email",
      );
      return;
    }

    if (!params.reviewerEmail) {
      console.warn(
        "[REVIEW-EMAIL] No reviewer email provided — skipping",
      );
      return;
    }

    const stageName = capitalize(params.stage);
    const proposalLink = `${BASE_URL}/proposals/${params.proposalId}?tab=review`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.reviewerEmail,
      subject: `You've been assigned to review: ${params.proposalTitle} (${stageName} Team)`,
      text: [
        `Hi ${params.reviewerName},`,
        "",
        `You've been assigned to review "${params.proposalTitle}" as part of the ${stageName} Team.`,
        "",
        `Review the proposal here:`,
        proposalLink,
        "",
        "— IntentWin",
      ].join("\n"),
    });

    if (error) {
      console.error(
        "[REVIEW-EMAIL] Failed to send reviewer assigned email:",
        error,
      );
      return;
    }

    console.log(
      `[REVIEW-EMAIL] Reviewer assigned email sent to ${params.reviewerEmail}`,
    );
  } catch (err) {
    console.error(
      "[REVIEW-EMAIL] Unexpected error sending reviewer assigned email:",
      err,
    );
  }
}

export async function sendStageCompleteEmail(params: {
  ownerEmail: string;
  ownerName: string;
  proposalTitle: string;
  proposalId: string;
  stage: string;
  avgScore: number;
  sectionsReviewed: number;
}): Promise<void> {
  try {
    if (!resend) {
      console.warn(
        "[REVIEW-EMAIL] RESEND_API_KEY not configured — skipping stage complete email",
      );
      return;
    }

    if (!params.ownerEmail) {
      console.warn(
        "[REVIEW-EMAIL] No owner email provided — skipping",
      );
      return;
    }

    const stageName = capitalize(params.stage);
    const proposalLink = `${BASE_URL}/proposals/${params.proposalId}?tab=review`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.ownerEmail,
      subject: `${stageName} Team Review Complete — ${params.proposalTitle}`,
      text: [
        `Hi ${params.ownerName},`,
        "",
        `The ${stageName} Team review for "${params.proposalTitle}" is complete.`,
        "",
        `Average Score: ${params.avgScore}`,
        `Sections Reviewed: ${params.sectionsReviewed}`,
        "",
        `View the full review:`,
        proposalLink,
        "",
        "— IntentWin",
      ].join("\n"),
    });

    if (error) {
      console.error(
        "[REVIEW-EMAIL] Failed to send stage complete email:",
        error,
      );
      return;
    }

    console.log(
      `[REVIEW-EMAIL] Stage complete email sent to ${params.ownerEmail}`,
    );
  } catch (err) {
    console.error(
      "[REVIEW-EMAIL] Unexpected error sending stage complete email:",
      err,
    );
  }
}

export async function sendStageAdvancedEmail(params: {
  reviewers: Array<{ email: string; name: string }>;
  proposalTitle: string;
  proposalId: string;
  newStage: string;
}): Promise<void> {
  try {
    if (!resend) {
      console.warn(
        "[REVIEW-EMAIL] RESEND_API_KEY not configured — skipping stage advanced email",
      );
      return;
    }

    const stageName = capitalize(params.newStage);
    const proposalLink = `${BASE_URL}/proposals/${params.proposalId}?tab=review`;

    const validReviewers = params.reviewers.filter((r) => r.email);

    for (const reviewer of validReviewers) {
      try {
        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: reviewer.email,
          subject: `Your ${stageName} Team review is ready: ${params.proposalTitle}`,
          text: [
            `Hi ${reviewer.name},`,
            "",
            `"${params.proposalTitle}" has advanced to the ${stageName} Team and is ready for your review.`,
            "",
            `Start your review here:`,
            proposalLink,
            "",
            "— IntentWin",
          ].join("\n"),
        });

        if (error) {
          console.error(
            `[REVIEW-EMAIL] Failed to send stage advanced email to ${reviewer.email}:`,
            error,
          );
          continue;
        }

        console.log(
          `[REVIEW-EMAIL] Stage advanced email sent to ${reviewer.email}`,
        );
      } catch (err) {
        console.error(
          `[REVIEW-EMAIL] Unexpected error sending stage advanced email to ${reviewer.email}:`,
          err,
        );
      }
    }
  } catch (err) {
    console.error(
      "[REVIEW-EMAIL] Unexpected error in sendStageAdvancedEmail:",
      err,
    );
  }
}
