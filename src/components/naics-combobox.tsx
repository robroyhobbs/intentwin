"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  searchNaics,
  parseNaicsCodes,
  type NaicsEntry,
} from "@/lib/naics/lookup";

interface NaicsComboboxProps {
  selected: NaicsEntry[];
  onChange: (codes: NaicsEntry[]) => void;
  suggestions?: NaicsEntry[];
  onConfirmSuggestions?: () => void;
  placeholder?: string;
}

export function NaicsCombobox({
  selected,
  onChange,
  suggestions,
  onConfirmSuggestions,
  placeholder = "Search NAICS codes...",
}: NaicsComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim() ? searchNaics(query, 10) : [];
  const selectedCodes = useMemo(
    () => new Set(selected.map((s) => s.code)),
    [selected],
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addCode = useCallback(
    (entry: NaicsEntry) => {
      if (!selectedCodes.has(entry.code)) {
        onChange([...selected, entry]);
      }
      setQuery("");
      setPasteError(null);
    },
    [selected, selectedCodes, onChange],
  );

  const removeCode = useCallback(
    (code: string) => {
      onChange(selected.filter((s) => s.code !== code));
    },
    [selected, onChange],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text");
      if (text.includes(",") || text.includes(" ")) {
        e.preventDefault();
        const { valid, invalid } = parseNaicsCodes(text);
        if (valid.length > 0) {
          const newCodes = valid.filter((v) => !selectedCodes.has(v.code));
          onChange([...selected, ...newCodes]);
          setQuery("");
        }
        if (invalid.length > 0) {
          setPasteError(`Not found: ${invalid.join(", ")}`);
          setTimeout(() => setPasteError(null), 3000);
        }
      }
    },
    [selected, selectedCodes, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !query && selected.length > 0) {
        removeCode(selected[selected.length - 1].code);
      }
    },
    [query, selected, removeCode],
  );

  const confirmSuggestions = useCallback(() => {
    if (!suggestions?.length) return;
    const newCodes = suggestions.filter((s) => !selectedCodes.has(s.code));
    onChange([...selected, ...newCodes]);
    onConfirmSuggestions?.();
  }, [suggestions, selected, selectedCodes, onChange, onConfirmSuggestions]);

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Suggestions banner */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm">
          <span className="text-blue-700 dark:text-blue-300">
            Detected from RFP: {suggestions.map((s) => s.code).join(", ")}
          </span>
          <button
            type="button"
            onClick={confirmSuggestions}
            className="ml-auto px-2 py-0.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      )}

      {suggestions && suggestions.length === 0 && (
        <div className="text-xs text-[var(--foreground-muted)] px-1">
          No NAICS codes detected. Add manually.
        </div>
      )}

      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5">
        {selected.map((entry) => (
          <span
            key={entry.code}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs"
          >
            <span className="font-mono font-medium">{entry.code}</span>
            <span className="text-[var(--foreground-muted)] truncate max-w-[150px]">
              {entry.description}
            </span>
            <button
              type="button"
              onClick={() => removeCode(entry.code)}
              className="text-gray-400 hover:text-red-500 ml-0.5"
              aria-label={`Remove ${entry.code}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setPasteError(null);
          }}
          onFocus={() => setIsOpen(true)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl text-sm border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {pasteError && (
          <div className="absolute top-full mt-1 text-xs text-red-500">
            {pasteError}
          </div>
        )}

        {/* Dropdown results */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg">
            {results.map((entry) => {
              const isSelected = selectedCodes.has(entry.code);
              return (
                <button
                  key={entry.code}
                  type="button"
                  onClick={() => addCode(entry)}
                  disabled={isSelected}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--background-hover)] flex items-center gap-2 ${
                    isSelected ? "opacity-50" : ""
                  }`}
                >
                  <span className="font-mono font-medium shrink-0">
                    {entry.code}
                  </span>
                  <span className="text-[var(--foreground-muted)] truncate">
                    {entry.description}
                  </span>
                  {isSelected && (
                    <span className="text-xs text-green-500 ml-auto shrink-0">
                      Added
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
