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
  BookOpen,
  BarChart3,
  Building2,
  Palette,
  MessageSquare,
  Library,
  Globe,
  DollarSign,
  FileText,
  Info,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navGroups = [
  {
    label: "Proposals",
    items: [
      { name: "Dashboard", href: "/proposals", icon: LayoutDashboard },
      { name: "New Proposal", href: "/proposals/create", icon: PlusCircle },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { name: "L1 Sources", href: "/knowledge-base/sources", icon: BookOpen },
      { name: "Evidence Library", href: "/evidence-library", icon: Library },
      { name: "Uploaded Docs", href: "/knowledge-base", icon: Database },
      { name: "Upload", href: "/knowledge-base/upload", icon: Upload },
      { name: "Search", href: "/knowledge-base/search", icon: Search },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { name: "Market Overview", href: "/intelligence", icon: Globe },
      {
        name: "Public Records (FOIA)",
        href: "/intelligence/foia",
        icon: Library,
      },
      {
        name: "Agency Explorer",
        href: "/intelligence/agencies",
        icon: Building2,
      },
      {
        name: "Rate Benchmarks",
        href: "/intelligence/rates",
        icon: DollarSign,
      },
      {
        name: "Opportunities",
        href: "/intelligence/opportunities",
        icon: Briefcase,
      },
      { name: "Award Search", href: "/intelligence/awards", icon: FileText },
      { name: "About Data", href: "/intelligence/about", icon: Info },
    ],
  },
  {
    label: "Settings",
    items: [
      { name: "Company Profile", href: "/settings/company", icon: Building2 },
      {
        name: "Brand Voice",
        href: "/settings/brand-voice",
        icon: MessageSquare,
      },
      { name: "Branding", href: "/settings/branding", icon: Palette },
      { name: "Billing & Plan", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar during proposal creation for a focused workspace
  if (pathname.startsWith("/proposals/create")) return null;

  return (
    <aside className="flex h-screen w-60 flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-[var(--sidebar-border)]">
        <Link href="/proposals" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl shadow-[0_0_15px_rgba(192,132,252,0.3)] transition-all group-hover:shadow-[0_0_20px_rgba(192,132,252,0.6)] group-hover:scale-105">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 512 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="512" height="512" rx="100" fill="#09090B" />
              <rect
                x="176"
                y="144"
                width="32"
                height="224"
                rx="16"
                fill="url(#monogram_grad_1)"
              />
              <path
                d="M232 144H320C355.346 144 384 172.654 384 208C384 233.167 369.458 254.918 348.65 265.558C374.881 275.64 394 300.911 394 330C394 369.764 361.764 402 322 402H232V144Z"
                stroke="url(#monogram_grad_2)"
                strokeWidth="28"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d="M232 268H320"
                stroke="url(#monogram_grad_2)"
                strokeWidth="28"
                strokeLinecap="round"
              />
              <circle cx="192" cy="112" r="16" fill="url(#monogram_grad_1)" />
              <circle cx="232" cy="112" r="16" fill="url(#monogram_grad_2)" />
              <defs>
                <linearGradient
                  id="monogram_grad_1"
                  x1="176"
                  y1="112"
                  x2="208"
                  y2="368"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#818CF8" />
                  <stop offset="1" stopColor="#C084FC" />
                </linearGradient>
                <linearGradient
                  id="monogram_grad_2"
                  x1="232"
                  y1="144"
                  x2="394"
                  y2="402"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#C084FC" />
                  <stop offset="1" stopColor="#F472B6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[var(--sidebar-text)] tracking-tight">
              IntentBid
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
            <p className="tiny-label px-3 mb-2">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/proposals" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[var(--sidebar-active)] text-[var(--accent)] shadow-[var(--shadow-glow)]"
                        : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]",
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
                          : "text-[var(--foreground-subtle)] group-hover:text-[var(--foreground-muted)]",
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
          <span className="text-xs font-medium text-[var(--foreground-muted)]">
            System Ready
          </span>
        </div>
        <p className="mt-2 text-[10px] text-[var(--foreground-subtle)] font-medium">
          Intent-Driven Development
        </p>
      </div>
    </aside>
  );
}
