"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

export function MermaidRenderer({ chart, className }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [geminiImage, setGeminiImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current) return;

      // Try Mermaid first
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          fontFamily: "Inter, system-ui, sans-serif",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setRendered(true);
          setLoading(false);
        }
        return;
      } catch (mermaidErr) {
        console.warn("Mermaid render failed, trying Gemini:", mermaidErr);
      }

      // Fall back to Gemini image generation
      try {
        const res = await fetch("/api/diagrams/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mermaidCode: chart }),
        });

        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.image) {
            setGeminiImage(data.image);
            setRendered(true);
            setLoading(false);
            return;
          }
        }
      } catch (geminiErr) {
        console.error("Gemini diagram generation failed:", geminiErr);
      }

      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded-lg border border-[var(--warning-subtle)] bg-[var(--warning-subtle)] p-4 ${className || ""}`}>
        <p className="mb-2 text-xs font-medium text-[var(--warning)]">Diagram (raw)</p>
        <pre className="overflow-x-auto text-xs text-[var(--foreground)] font-mono whitespace-pre-wrap">
          {chart}
        </pre>
      </div>
    );
  }

  if (geminiImage) {
    return (
      <div className={`my-4 ${className || ""}`}>
        <div className="flex justify-center overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <img src={geminiImage} alt="Generated diagram" className="max-w-full h-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className={`my-4 ${className || ""}`}>
      {loading && (
        <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)] py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          Rendering diagram...
        </div>
      )}
      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4"
      />
    </div>
  );
}
