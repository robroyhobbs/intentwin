"use client";

import { Edit3, Eye, ShieldCheck } from "lucide-react";

interface TabBarProps {
  activeTab: "sections" | "compliance" | "review";
  setActiveTab: (tab: "sections" | "compliance" | "review") => void;
}

export function TabBar({ activeTab, setActiveTab }: TabBarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card-bg)] px-6 flex gap-1">
      <button
        onClick={() => setActiveTab("sections")}
        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "sections"
            ? "border-[var(--accent)] text-[var(--accent)]"
            : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        }`}
      >
        <Edit3 className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
        Sections
      </button>
      <button
        onClick={() => setActiveTab("compliance")}
        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "compliance"
            ? "border-[var(--accent)] text-[var(--accent)]"
            : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        }`}
      >
        <ShieldCheck className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
        Compliance
      </button>
      <button
        onClick={() => setActiveTab("review")}
        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "review"
            ? "border-[var(--accent)] text-[var(--accent)]"
            : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        }`}
      >
        <Eye className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
        Review
      </button>
    </div>
  );
}
