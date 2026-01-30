"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  Building2,
  FileText,
  ArrowRight,
  Check,
  Rocket,
} from "lucide-react";

type Step = "welcome" | "company" | "ready";

const INDUSTRIES = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Government",
  "Energy",
  "Telecommunications",
  "Other",
];

const PROPOSAL_TYPES = [
  "Cloud Migration",
  "Application Modernization",
  "Digital Transformation",
  "Data & Analytics",
  "Cybersecurity",
  "Managed Services",
  "Custom Development",
  "Other",
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [proposalTypes, setProposalTypes] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "");
        setOrgName(user.user_metadata?.organization_name || "");
      }
    }
    loadUserData();
  }, [supabase]);

  const toggleProposalType = (type: string) => {
    setProposalTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleComplete = async () => {
    setLoading(true);

    // Save preferences to organization settings
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get the user's profile to find their organization
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profile?.organization_id) {
          // Update organization settings
          await supabase
            .from("organizations")
            .update({
              settings: {
                industry,
                proposal_types: proposalTypes,
                onboarding_completed: true,
              },
            })
            .eq("id", profile.organization_id);
        }
      }
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    }

    router.push("/proposals/new");
  };

  const firstName = userName.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {(["welcome", "company", "ready"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === s
                      ? "bg-[var(--accent)] text-white"
                      : i < ["welcome", "company", "ready"].indexOf(step)
                      ? "bg-[var(--success)] text-white"
                      : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                  }`}
                >
                  {i < ["welcome", "company", "ready"].indexOf(step) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      i < ["welcome", "company", "ready"].indexOf(step)
                        ? "bg-[var(--success)]"
                        : "bg-[var(--border)]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-8 animate-fade-in-up">
          {step === "welcome" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Welcome to ProposalAI, {firstName}!
              </h1>
              <p className="text-[var(--foreground-muted)] mb-8 max-w-md mx-auto">
                Let's get you set up so you can start creating winning proposals
                in minutes.
              </p>

              <div className="bg-[var(--background-secondary)] rounded-xl p-6 mb-8 text-left">
                <h3 className="font-medium text-[var(--foreground)] mb-4">
                  Your 14-day free trial includes:
                </h3>
                <ul className="space-y-3">
                  {[
                    "3 AI-generated proposals",
                    "Full export capabilities (DOCX, PDF, PPTX)",
                    "Knowledge base with 10 documents",
                    "All premium features",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]"
                    >
                      <Check className="w-4 h-4 text-[var(--success)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setStep("company")}
                className="btn-primary"
              >
                Let's get started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "company" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-subtle)]">
                  <Building2 className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    Tell us about your business
                  </h2>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    This helps us tailor proposals to your industry
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    What industry do you primarily serve?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => setIndustry(ind)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          industry === ind
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    What types of proposals do you create? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPOSAL_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleProposalType(type)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                          proposalTypes.includes(type)
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                        }`}
                      >
                        {proposalTypes.includes(type) && (
                          <Check className="w-3 h-3 inline mr-1" />
                        )}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep("welcome")}
                  className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("ready")}
                  className="btn-primary"
                  disabled={!industry}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === "ready" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--success)] mb-6">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                You're all set!
              </h1>
              <p className="text-[var(--foreground-muted)] mb-8 max-w-md mx-auto">
                Your workspace is ready. Let's create your first proposal.
              </p>

              <div className="bg-[var(--background-secondary)] rounded-xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-subtle)]">
                    <FileText className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Create your first proposal
                    </h3>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Tell us about your client and we'll generate a winning proposal
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="btn-primary w-full justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Create my first proposal
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.push("/proposals")}
                  className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  Skip for now, go to dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-[var(--foreground-subtle)] mt-6">
          Need help? Email us at{" "}
          <a
            href="mailto:support@proposalai.com"
            className="text-[var(--accent)] hover:underline"
          >
            support@proposalai.com
          </a>
        </p>
      </div>
    </div>
  );
}
