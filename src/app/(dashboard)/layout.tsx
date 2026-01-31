import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-auto p-6 bg-grid"
          style={{ background: "var(--background-secondary)" }}
        >
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
