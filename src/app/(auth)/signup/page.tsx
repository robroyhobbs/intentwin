"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Target,
  BarChart3,
  Users,
  CheckCircle,
  Mail,
} from "lucide-react";

type Step = "email-check" | "signup" | "waitlist" | "waitlist-success";

export default function SignupPage() {
  const [step, setStep] = useState<Step>("email-check");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleEmailCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.allowed) {
        setStep("signup");
      } else {
        setStep("waitlist");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_name: organizationName || `${fullName}'s Organization`,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      router.push("/onboarding");
      router.refresh();
    }
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, company }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("waitlist-success");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--background)] via-[var(--accent-subtle)] to-[var(--background-tertiary)]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-16 w-2 h-2 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute top-32 left-32 w-1.5 h-1.5 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute top-48 left-20 w-1 h-1 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute bottom-40 right-20 w-2 h-2 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute bottom-28 right-32 w-1.5 h-1.5 rounded-full bg-[var(--accent-muted)]" />
          <div className="absolute top-1/3 right-16 w-1 h-1 rounded-full bg-[var(--accent-muted)]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 max-w-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-[var(--foreground)]">
              IntentBid
            </span>
          </div>

          <h1 className="text-4xl font-bold text-[var(--foreground)] leading-tight mb-4">
            {step === "waitlist" || step === "waitlist-success" ? (
              <>
                Join the
                <br />
                <span className="text-[var(--accent)]">early access list</span>
              </>
            ) : (
              <>
                Start creating
                <br />
                <span className="text-[var(--accent)]">winning proposals</span>
              </>
            )}
          </h1>

          <p className="text-lg text-[var(--foreground-muted)] mb-10 leading-relaxed">
            {step === "waitlist" || step === "waitlist-success"
              ? "IntentBid is currently invite-only. Join the waitlist and we'll notify you when a spot opens up."
              : "Outcome-driven proposal generation. Write better, win more."}
          </p>

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

          {step !== "waitlist" && step !== "waitlist-success" && (
            <p className="mt-16 text-sm text-[var(--foreground-subtle)]">
              Start your 14-day free trial
            </p>
          )}
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
            {/* Step 1: Email check */}
            {step === "email-check" && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Get started
                  </h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Enter your email to check access
                  </p>
                </div>

                <form onSubmit={handleEmailCheck} className="space-y-4">
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
                      Work email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      placeholder="you@company.com"
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
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 2a: Signup form (allowed users) */}
            {step === "signup" && (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                    <span className="text-sm font-medium text-[var(--success)]">
                      Access confirmed
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Create your account
                  </h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Complete your registration for {email}
                  </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-[var(--danger-subtle)] border border-[var(--danger-muted)] p-3 text-sm text-[var(--danger)]">
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                    >
                      Full name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                      autoFocus
                      placeholder="Jane Smith"
                      className="block w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="organizationName"
                      className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                    >
                      Company / Organization
                    </label>
                    <input
                      id="organizationName"
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      autoComplete="organization"
                      placeholder="Acme Corp"
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
                      autoComplete="new-password"
                      minLength={6}
                      placeholder="Create a strong password"
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 2b: Waitlist form (not allowed) */}
            {step === "waitlist" && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Join the waitlist
                  </h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    IntentBid is currently invite-only. Leave your details and
                    we&apos;ll reach out when a spot opens.
                  </p>
                </div>

                <form onSubmit={handleWaitlist} className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-[var(--danger-subtle)] border border-[var(--danger-muted)] p-3 text-sm text-[var(--danger)]">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="block w-full opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="waitlistName"
                      className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                    >
                      Full name
                    </label>
                    <input
                      id="waitlistName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoFocus
                      placeholder="Jane Smith"
                      className="block w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="waitlistCompany"
                      className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                    >
                      Company
                    </label>
                    <input
                      id="waitlistCompany"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                      placeholder="Acme Corp"
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
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <button
                  onClick={() => {
                    setStep("email-check");
                    setError(null);
                  }}
                  className="mt-4 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] w-full text-center"
                >
                  Try a different email
                </button>
              </>
            )}

            {/* Step 3: Waitlist success */}
            {step === "waitlist-success" && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--success-subtle)] mb-4">
                  <Mail className="h-7 w-7 text-[var(--success)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  You&apos;re on the list!
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-6">
                  We&apos;ll notify you at{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {email}
                  </span>{" "}
                  when your access is ready.
                </p>
                <div className="bg-[var(--background-secondary)] rounded-lg p-4 text-left">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    We&apos;ll be in touch soon with next steps and proposal writing tips.
                  </p>
                </div>
              </div>
            )}

            {step !== "waitlist-success" && (
              <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            )}
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
