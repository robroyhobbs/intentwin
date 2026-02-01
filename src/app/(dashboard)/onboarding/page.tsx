"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  Building2,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Rocket,
  Target,
  Upload,
  Lightbulb,
} from "lucide-react";

type Step = "welcome" | "company" | "differentiators" | "knowledge" | "ready";

const INDUSTRIES = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Government",
  "Energy",
  "Telecommunications",
  "Professional Services",
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
  "Consulting",
  "Staff Augmentation",
  "Other",
];

const STEPS: Step[] = ["welcome", "company", "differentiators", "knowledge", "ready"];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [orgId, setOrgId] = useState("");

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [proposalTypes, setProposalTypes] = useState<string[]>([]);
  const [differentiators, setDifferentiators] = useState<string[]>(["", "", ""]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "");

        // Load organization
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profile?.organization_id) {
          setOrgId(profile.organization_id);

          const { data: org } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", profile.organization_id)
            .single();

          if (org) {
            setCompanyName(org.name || "");
            if (org.settings?.description) setCompanyDescription(org.settings.description);
            if (org.settings?.industry) setIndustry(org.settings.industry);
            if (org.settings?.proposal_types) setProposalTypes(org.settings.proposal_types);
            if (org.settings?.differentiators?.length > 0) {
              const diffs = org.settings.differentiators;
              setDifferentiators([diffs[0] || "", diffs[1] || "", diffs[2] || ""]);
            }

            // If onboarding already completed, redirect
            if (org.settings?.onboarding_completed) {
              router.push("/proposals");
            }
          }
        }
      }
    }
    loadUserData();
  }, [supabase, router]);

  const toggleProposalType = (type: string) => {
    setProposalTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const updateDifferentiator = (index: number, value: string) => {
    const updated = [...differentiators];
    updated[index] = value;
    setDifferentiators(updated);
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // Save all data to organization
      await supabase
        .from("organizations")
        .update({
          name: companyName,
          settings: {
            description: companyDescription,
            industry,
            proposal_types: proposalTypes,
            differentiators: differentiators.filter(d => d.trim()),
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          },
        })
        .eq("id", orgId);

      // Create company_context entries
      const contexts = [
        { category: "brand", key: "company_name", title: "Company Name", content: companyName },
        { category: "brand", key: "description", title: "Company Description", content: companyDescription },
      ];

      const filteredDiffs = differentiators.filter(d => d.trim());
      if (filteredDiffs.length > 0) {
        contexts.push({
          category: "brand",
          key: "differentiators",
          title: "Key Differentiators",
          content: filteredDiffs.join("\n\n"),
        });
      }

      for (const ctx of contexts) {
        if (ctx.content) {
          // Upsert - check if exists first
          const { data: existing } = await supabase
            .from("company_context")
            .select("id")
            .eq("organization_id", orgId)
            .eq("category", ctx.category)
            .eq("key", ctx.key)
            .single();

          if (existing) {
            await supabase
              .from("company_context")
              .update({ title: ctx.title, content: ctx.content })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("company_context")
              .insert({ ...ctx, organization_id: orgId });
          }
        }
      }

      router.push("/proposals/new");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
    }

    setLoading(false);
  };

  const currentStepIndex = STEPS.indexOf(step);
  const goBack = () => setStep(STEPS[currentStepIndex - 1]);
  const firstName = userName.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === s
                      ? "bg-[var(--accent)] text-white"
                      : i < currentStepIndex
                      ? "bg-[var(--success)] text-white"
                      : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                  }`}
                >
                  {i < currentStepIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      i < currentStepIndex
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
          {/* Step 1: Welcome */}
          {step === "welcome" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Welcome to ProposalAI, {firstName}!
              </h1>
              <p className="text-[var(--foreground-muted)] mb-8 max-w-md mx-auto">
                Let&apos;s set up your company profile so the AI can write proposals that truly represent you.
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
                    "All premium features unlocked",
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
                Let&apos;s get started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Company Profile */}
          {step === "company" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-subtle)]">
                  <Building2 className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    Tell us about your company
                  </h2>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    This helps the AI write in your voice
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Company Description
                  </label>
                  <textarea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                    placeholder="Briefly describe what your company does..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Primary Industry
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep("differentiators")}
                  className="btn-primary"
                  disabled={!companyName}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Differentiators */}
          {step === "differentiators" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-subtle)]">
                  <Target className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    What makes you different?
                  </h2>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    These will appear in &quot;Why Us&quot; sections
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {differentiators.map((diff, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Differentiator {index + 1}
                    </label>
                    <input
                      type="text"
                      value={diff}
                      onChange={(e) => updateDifferentiator(index, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      placeholder={
                        index === 0
                          ? 'e.g., "20+ years of industry experience"'
                          : index === 1
                          ? 'e.g., "Certified cloud migration experts"'
                          : 'e.g., "Dedicated support team"'
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="bg-[var(--background-secondary)] rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
                  <p className="text-sm text-[var(--foreground-muted)]">
                    <strong>Tip:</strong> Think about why clients choose you over competitors.
                    Certifications, team size, unique methodologies, and track record are great differentiators.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep("knowledge")}
                  className="btn-primary"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Knowledge Base */}
          {step === "knowledge" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-subtle)]">
                  <FileText className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    Proposal types you create
                  </h2>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Select all that apply - you can change this later
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {PROPOSAL_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleProposalType(type)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                      proposalTypes.includes(type)
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                    }`}
                  >
                    {proposalTypes.includes(type) && (
                      <Check className="w-3 h-3 inline mr-2" />
                    )}
                    {type}
                  </button>
                ))}
              </div>

              <div className="bg-[var(--background-secondary)] rounded-xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent-subtle)]">
                    <Upload className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--foreground)]">
                      Upload past proposals (optional)
                    </h4>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      After setup, you can upload winning proposals and case studies to train the AI on your style.
                    </p>
                    <button
                      onClick={() => router.push("/knowledge-base/upload")}
                      className="text-sm text-[var(--accent)] hover:underline mt-2"
                    >
                      Go to Knowledge Base →
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep("ready")}
                  className="btn-primary"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Ready */}
          {step === "ready" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--success)] mb-6">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                You&apos;re all set, {firstName}!
              </h1>
              <p className="text-[var(--foreground-muted)] mb-8 max-w-md mx-auto">
                Your company profile is configured. Let&apos;s create your first proposal.
              </p>

              <div className="bg-[var(--background-secondary)] rounded-xl p-6 mb-8 text-left">
                <h4 className="font-medium text-[var(--foreground)] mb-3">Quick summary:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Company:</span>
                    <span className="font-medium text-[var(--foreground)]">{companyName}</span>
                  </div>
                  {industry && (
                    <div className="flex justify-between">
                      <span className="text-[var(--foreground-muted)]">Industry:</span>
                      <span className="font-medium text-[var(--foreground)]">{industry}</span>
                    </div>
                  )}
                  {differentiators.filter(d => d.trim()).length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--foreground-muted)]">Differentiators:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {differentiators.filter(d => d.trim()).length} added
                      </span>
                    </div>
                  )}
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
                  onClick={goBack}
                  className="flex items-center justify-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go back and edit
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
