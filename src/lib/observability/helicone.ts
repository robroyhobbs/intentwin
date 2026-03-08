/**
 * Helicone Observability Configuration
 *
 * Provides proxy configuration for routing AI provider calls through
 * Helicone's gateway for cost tracking, latency monitoring, and
 * request/response logging.
 *
 * When HELICONE_API_KEY is set, all AI calls are transparently proxied.
 * When unset, all helpers return pass-through values (zero overhead).
 *
 * Supported providers:
 *   - Voyage AI (via fetch URL + headers)
 */

const HELICONE_GATEWAY = "https://gateway.helicone.ai";

function getHeliconeKey(): string | undefined {
  return process.env.HELICONE_API_KEY;
}

/** Whether Helicone observability is active */
function isHeliconeEnabled(): boolean {
  return !!getHeliconeKey();
}

/** Base Helicone headers required on every proxied request */
function baseHeaders(): Record<string, string> {
  const key = getHeliconeKey();
  if (!key) return {};
  return {
    "Helicone-Auth": `Bearer ${key}`,
  };
}

// ── Voyage AI (raw fetch) ──

/** Voyage API URL — proxied through Helicone when enabled */
export function voyageApiUrl(): string {
  if (!isHeliconeEnabled()) return "https://api.voyageai.com/v1/embeddings";
  return `${HELICONE_GATEWAY}/v1/embeddings`;
}

/** Extra headers for Voyage fetch calls */
export function voyageHeliconeHeaders(): Record<string, string> {
  if (!isHeliconeEnabled()) return {};
  return {
    ...baseHeaders(),
    "Helicone-Target-Url": "https://api.voyageai.com",
    "Helicone-Target-Provider": "VoyageAI",
  };
}
