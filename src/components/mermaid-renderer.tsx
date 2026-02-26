"use client";

import { useState } from "react";
import { logger } from "@/lib/utils/logger";

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

/**
 * Renders a Mermaid diagram in the browser.
 *
 * Strategy:
 * 1. Primary: mermaid.ink SVG CDN — zero bundle cost, no WASM, no 68MB package.
 *    Encodes the diagram code as base64 and fetches a rendered SVG via <img>.
 * 2. Fallback: Gemini image generation via /api/diagrams/generate.
 * 3. Last resort: show raw code in a styled block.
 *
 * The old approach (bundling the `mermaid` npm package) added 68MB to node_modules
 * and loaded WASM on the client. mermaid.ink handles the same rendering server-side.
 */
export function MermaidRenderer({ chart, className }: MermaidRendererProps) {
  // Build the mermaid.ink URL (base64-encoded diagram definition)
  const encoded =
    typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(chart)))
      : Buffer.from(chart, "utf-8").toString("base64");
  const inkUrl = `https://mermaid.ink/img/${encoded}`;

  const [useFallback, setUseFallback] = useState(false);
  const [geminiImage, setGeminiImage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const handleInkError = async () => {
    logger.warn("mermaid.ink failed, trying Gemini diagram generation");
    setUseFallback(true);

    try {
      const res = await fetch("/api/diagrams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mermaidCode: chart }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.image) {
          setGeminiImage(data.image);
          return;
        }
      }
    } catch (err) {
      logger.error("Gemini diagram generation also failed", err);
    }

    setFailed(true);
  };

  if (failed) {
    return (
      <div className={`rounded-lg border border-[var(--warning-subtle)] bg-[var(--warning-subtle)] p-4 ${className ?? ""}`}>
        <p className="mb-2 text-xs font-medium text-[var(--warning)]">Diagram (raw)</p>
        <pre className="overflow-x-auto text-xs text-[var(--foreground)] font-mono whitespace-pre-wrap">
          {chart}
        </pre>
      </div>
    );
  }

  if (geminiImage) {
    return (
      <div className={`my-4 ${className ?? ""}`}>
        <div className="flex justify-center overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URI from AI generation */}
          <img src={geminiImage} alt="Generated diagram" className="max-w-full h-auto" />
        </div>
      </div>
    );
  }

  if (useFallback) {
    // Waiting for Gemini response — show spinner
    return (
      <div className={`my-4 ${className ?? ""}`}>
        <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)] py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          Rendering diagram...
        </div>
      </div>
    );
  }

  // Primary: mermaid.ink via <img> — no JS, no WASM, no bundle cost
  return (
    <div className={`my-4 ${className ?? ""}`}>
      <div className="flex justify-center overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- external CDN for diagram rendering */}
        <img
          src={inkUrl}
          alt="Mermaid diagram"
          className="max-w-full h-auto"
          onError={handleInkError}
        />
      </div>
    </div>
  );
}
