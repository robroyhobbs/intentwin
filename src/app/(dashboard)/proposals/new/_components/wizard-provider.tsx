"use client";

/**
 * WizardProvider — Context, reducer, auto-save, and browser back interception.
 *
 * Wraps the entire wizard in a context so child components can dispatch actions
 * and read state without prop drilling.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type Dispatch,
  type ReactNode,
} from "react";
import { wizardReducer, INITIAL_STATE } from "./wizard-reducer";
import type { WizardState, WizardAction } from "./wizard-types";

// ────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────

interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}

// ────────────────────────────────────────────────────────
// Auto-Save Helpers
// ────────────────────────────────────────────────────────

const STORAGE_KEY = "proposal-wizard-state";
const SAVE_DEBOUNCE_MS = 1000;

/** Serialize state for sessionStorage (strips non-serializable fields) */
function serializeForStorage(state: WizardState): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { files, isExtracting, extractionError, generationStatus, sectionProgress, ...serializable } = state;
  return JSON.stringify(serializable);
}

function loadDraft(): Partial<WizardState> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic validation: must have a currentStep
    if (!parsed.currentStep) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────
// Provider Component
// ────────────────────────────────────────────────────────

interface WizardProviderProps {
  children: ReactNode;
}

export function WizardProvider({ children }: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);

  // ── Auto-save: debounced write to sessionStorage ──
  useEffect(() => {
    // Don't save if on step 4 (generating) or if just initialized
    if (state.generationStatus === "generating" || state.generationStatus === "complete") return;

    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, serializeForStorage(state));
      } catch {
        // sessionStorage full or unavailable — silently ignore
      }
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [state]);

  // ── Draft restoration check on mount ──
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.clientName) {
      dispatch({ type: "RESTORE_DRAFT", state: draft });
    }
  }, []);

  // ── Browser back interception ──
  useEffect(() => {
    // Push a history entry so popstate fires before leaving the page
    window.history.pushState({ wizardStep: state.currentStep }, "");

    const handlePopState = () => {
      if (state.currentStep > 1) {
        dispatch({ type: "GO_BACK" });
        // Re-push to maintain the history stack
        window.history.pushState({ wizardStep: state.currentStep - 1 }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [state.currentStep]);

  // ── Beforeunload warning when there's data ──
  const hasData = state.clientName || state.extractedData || state.pastedContent || state.files.length > 0;
  useEffect(() => {
    if (!hasData) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasData]);

  // ── Clear draft on successful generation ──
  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (state.generationStatus === "complete") {
      clearDraft();
    }
  }, [state.generationStatus, clearDraft]);

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}
