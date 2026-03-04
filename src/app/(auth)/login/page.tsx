"use client";

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Target, BarChart3, Users } from "lucide-react";

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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push("/proposals");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--background)] via-[var(--accent-subtle)] to-[var(--background-tertiary)]">
        {/* Subtle decorative dots */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-16 w-2 h-2 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute top-32 left-32 w-1.5 h-1.5 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute top-48 left-20 w-1 h-1 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute bottom-40 right-20 w-2 h-2 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute bottom-28 right-32 w-1.5 h-1.5 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute top-1/3 right-16 w-1 h-1 rounded-full bg-[var(--accent-muted)]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 max-w-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-[var(--foreground)]">
              IntentBid
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-[var(--foreground)] leading-tight mb-4">
            Create proposals that
            <br />
            <span className="text-[var(--accent)]">win deals</span>
          </h1>

          <p className="text-lg text-[var(--foreground-muted)] mb-10 leading-relaxed">
            Outcome-driven proposal generation. Write better, win more.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <Feature
              icon={Target}
              title="Intent-Driven"
              description="Define outcomes first, generate content that delivers"
            />
            <Feature
              icon={BarChart3}
              title="Visual Diagrams"
              description="Architecture and process diagrams, generated from context"
            />
            <Feature
              icon={Users}
              title="Team Collaboration"
              description="Review, comment, and refine proposals together"
            />
          </div>

          {/* Trust indicator */}
          <p className="mt-16 text-sm text-[var(--foreground-subtle)]">
            Trusted by leading consulting firms
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[var(--foreground)]">
              IntentBid
            </span>
          </div>

          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-[var(--danger-subtle)] border border-[var(--danger-muted)] p-3 text-sm text-[var(--danger)]">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="block w-full"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/request-access"
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Request access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-subtle)] flex-shrink-0">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-sm text-[var(--foreground-muted)]">{description}</p>
      </div>
    </div>
  );
}
