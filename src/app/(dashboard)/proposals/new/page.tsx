"use client";

import { WizardProvider } from "./_components/wizard-provider";
import { WizardShell } from "./_components/wizard-shell";

export default function NewProposalPage() {
  return (
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  );
}
