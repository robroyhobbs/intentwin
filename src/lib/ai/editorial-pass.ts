import { generateText } from "./gemini";
import { BANNED_PHRASES } from "./prompts/editorial-standards";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger({ operation: "editorialPass" });

/**
 * Editorial pass prompt.
 * Takes raw AI-generated section content and rewrites it for quality,
 * formatting, and accuracy. This is a fast rewrite pass — not a full
 * re-generation. The editor preserves all factual content but improves
 * structure, removes fluff, and enforces formatting standards.
 */
function buildEditorialPrompt(
  sectionType: string,
  sectionTitle: string,
  rawContent: string,
  companyName: string,
): string {
  return `You are a senior proposal editor. Your job is to take a draft proposal section and make it presentation-ready.

## YOUR ROLE
You are NOT a writer — you are an EDITOR. The content and claims are already written. Your job is to:
1. Improve formatting for executive readability
2. Cut fluff and filler
3. Tighten language
4. Flag unsupported claims
5. Ensure the structure is scannable

## SECTION TO EDIT
**Section**: ${sectionTitle} (${sectionType})
**Company**: ${companyName}

---
${rawContent}
---

## EDITING RULES

### Formatting
- Maximum 3 sentences per paragraph. Break longer paragraphs into bullets.
- Every bullet must have a **bold lead-in** followed by a colon.
- Tables must have clear headers and aligned columns.
- Ensure proper heading hierarchy (## then ### — never skip levels).
- Add blank lines between all sections for white space.
- Blockquotes (> ) for key metrics, statistics, or evidence citations.

### Cutting Fluff
- Delete any sentence that a competitor could say verbatim about themselves.
- Delete throat-clearing phrases: "It is worth noting", "It should be mentioned", "In order to".
- Delete filler adjectives: "comprehensive", "innovative", "significant", "extensive" unless followed by a specific number.
- If a sentence says "we have experience in X", it must be followed by evidence (numbers, case study, certification). If not, either add context from what's available or mark it with [NEEDS EVIDENCE].

### Banned Phrases
Replace these with specific, concrete language: ${BANNED_PHRASES.slice(0, 15).join(", ")}

### Accuracy
- If a claim references a metric or case study, verify it appears in the content above. If it looks fabricated (round numbers with no source, generic percentages), mark it with [VERIFY].
- Do NOT add new claims or metrics that aren't in the original draft.

### Voice
- Active voice throughout. "We will deliver" not "It will be delivered."
- Client-first framing. Start with client need, then solution.
- Confident but not arrogant. Show, don't tell.

## OUTPUT
Return ONLY the edited section content in markdown. Do not include explanations, commentary, or editing notes.
Preserve all Mermaid diagrams exactly as-is (do not modify mermaid code blocks).
Preserve all tables (you may reformat for clarity but do not remove data).
If you add [NEEDS EVIDENCE] or [VERIFY] tags, keep them in the output — they will be surfaced to the user.`;
}

/**
 * Run an editorial pass on generated section content.
 * Returns the edited content, or the original if the editorial pass fails.
 *
 * Uses a lower temperature (0.3) for consistency — this is editing, not creating.
 * Uses a smaller max token budget since editing typically shortens content.
 */
export async function runEditorialPass(
  sectionType: string,
  sectionTitle: string,
  rawContent: string,
  companyName: string,
  systemPrompt?: string,
): Promise<string> {
  // Skip editorial pass if content is very short (likely already concise)
  if (rawContent.length < 200) {
    return rawContent;
  }

  try {
    const editorialPrompt = buildEditorialPrompt(
      sectionType,
      sectionTitle,
      rawContent,
      companyName,
    );

    const editedContent = await generateText(editorialPrompt, {
      systemPrompt:
        systemPrompt ||
        "You are a senior proposal editor focused on clarity, precision, and executive readability. You edit for impact, not word count.",
      temperature: 0.3,
      maxTokens: 4096,
    });

    // Sanity check: editorial pass should not drastically change length
    // If it cut more than 60% or grew more than 50%, something went wrong
    const ratio = editedContent.length / rawContent.length;
    if (ratio < 0.4 || ratio > 1.5) {
      log.warn("Editorial pass produced unexpected length change", {
        sectionType,
        originalLength: rawContent.length,
        editedLength: editedContent.length,
        ratio: ratio.toFixed(2),
      });
      // Still return the edited content — the ratio check is advisory
    }

    log.info("Editorial pass completed", {
      sectionType,
      originalLength: rawContent.length,
      editedLength: editedContent.length,
      reduction: `${Math.round((1 - ratio) * 100)}%`,
    });

    return editedContent;
  } catch (err) {
    // Editorial pass is non-critical — if it fails, return original content
    log.warn("Editorial pass failed, using original content", {
      sectionType,
      error: err instanceof Error ? err.message : String(err),
    });
    return rawContent;
  }
}
