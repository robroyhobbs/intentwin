"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, ArrowRight, Sparkles, BarChart3, Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/proposals");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1B365D] via-[#0070AD] to-[#12ABDB]">
        {/* Floating shapes */}
        <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-white/5 animate-float" />
        <div className="absolute top-40 right-20 h-20 w-20 rounded-2xl bg-white/5 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-32 left-1/4 h-24 w-24 rounded-full bg-white/5 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 right-10 h-16 w-16 rounded-xl bg-white/5 animate-float" style={{ animationDelay: "0.5s" }} />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white">ProposalGen</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Win more deals with
            <br />
            <span className="text-[#12ABDB]">AI-powered proposals</span>
          </h2>

          <p className="text-lg text-blue-100/80 mb-12 max-w-md">
            Generate compelling, on-brand proposals in minutes. Powered by AI, refined by experts.
          </p>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-blue-100/70">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Sparkles className="h-4 w-4 text-[#12ABDB]" />
              </div>
              <span className="text-sm">AI-generated content with outcome-driven strategy</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100/70">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <BarChart3 className="h-4 w-4 text-[#12ABDB]" />
              </div>
              <span className="text-sm">Auto-generated diagrams and visual architecture</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100/70">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Shield className="h-4 w-4 text-[#12ABDB]" />
              </div>
              <span className="text-sm">Team review with AI-powered revisions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-[#F5F7FA] px-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="rounded-2xl bg-white p-8 shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="mb-8">
              <div className="lg:hidden flex items-center gap-2 mb-6">
                <FileText className="h-6 w-6 text-[#0070AD]" />
                <span className="text-lg font-semibold text-[#1B365D]">ProposalGen</span>
              </div>
              <h1 className="text-2xl font-bold text-[#1B365D]">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0070AD] focus:outline-none focus:ring-2 focus:ring-[#0070AD]/20 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0070AD] focus:outline-none focus:ring-2 focus:ring-[#0070AD]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0070AD] to-[#12ABDB] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="font-semibold text-[#0070AD] hover:text-[#12ABDB] transition-colors">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
