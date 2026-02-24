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
 *   - Google Gemini (via baseUrl + customHeaders)
 *   - OpenAI (via baseURL + defaultHeaders)
 *   - Groq (via baseURL + defaultHeaders)
 *   - Mistral (via serverURL + customHeaders)
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

// ── Google Gemini ──

/** Gemini SDK RequestOptions for Helicone proxy */
export function geminiHeliconeOptions(): {
  baseUrl?: string;
  customHeaders?: Record<string, string>;
} {
  if (!isHeliconeEnabled()) return {};
  return {
    baseUrl: HELICONE_GATEWAY,
    customHeaders: {
      ...baseHeaders(),
      "Helicone-Target-Url": "https://generativelanguage.googleapis.com",
      "Helicone-Target-Provider": "Google",
    },
  };
}

// ── OpenAI ──

/** OpenAI SDK constructor options for Helicone proxy */
export function openaiHeliconeOptions(): {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
} {
  if (!isHeliconeEnabled()) return {};
  return {
    baseURL: "https://oai.helicone.ai/v1",
    defaultHeaders: baseHeaders(),
  };
}

// ── Groq ──

/** Groq SDK constructor options for Helicone proxy */
export function groqHeliconeOptions(): {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
} {
  if (!isHeliconeEnabled()) return {};
  return {
    baseURL: "https://groq.helicone.ai/openai/v1",
    defaultHeaders: baseHeaders(),
  };
}

// ── Mistral ──

/** Mistral SDK constructor options for Helicone proxy */
export function mistralHeliconeOptions(): {
  serverURL?: string;
  customHeaders?: Record<string, string>;
} {
  if (!isHeliconeEnabled()) return {};
  return {
    serverURL: "https://mistral.helicone.ai",
    // Mistral SDK doesn't support defaultHeaders; we add via fetch interceptor
    // But the Mistral JS SDK v1.14+ passes extraHeaders on requests
  };
}

/** Mistral extra headers for Helicone (passed per-request) */
function mistralHeliconeHeaders(): Record<string, string> {
  if (!isHeliconeEnabled()) return {};
  return baseHeaders();
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

// ── Custom Properties ──

/**
 * Build Helicone custom property headers for request tagging.
 * These appear in the Helicone dashboard for filtering/grouping.
 */
function heliconeProperties(props: {
  organizationId?: string;
  proposalId?: string;
  sectionType?: string;
  operation?: string;
}): Record<string, string> {
  if (!isHeliconeEnabled()) return {};
  const headers: Record<string, string> = {};
  if (props.organizationId) {
    headers["Helicone-Property-OrganizationId"] = props.organizationId;
  }
  if (props.proposalId) {
    headers["Helicone-Property-ProposalId"] = props.proposalId;
  }
  if (props.sectionType) {
    headers["Helicone-Property-SectionType"] = props.sectionType;
  }
  if (props.operation) {
    headers["Helicone-Property-Operation"] = props.operation;
  }
  return headers;
}
