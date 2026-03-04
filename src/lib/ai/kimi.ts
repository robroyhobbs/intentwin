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

function resolveKimiModel(explicit?: string): string {
  return explicit || process.env.KIMI_MODEL?.trim() || "kimi-k2-thinking";
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
    throw new Error(providerMessage);
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
