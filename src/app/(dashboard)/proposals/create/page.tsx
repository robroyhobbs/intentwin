import { CreateFlowProvider } from "./_components/create-provider";
import { CreateShell } from "./_components/create-shell";

export default function ProposalCreatePage() {
  return (
    <CreateFlowProvider>
      <CreateShell />
    </CreateFlowProvider>
  );
}
