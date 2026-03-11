/**
 * Event type definitions for Inngest functions.
 *
 * Each event maps to a specific background task trigger.
 * Events carry minimal data (IDs only) — functions fetch
 * full data from the database to avoid stale payloads.
 */

export interface InngestEvents {
  /** Fired after proposal generation completes successfully */
  "proposal/generated": {
    data: {
      proposalId: string;
    };
  };

  /** Trigger quality review (manual or auto-post-generation) */
  "proposal/quality-review.requested": {
    data: {
      proposalId: string;
      trigger: "manual" | "auto_post_generation";
    };
  };

  /** Trigger compliance assessment (manual or auto-post-generation) */
  "proposal/compliance.requested": {
    data: {
      proposalId: string;
      trigger: "manual" | "auto_post_generation";
    };
  };

  /** Trigger document processing (parse + embed) */
  "document/process.requested": {
    data: {
      documentId: string;
    };
  };
}
