import { Inngest } from "inngest";

/**
 * Shared Inngest client for IntentBid.
 *
 * All background task functions (proposal generation, quality review,
 * compliance assessment, document processing, etc.) use this client
 * to define durable workflow functions and send events.
 *
 * Environment variables:
 * - INNGEST_EVENT_KEY: Required in production for sending events
 * - INNGEST_SIGNING_KEY: Required in production for verifying webhook signatures
 */
export const inngest = new Inngest({ id: "intentbid" });
