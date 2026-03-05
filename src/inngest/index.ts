/**
 * Inngest function registry.
 *
 * All Inngest functions must be registered here so the serve
 * endpoint can expose them to the Inngest platform.
 */

import { generateProposalFn } from "./functions/generate-proposal";
import { qualityReviewFn } from "./functions/quality-review";
import { complianceAssessmentFn } from "./functions/compliance-assessment";
import { processDocumentFn } from "./functions/process-document";
import { nurtureCronFn } from "./functions/nurture-cron";

/** All Inngest functions to register with the serve endpoint */
export const functions = [
  generateProposalFn, // @deprecated — legacy wizard only
  qualityReviewFn,
  complianceAssessmentFn,
  processDocumentFn,
  nurtureCronFn,
];
