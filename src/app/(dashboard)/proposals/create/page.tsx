import type { Metadata } from "next";
import { CreateFlowProvider } from "./_components/create-provider";
import { CreateShell } from "./_components/create-shell";

export const metadata: Metadata = {
  title: "Create Proposal | IntentBid",
};

export default function ProposalCreatePage() {
  return (
    <CreateFlowProvider>
      <CreateShell />
    </CreateFlowProvider>
  );
}
