import type { WizardState } from "@/lib/proposal-core/wizard-state";

export const WIZARD_STORAGE_KEY = "proposal-wizard-state";

export type WizardDraftState = WizardState & { currentStep?: number };

/** Serialize state for sessionStorage (strips non-serializable/transient fields) */
export function serializeWizardStateForStorage(state: WizardDraftState): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { files, isExtracting, extractionError, generationStatus, sectionProgress, ...serializable } = state;
  return JSON.stringify(serializable);
}

export function loadWizardDraft(): Partial<WizardDraftState> | null {
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.currentStep) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveWizardDraft(state: WizardDraftState): void {
  try {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, serializeWizardStateForStorage(state));
  } catch {
    // sessionStorage full or unavailable — intentionally ignored
  }
}

export function clearWizardDraft(): void {
  try {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch {
    // intentionally ignored
  }
}
