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

function parseObjectOrArray(candidate: string): Record<string, unknown> | null {
  const object = parseObject(candidate);
  if (object) return object;

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (Array.isArray(parsed)) {
      const firstObject = parsed.find(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item),
      );
      return firstObject ?? null;
    }
  } catch {
    // Ignore parse errors and continue strategy cascade
  }

  return null;
}

function extractBalancedJsonObject(
  response: string,
): Record<string, unknown> | null {
  for (let start = 0; start < response.length; start++) {
    if (response[start] !== "{") continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < response.length; i++) {
      const ch = response[i];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === "\"") {
          inString = false;
        }
        continue;
      }

      if (ch === "\"") {
        inString = true;
        continue;
      }

      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          const candidate = response.slice(start, i + 1).trim();
          const parsed = parseObject(candidate);
          if (parsed) return parsed;
          break;
        }
      }
    }
  }

  return null;
}

function extractWithStrategies(response: string): Record<string, unknown> | null {
  // Strategy 1: Markdown code block
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const fromCodeBlock = parseObjectOrArray(codeBlockMatch[1].trim());
    if (fromCodeBlock) return fromCodeBlock;
  }

  // Strategy 2: Find and parse any balanced JSON object in mixed text
  const fromBalancedObject = extractBalancedJsonObject(response);
  if (fromBalancedObject) return fromBalancedObject;

  // Strategy 3: Find the outermost { ... } in the response
  const firstBrace = response.indexOf("{");
  const lastBrace = response.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const fromBraces = parseObjectOrArray(
      response.slice(firstBrace, lastBrace + 1),
    );
    if (fromBraces) return fromBraces;
  }

  // Strategy 4: Try parsing the entire response as-is (raw JSON, no wrapper)
  const fromRaw = parseObjectOrArray(response.trim());
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
    if (Array.isArray(decoded)) {
      const firstObject = decoded.find(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item),
      );
      return firstObject ?? null;
    }
    if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
      return decoded as Record<string, unknown>;
    }
  } catch {
    // Not a JSON-encoded string/object
  }

  return null;
}
