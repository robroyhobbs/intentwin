"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration guard — must sync mounted state after SSR
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[var(--background-tertiary)]" />
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycleTheme}
      className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--background-tertiary)]"
      title={`Theme: ${theme} (${resolvedTheme})`}
    >
      {/* Sun icon */}
      <Sun
        className={cn(
          "h-4 w-4 absolute transition-all duration-200",
          resolvedTheme === "light" && theme !== "system"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-0"
        )}
        style={{ color: "var(--foreground-muted)" }}
      />

      {/* Moon icon */}
      <Moon
        className={cn(
          "h-4 w-4 absolute transition-all duration-200",
          resolvedTheme === "dark" && theme !== "system"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-0"
        )}
        style={{ color: "var(--foreground-muted)" }}
      />

      {/* System icon */}
      <Monitor
        className={cn(
          "h-4 w-4 absolute transition-all duration-200",
          theme === "system"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-0"
        )}
        style={{ color: "var(--foreground-muted)" }}
      />
    </button>
  );
}

export function ThemeToggleExpanded() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration guard — must sync mounted state after SSR
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--background-tertiary)] w-32 h-9" />
    );
  }

  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "Auto" },
  ];

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)]">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150",
            theme === value
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          )}
          title={label}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
