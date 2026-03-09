"use client";

import { useState, useMemo } from "react";
import type { ProductAlignmentScore, ProductAlignmentResult } from "@/lib/ai/pipeline/product-alignment";

interface ProductAlignmentPanelProps {
  alignment: ProductAlignmentResult;
  onToggleProduct?: (productId: string, enabled: boolean) => void;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 60 ? "bg-green-500" : score >= 30 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[var(--foreground-muted)]">
        {score}%
      </span>
    </div>
  );
}

function ProductRow({
  product,
  onToggle,
}: {
  product: ProductAlignmentScore;
  onToggle?: (id: string, enabled: boolean) => void;
}) {
  const [showCaps, setShowCaps] = useState(false);

  return (
    <div className="border-b border-[var(--border)] last:border-b-0 py-2 px-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggle?.(product.productId, !product.enabled)}
            className={`shrink-0 w-5 h-5 rounded border text-xs flex items-center justify-center transition-colors ${
              product.enabled
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-gray-300 dark:border-gray-600 text-transparent"
            }`}
            aria-label={`${product.enabled ? "Disable" : "Enable"} ${product.productName}`}
          >
            {product.enabled ? "✓" : ""}
          </button>
          <div className="min-w-0">
            <span className="text-sm font-medium truncate block">
              {product.productName}
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">
              {product.serviceLine}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ScoreBar score={product.score} />
          {(product.matchedCapabilities.length > 0 ||
            product.unmatchedCapabilities.length > 0) && (
            <button
              type="button"
              onClick={() => setShowCaps(!showCaps)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {showCaps ? "Hide" : "Details"}
            </button>
          )}
        </div>
      </div>

      {showCaps && (
        <div className="mt-2 ml-7 text-xs space-y-1">
          {product.matchedCapabilities.length > 0 && (
            <div>
              <span className="font-medium text-green-600 dark:text-green-400">
                Matched:
              </span>{" "}
              {product.matchedCapabilities.join(", ")}
            </div>
          )}
          {product.unmatchedCapabilities.length > 0 && (
            <div>
              <span className="font-medium text-[var(--foreground-muted)]">
                Unmatched:
              </span>{" "}
              {product.unmatchedCapabilities.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductAlignmentPanel({
  alignment,
  onToggleProduct,
}: ProductAlignmentPanelProps) {
  const [collapsed, setCollapsed] = useState(true);

  const enabledCount = useMemo(
    () => alignment.products.filter((p) => p.enabled).length,
    [alignment.products],
  );

  if (!alignment.hasProducts) {
    return (
      <div className="rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--foreground-muted)]">
        No products configured.{" "}
        <a href="/settings/company" className="text-blue-600 underline">
          Configure products in Settings
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--background-secondary)] hover:bg-[var(--background-hover)] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Product Alignment</span>
          <span className="text-xs text-[var(--foreground-muted)]">
            {enabledCount}/{alignment.products.length} enabled
          </span>
        </div>
        <span className="text-xs text-[var(--foreground-muted)]">
          {collapsed ? "▸" : "▾"}
        </span>
      </button>

      {!collapsed && (
        <div className="px-2 py-1">
          {alignment.products.map((product) => (
            <ProductRow
              key={product.productId}
              product={product}
              onToggle={onToggleProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
}
