/**
 * Server-side conversion of Mermaid diagram code to SVG.
 * Uses the mermaid.ink public API for rendering.
 */

/**
 * Converts mermaid code to an SVG string via the mermaid.ink API.
 * Falls back to null if rendering fails.
 */
export async function mermaidToSvg(
  mermaidCode: string
): Promise<string | null> {
  try {
    // Base64-encode the mermaid definition
    const encoded = Buffer.from(mermaidCode, "utf-8").toString("base64");
    const url = `https://mermaid.ink/svg/${encoded}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(
        `Mermaid.ink returned ${response.status} for diagram`,
        mermaidCode.slice(0, 80)
      );
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error("Failed to convert mermaid to SVG:", error);
    return null;
  }
}

/**
 * Batch convert multiple mermaid blocks to SVGs.
 * Returns a Map of mermaid code → SVG string (or null on failure).
 */
export async function batchMermaidToSvg(
  mermaidBlocks: string[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  const promises = mermaidBlocks.map(async (code) => {
    const svg = await mermaidToSvg(code);
    results.set(code, svg);
  });
  await Promise.all(promises);
  return results;
}
