/**
 * Server-side conversion of Mermaid diagram code to images.
 * Uses Gemini image generation, with mermaid.ink SVG as fallback.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/utils/logger";
import { geminiHeliconeOptions } from "@/lib/observability/helicone";

const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

/**
 * Converts mermaid code to an image via Gemini image generation.
 * Falls back to mermaid.ink SVG, then to null if both fail.
 * Returns { type: "image", data: "data:image/png;base64,..." } or { type: "svg", data: "<svg>..." } or null.
 */
export async function mermaidToImage(
  mermaidCode: string,
): Promise<{ type: "svg" | "image"; data: string } | null> {
  // Try Gemini image generation first
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const heliconeOpts = geminiHeliconeOptions();
      const model = genAI.getGenerativeModel(
        {
          model: IMAGE_MODEL,
          generationConfig: {
            // @ts-expect-error -- Gemini image generation uses responseModalities
            responseModalities: ["image", "text"],
          },
        },
        heliconeOpts,
      );

      const prompt = `Create a clean, professional technical diagram based on this Mermaid diagram definition.
Use a modern, minimal style with a white background, clean lines, rounded rectangles for nodes, and a professional blue/gray color scheme.
Make it look like a high-quality consulting deliverable diagram.

Mermaid definition:
${mermaidCode}`;

      const result = await model.generateContent(prompt);
      const parts = result.response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p: { inlineData?: unknown }) => p.inlineData);

      if (imagePart?.inlineData) {
        const { mimeType, data } = imagePart.inlineData;
        return { type: "image", data: `data:${mimeType};base64,${data}` };
      }
    } catch (err) {
      logger.warn("Gemini diagram generation failed, falling back to mermaid.ink", { detail: err });
    }
  }

  // Fallback to mermaid.ink SVG
  try {
    const encoded = Buffer.from(mermaidCode, "utf-8").toString("base64");
    const url = `https://mermaid.ink/svg/${encoded}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const svg = await response.text();
      return { type: "svg", data: svg };
    }

    logger.error(`Mermaid.ink returned ${response.status} for diagram`, { detail: mermaidCode.slice(0, 80) });
  } catch (error) {
    logger.error("Mermaid.ink fallback also failed", error);
  }

  return null;
}

/**
 * Batch convert multiple mermaid blocks to images.
 * Returns a Map of mermaid code → result (or null on failure).
 */
export async function batchMermaidToImages(
  mermaidBlocks: string[],
): Promise<Map<string, { type: "svg" | "image"; data: string } | null>> {
  const results = new Map<string, { type: "svg" | "image"; data: string } | null>();
  // Process sequentially to avoid Gemini rate limits
  for (const code of mermaidBlocks) {
    const result = await mermaidToImage(code);
    results.set(code, result);
  }
  return results;
}


