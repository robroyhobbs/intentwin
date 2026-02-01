"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  Settings,
  PlusCircle,
  Search,
  Upload,
  LayoutDashboard,
  Zap,
  BookOpen,
  BarChart3,
  Building2,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navGroups = [
  {
    label: "Proposals",
    items: [
      { name: "Dashboard", href: "/proposals", icon: LayoutDashboard },
      { name: "New Proposal", href: "/proposals/new", icon: PlusCircle },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { name: "L1 Sources", href: "/knowledge-base/sources", icon: BookOpen },
      { name: "Uploaded Docs", href: "/knowledge-base", icon: Database },
      { name: "Upload", href: "/knowledge-base/upload", icon: Upload },
      { name: "Search", href: "/knowledge-base/search", icon: Search },
    ],
  },
  {
    label: "Settings",
    items: [
      { name: "Company Profile", href: "/settings/company", icon: Building2 },
      { name: "Branding", href: "/settings/branding", icon: Palette },
      { name: "Billing & Plan", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-[var(--sidebar-border)]">
        <Link href="/proposals" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)] transition-all group-hover:shadow-[var(--shadow-glow-intense)]">
            <Zap className="h-5 w-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[var(--sidebar-text)] tracking-tight">
              ProposalAI
            </span>
            <span className="text-[10px] text-[var(--sidebar-text-muted)] font-medium uppercase tracking-wider">
              AI-Powered
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        {navGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-6" : ""}>
            <p className="tiny-label px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/proposals" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[var(--sidebar-active)] text-[var(--accent)] shadow-[var(--shadow-glow)]"
                        : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                    )}

                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                        isActive
                          ? "text-[var(--accent)]"
                          : "text-[var(--foreground-subtle)] group-hover:text-[var(--foreground-muted)]"
                      )}
                    />

                    {item.name}

                    {/* New indicator for New Proposal */}
                    {item.name === "New Proposal" && !isActive && (
                      <span className="ml-auto text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded-full">
                        +
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] p-4">
        <div className="flex items-center gap-2">
          <div className="status-dot status-dot-success" />
          <span className="text-xs font-medium text-[var(--foreground-muted)]">AI Ready</span>
        </div>
        <p className="mt-2 text-[10px] text-[var(--foreground-subtle)] font-medium">
          Intent-Driven Development
        </p>
      </div>
    </aside>
  );
}
