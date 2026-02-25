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

/**
 * Attempt to extract a JSON object from an AI response string.
 * Returns the parsed object or null if no valid JSON found.
 */
export function extractJsonFromResponse(response: string): Record<string, unknown> | null {
  // Strategy 1: Markdown code block
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Code block found but content isn't valid JSON — continue to other strategies
    }
  }

  // Strategy 2: Find the outermost { ... } in the response
  const firstBrace = response.indexOf("{");
  const lastBrace = response.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(response.slice(firstBrace, lastBrace + 1));
    } catch {
      // Braces found but not valid JSON — continue
    }
  }

  // Strategy 3: Try parsing the entire response as-is (raw JSON, no wrapper)
  try {
    return JSON.parse(response.trim());
  } catch {
    // Nothing worked
  }

  return null;
}
