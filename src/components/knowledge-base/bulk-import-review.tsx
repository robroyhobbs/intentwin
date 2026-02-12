"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  Package,
  Award,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedCompanyContext {
  category: string;
  key: string;
  title: string;
  content: string;
  isConflict: boolean;
  existingValue?: { title: string; content: string };
}

export interface ExtractedProduct {
  product_name: string;
  service_line: string;
  description: string;
  capabilities: Array<{ name: string; description: string }>;
  isConflict: boolean;
  existingValue?: { description: string };
}

export interface ExtractedEvidence {
  evidence_type: string;
  title: string;
  summary: string;
  full_content: string;
  client_industry?: string;
  service_line?: string;
  metrics?: Array<{ name: string; value: string; context: string }>;
  isConflict: boolean;
  existingValue?: { summary: string };
}

export interface ExtractedItems {
  company_context: ExtractedCompanyContext[];
  product_contexts: ExtractedProduct[];
  evidence_library: ExtractedEvidence[];
}

interface BulkImportReviewProps {
  items: ExtractedItems;
  onAccept: (selected: ExtractedItems) => void;
  onCancel: () => void;
  committing: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export function BulkImportReview({
  items,
  onAccept,
  onCancel,
  committing,
}: BulkImportReviewProps) {
  const [selectedCC, setSelectedCC] = useState<Set<string>>(
    new Set(
      items.company_context
        .filter((i) => !i.isConflict)
        .map((i) => `${i.category}:${i.key}`),
    ),
  );
  const [selectedPC, setSelectedPC] = useState<Set<string>>(
    new Set(
      items.product_contexts
        .filter((i) => !i.isConflict)
        .map((i) => `${i.product_name}:${i.service_line}`),
    ),
  );
  const [selectedEL, setSelectedEL] = useState<Set<string>>(
    new Set(
      items.evidence_library
        .filter((i) => !i.isConflict)
        .map((i) => i.title),
    ),
  );

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["company_context", "product_contexts", "evidence_library"]),
  );

  const totalSelected =
    selectedCC.size + selectedPC.size + selectedEL.size;
  const totalItems =
    items.company_context.length +
    items.product_contexts.length +
    items.evidence_library.length;

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function selectAll() {
    setSelectedCC(
      new Set(items.company_context.map((i) => `${i.category}:${i.key}`)),
    );
    setSelectedPC(
      new Set(
        items.product_contexts.map(
          (i) => `${i.product_name}:${i.service_line}`,
        ),
      ),
    );
    setSelectedEL(new Set(items.evidence_library.map((i) => i.title)));
  }

  function deselectAll() {
    setSelectedCC(new Set());
    setSelectedPC(new Set());
    setSelectedEL(new Set());
  }

  function handleAccept() {
    const selected: ExtractedItems = {
      company_context: items.company_context.filter((i) =>
        selectedCC.has(`${i.category}:${i.key}`),
      ),
      product_contexts: items.product_contexts.filter((i) =>
        selectedPC.has(`${i.product_name}:${i.service_line}`),
      ),
      evidence_library: items.evidence_library.filter((i) =>
        selectedEL.has(i.title),
      ),
    };
    onAccept(selected);
  }

  if (totalItems === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-10 w-10 text-[var(--warning)]" />
        <p className="mt-3 text-sm text-[var(--foreground-muted)]">
          No items were extracted from the uploaded documents.
        </p>
        <button onClick={onCancel} className="btn-secondary mt-4">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-muted)]">
          {totalSelected} of {totalItems} items selected
        </p>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Select All
          </button>
          <span className="text-[var(--foreground-subtle)]">|</span>
          <button
            onClick={deselectAll}
            className="text-xs text-[var(--foreground-muted)] hover:underline"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Company Context Section */}
      {items.company_context.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
          <button
            onClick={() => toggleSection("company_context")}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            {expandedSections.has("company_context") ? (
              <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
            )}
            <Building2 className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Company Context
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">
              ({items.company_context.length} items)
            </span>
          </button>
          {expandedSections.has("company_context") && (
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
              {items.company_context.map((item) => {
                const key = `${item.category}:${item.key}`;
                const checked = selectedCC.has(key);
                return (
                  <label
                    key={key}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--background-tertiary)]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedCC((prev) => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        });
                      }}
                      className="mt-0.5 rounded border-[var(--border)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent)]">
                          {item.category}
                        </span>
                        {item.isConflict && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                            Conflict
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-2">
                        {item.content}
                      </p>
                      {item.isConflict && item.existingValue && (
                        <div className="mt-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] p-2">
                          <p className="text-[10px] font-medium text-[var(--warning)] uppercase">
                            Existing value
                          </p>
                          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                            {item.existingValue.content ||
                              item.existingValue.title}
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Product Contexts Section */}
      {items.product_contexts.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
          <button
            onClick={() => toggleSection("product_contexts")}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            {expandedSections.has("product_contexts") ? (
              <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
            )}
            <Package className="h-4 w-4 text-[var(--info)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Products & Services
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">
              ({items.product_contexts.length} items)
            </span>
          </button>
          {expandedSections.has("product_contexts") && (
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
              {items.product_contexts.map((item) => {
                const key = `${item.product_name}:${item.service_line}`;
                const checked = selectedPC.has(key);
                return (
                  <label
                    key={key}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--background-tertiary)]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedPC((prev) => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        });
                      }}
                      className="mt-0.5 rounded border-[var(--border)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {item.product_name}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--info)]/10 text-[var(--info)]">
                          {item.service_line}
                        </span>
                        {item.isConflict && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                            Conflict
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                      {item.capabilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.capabilities.map((cap) => (
                            <span
                              key={cap.name}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                            >
                              {cap.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.isConflict && item.existingValue && (
                        <div className="mt-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] p-2">
                          <p className="text-[10px] font-medium text-[var(--warning)] uppercase">
                            Existing value
                          </p>
                          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                            {item.existingValue.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Evidence Library Section */}
      {items.evidence_library.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
          <button
            onClick={() => toggleSection("evidence_library")}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            {expandedSections.has("evidence_library") ? (
              <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
            )}
            <Award className="h-4 w-4 text-[var(--success)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Evidence Library
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">
              ({items.evidence_library.length} items)
            </span>
          </button>
          {expandedSections.has("evidence_library") && (
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
              {items.evidence_library.map((item) => {
                const checked = selectedEL.has(item.title);
                return (
                  <label
                    key={item.title}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--background-tertiary)]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedEL((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.title))
                            next.delete(item.title);
                          else next.add(item.title);
                          return next;
                        });
                      }}
                      className="mt-0.5 rounded border-[var(--border)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)]">
                          {item.evidence_type.replace("_", " ")}
                        </span>
                        {item.isConflict && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                            Conflict
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-2">
                        {item.summary}
                      </p>
                      {item.isConflict && item.existingValue && (
                        <div className="mt-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] p-2">
                          <p className="text-[10px] font-medium text-[var(--warning)] uppercase">
                            Existing value
                          </p>
                          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                            {item.existingValue.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onCancel}
          className="btn-secondary"
          disabled={committing}
        >
          Cancel
        </button>
        <button
          onClick={handleAccept}
          disabled={totalSelected === 0 || committing}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {committing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Accept {totalSelected} Items
            </>
          )}
        </button>
      </div>
    </div>
  );
}
