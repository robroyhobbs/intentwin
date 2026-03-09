"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, User, ArrowLeft } from "lucide-react";
import { CopilotNotificationLink } from "@/components/layout/copilot-notification-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Header() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const isCreateFlow = pathname.startsWith("/proposals/create");

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 px-6 bg-[var(--background-secondary)] border-b border-[var(--border)]">
      {/* Back link when sidebar is hidden, IDD badge otherwise */}
      <div className="mr-auto flex items-center gap-2 text-xs">
        {isCreateFlow ? (
          <Link
            href="/proposals"
            className="flex items-center gap-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Proposals</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-[var(--foreground-subtle)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
            <span className="font-medium">IDD Active</span>
          </div>
        )}
      </div>

      <ThemeToggle />

      <CopilotNotificationLink />

      <div className="divider-vertical h-5" />

      {/* User avatar */}
      <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all hover:bg-[var(--background-tertiary)] group">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-muted)] group-hover:shadow-[var(--shadow-glow)] transition-all">
          <User className="h-4 w-4 text-[var(--accent)]" />
        </div>
      </button>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] transition-all hover:bg-[var(--danger-subtle)] hover:text-[var(--danger)]"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </header>
  );
}
