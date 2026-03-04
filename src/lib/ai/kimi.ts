import { logger } from "@/lib/utils/logger";

export interface KimiGenerateOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  jsonMode?: boolean;
}

interface KimiMessage {
  role: "system" | "user";
  content: string;
}

interface KimiResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: { message?: string };
}

interface KimiCircuitState {
  consecutiveFailures: number;
  disabledUntil: number;
  lastReason: string | null;
}

interface KimiFailureResult {
  opened: boolean;
  permanent: boolean;
  reason: string;
  disabledUntil: number;
}

const DEFAULT_TRANSIENT_FAILURE_THRESHOLD = 3;
const DEFAULT_TRANSIENT_COOLDOWN_MS = 5 * 60 * 1000;
const DEFAULT_PERMANENT_COOLDOWN_MS = 60 * 60 * 1000;

const kimiCircuitState: KimiCircuitState = {
  consecutiveFailures: 0,
  disabledUntil: 0,
  lastReason: null,
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getTransientFailureThreshold(): number {
  return parsePositiveInt(
    process.env.KIMI_CIRCUIT_FAILURE_THRESHOLD,
    DEFAULT_TRANSIENT_FAILURE_THRESHOLD,
  );
}

function getTransientCooldownMs(): number {
  return parsePositiveInt(
    process.env.KIMI_CIRCUIT_COOLDOWN_MS,
    DEFAULT_TRANSIENT_COOLDOWN_MS,
  );
}

function getPermanentCooldownMs(): number {
  return parsePositiveInt(
    process.env.KIMI_PERMANENT_CIRCUIT_COOLDOWN_MS,
    DEFAULT_PERMANENT_COOLDOWN_MS,
  );
}

function classifyKimiFailureReason(message: string): {
  permanent: boolean;
  reason: string;
} {
  const lower = message.toLowerCase();
  const permanent =
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("invalid api key") ||
    lower.includes("unknown model") ||
    lower.includes("model not found") ||
    lower.includes("does not exist");

  return {
    permanent,
    reason: permanent ? "permanent_provider_error" : "transient_provider_error",
  };
}

function resolveKimiModel(explicit?: string): string {
  return explicit || process.env.KIMI_MODEL?.trim() || "kimi-k2-thinking";
}

export function getKimiCircuitState(now = Date.now()): {
  isOpen: boolean;
  disabledUntil: number;
  consecutiveFailures: number;
  lastReason: string | null;
} {
  return {
    isOpen: kimiCircuitState.disabledUntil > now,
    disabledUntil: kimiCircuitState.disabledUntil,
    consecutiveFailures: kimiCircuitState.consecutiveFailures,
    lastReason: kimiCircuitState.lastReason,
  };
}

export function canUseKimi(now = Date.now()): boolean {
  if (!process.env.KIMI_API_KEY?.trim()) return false;
  return !getKimiCircuitState(now).isOpen;
}

export function recordKimiSuccess(): void {
  kimiCircuitState.consecutiveFailures = 0;
  kimiCircuitState.disabledUntil = 0;
  kimiCircuitState.lastReason = null;
}

export function recordKimiFailure(error: unknown, now = Date.now()): KimiFailureResult {
  const message =
    error instanceof Error ? error.message : String(error || "Unknown Kimi error");
  const classification = classifyKimiFailureReason(message);

  kimiCircuitState.consecutiveFailures += 1;
  kimiCircuitState.lastReason = classification.reason;

  const shouldOpenCircuit =
    classification.permanent ||
    kimiCircuitState.consecutiveFailures >= getTransientFailureThreshold();

  if (shouldOpenCircuit) {
    const cooldown = classification.permanent
      ? getPermanentCooldownMs()
      : getTransientCooldownMs();
    kimiCircuitState.disabledUntil = now + cooldown;
  }

  return {
    opened: shouldOpenCircuit,
    permanent: classification.permanent,
    reason: classification.reason,
    disabledUntil: kimiCircuitState.disabledUntil,
  };
}

export function resetKimiCircuitStateForTests(): void {
  kimiCircuitState.consecutiveFailures = 0;
  kimiCircuitState.disabledUntil = 0;
  kimiCircuitState.lastReason = null;
}

export async function generateKimiText(
  prompt: string,
  options: KimiGenerateOptions = {},
): Promise<string> {
  const apiKey = process.env.KIMI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("KIMI_API_KEY is not set");
  }

  const baseUrl = (
    process.env.KIMI_BASE_URL?.trim() || "https://api.moonshot.ai/v1"
  ).replace(/\/$/, "");
  const endpoint = `${baseUrl}/chat/completions`;
  const model = resolveKimiModel(options.model);

  const messages: KimiMessage[] = [
    ...(options.systemPrompt
      ? [{ role: "system" as const, content: options.systemPrompt }]
      : []),
    { role: "user", content: prompt },
  ];

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    stream: false,
  };

  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let data: KimiResponse | null = null;
  try {
    data = (await response.json()) as KimiResponse;
  } catch {
    // Keep null; handled below with status-only error.
  }

  if (!response.ok) {
    const providerMessage =
      data?.error?.message || `Kimi API request failed (${response.status})`;
    logger.warn("[AI] Kimi request failed", {
      status: response.status,
      message: providerMessage.slice(0, 200),
    });
    throw new Error(`KIMI_HTTP_${response.status}: ${providerMessage}`);
  }

  const rawContent = data?.choices?.[0]?.message?.content;
  const text =
    typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((item) => item.text || "").join("").trim()
        : "";

  if (!text) {
    throw new Error("Kimi returned empty response");
  }

  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
