"use client";

import { useState, type CSSProperties } from "react";

export function ExpandableText({
  text,
  lines = 2,
  className,
}: {
  text: string;
  lines?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = text.length > 150;
  const clampedStyle: CSSProperties | undefined =
    canExpand && !expanded
      ? {
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }
      : undefined;

  return (
    <div>
      <p className={className} style={clampedStyle}>
        {text}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
