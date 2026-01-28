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

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current) return;

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
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className || ""}`}>
        <p className="mb-2 text-xs font-medium text-amber-700">Diagram (raw)</p>
        <pre className="overflow-x-auto text-xs text-amber-900 font-mono whitespace-pre-wrap">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div className={`my-4 ${className || ""}`}>
      {!rendered && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          Rendering diagram...
        </div>
      )}
      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto rounded-lg border border-gray-200 bg-white p-4"
      />
    </div>
  );
}
