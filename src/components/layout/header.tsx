"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export function Header() {
  const supabase = createClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 glass border-b border-gray-200/50">
      {/* Gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0070AD] via-[#12ABDB] to-transparent opacity-40" />

      <div />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-gray-100/80 px-3 py-1.5 text-sm text-gray-600">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0070AD] to-[#12ABDB]">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
