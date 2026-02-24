"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const SAVE_DELAY_MS = 1000;

interface AutoSaveOptions {
  /** sessionStorage key for the draft */
  storageKey: string;
  /** Whether the wizard is in the main form flow (not select/review/bid-eval screens) */
  enabled: boolean;
}

interface AutoSaveResult<T> {
  /** Whether a saved draft was found on mount */
  hasDraft: boolean;
  /** Restore the saved draft (returns the parsed state or null) */
  restoreDraft: () => T | null;
  /** Dismiss the draft banner without restoring */
  dismissDraft: () => void;
  /** Clear the saved draft (call on successful submission) */
  clearDraft: () => void;
  /** Save state immediately (bypasses debounce) */
  saveNow: (state: T) => void;
}

/**
 * Auto-saves wizard state to sessionStorage with debounce.
 * Adds a beforeunload listener when there's unsaved data.
 *
 * Usage:
 *   const { hasDraft, restoreDraft, dismissDraft, clearDraft } = useWizardAutoSave<WizardState>({
 *     storageKey: "proposal-wizard-draft",
 *     enabled: intakeMode === "form",
 *   });
 */
export function useWizardAutoSave<T>(
  state: T,
  options: AutoSaveOptions,
): AutoSaveResult<T> {
  const { storageKey, enabled } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const hasDataRef = useRef(false);
  const initialCheckDone = useRef(false);

  // Check for existing draft on mount (only once)
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    try {
      // Don't show draft banner if there's opportunity-prefill data
      const hasPrefill = sessionStorage.getItem("opportunity-prefill");
      if (hasPrefill) return;

      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only show banner if draft has meaningful data
        if (parsed && parsed.clientName && parsed.clientName.trim()) {
          setHasDraft(true);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey]);

  // Debounced save to sessionStorage
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const serialized = JSON.stringify(state);
        sessionStorage.setItem(storageKey, serialized);
        hasDataRef.current = true;
      } catch {
        // sessionStorage full or unavailable — silently fail
      }
    }, SAVE_DELAY_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [state, enabled, storageKey]);

  // beforeunload listener
  useEffect(() => {
    if (!enabled) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasDataRef.current) {
        e.preventDefault();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  const restoreDraft = useCallback((): T | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        setHasDraft(false);
        return JSON.parse(saved) as T;
      }
    } catch {
      // Ignore
    }
    return null;
  }, [storageKey]);

  const dismissDraft = useCallback(() => {
    setHasDraft(false);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    setHasDraft(false);
    hasDataRef.current = false;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const saveNow = useCallback(
    (newState: T) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(newState));
        hasDataRef.current = true;
      } catch {
        // Ignore
      }
    },
    [storageKey],
  );

  return { hasDraft, restoreDraft, dismissDraft, clearDraft, saveNow };
}
