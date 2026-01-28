"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Database,
  Settings,
  PlusCircle,
  Search,
  Upload,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navGroups = [
  {
    label: "Proposals",
    items: [
      { name: "Dashboard", href: "/proposals", icon: LayoutDashboard },
      { name: "New Proposal", href: "/proposals/new", icon: PlusCircle },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { name: "Knowledge Base", href: "/knowledge-base", icon: Database },
      { name: "Upload Documents", href: "/knowledge-base/upload", icon: Upload },
      { name: "Search", href: "/knowledge-base/search", icon: Search },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", href: "/settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-[#1B365D] to-[#0F2440] shadow-xl">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
            <FileText className="h-4.5 w-4.5 text-[#12ABDB]" />
          </div>
          <div>
            <span className="text-base font-semibold text-white tracking-tight">
              ProposalGen
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 custom-scrollbar">
        {navGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-7" : ""}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-300/50">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/proposals" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[#12ABDB] shadow-[0_0_8px_rgba(18,171,219,0.5)]" />
                    )}
                    <item.icon
                      className={cn(
                        "mr-3 h-4 w-4 transition-colors duration-200",
                        isActive
                          ? "text-[#12ABDB]"
                          : "text-blue-300/40 group-hover:text-blue-200/70"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#12ABDB] shadow-[0_0_6px_rgba(18,171,219,0.6)]" />
          <p className="text-[11px] font-medium text-blue-200/50">
            Capgemini Proposal Generator
          </p>
        </div>
        <p className="mt-0.5 pl-3.5 text-[10px] text-blue-300/30">Phase 3</p>
      </div>
    </aside>
  );
}
