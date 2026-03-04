/**
 * Extract JSON from AI-generated text responses.
 *
 * Uses a triple-strategy cascade:
 * 1. Markdown code block extraction (```json ... ```)
 * 2. Outermost brace extraction ({ ... })
 * 3. Raw parse of entire response
 *
 * @module utils/extract-json
 */

function parseObject(candidate: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore parse errors and continue strategy cascade
  }
  return null;
}

function extractWithStrategies(response: string): Record<string, unknown> | null {
  // Strategy 1: Markdown code block
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const fromCodeBlock = parseObject(codeBlockMatch[1].trim());
    if (fromCodeBlock) return fromCodeBlock;
  }

  // Strategy 2: Find the outermost { ... } in the response
  const firstBrace = response.indexOf("{");
  const lastBrace = response.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const fromBraces = parseObject(response.slice(firstBrace, lastBrace + 1));
    if (fromBraces) return fromBraces;
  }

  // Strategy 3: Try parsing the entire response as-is (raw JSON, no wrapper)
  const fromRaw = parseObject(response.trim());
  if (fromRaw) return fromRaw;

  return null;
}

/**
 * Attempt to extract a JSON object from an AI response string.
 * Returns the parsed object or null if no valid JSON found.
 */
export function extractJsonFromResponse(response: string): Record<string, unknown> | null {
  const trimmed = response.trim();
  if (!trimmed) return null;

  const direct = extractWithStrategies(trimmed);
  if (direct) return direct;

  // Strategy 4: Some models return a JSON-encoded string containing JSON.
  // Decode once, then run the same extraction strategies again.
  try {
    const decoded = JSON.parse(trimmed) as unknown;
    if (typeof decoded === "string") {
      return extractWithStrategies(decoded);
    }
    if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
      return decoded as Record<string, unknown>;
    }
  } catch {
    // Not a JSON-encoded string/object
  }

  return null;
}
