"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Step, STEPS } from "./_components/constants";
import { ProgressIndicator } from "./_components/progress-indicator";
import { WelcomeStep } from "./_components/welcome-step";
import { CompanyStep } from "./_components/company-step";
import { DifferentiatorsStep } from "./_components/differentiators-step";
import { KnowledgeStep } from "./_components/knowledge-step";
import { ReadyStep } from "./_components/ready-step";

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
  const [differentiators, setDifferentiators] = useState<string[]>([
    "",
    "",
    "",
  ]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
            .select("id, name, slug, settings, plan_tier")
            .eq("id", profile.organization_id)
            .single();

          if (org) {
            setCompanyName(org.name || "");
            if (org.settings?.description)
              setCompanyDescription(org.settings.description);
            if (org.settings?.industry) setIndustry(org.settings.industry);
            if (org.settings?.proposal_types)
              setProposalTypes(org.settings.proposal_types);
            if (org.settings?.differentiators?.length > 0) {
              const diffs = org.settings.differentiators;
              setDifferentiators([
                diffs[0] || "",
                diffs[1] || "",
                diffs[2] || "",
              ]);
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
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
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
            differentiators: differentiators.filter((d) => d.trim()),
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          },
        })
        .eq("id", orgId);

      // Create company_context entries
      const contexts = [
        {
          category: "brand",
          key: "company_name",
          title: "Company Name",
          content: companyName,
        },
        {
          category: "brand",
          key: "description",
          title: "Company Description",
          content: companyDescription,
        },
      ];

      const filteredDiffs = differentiators.filter((d) => d.trim());
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
        <ProgressIndicator
          steps={STEPS}
          currentStep={step}
          currentStepIndex={currentStepIndex}
        />

        <div className="card p-8 animate-fade-in-up">
          {/* Step 1: Welcome */}
          {step === "welcome" && (
            <WelcomeStep
              firstName={firstName}
              onContinue={() => setStep("company")}
            />
          )}

          {/* Step 2: Company Profile */}
          {step === "company" && (
            <CompanyStep
              companyName={companyName}
              setCompanyName={setCompanyName}
              companyDescription={companyDescription}
              setCompanyDescription={setCompanyDescription}
              industry={industry}
              setIndustry={setIndustry}
              onBack={goBack}
              onContinue={() => setStep("differentiators")}
            />
          )}

          {/* Step 3: Differentiators */}
          {step === "differentiators" && (
            <DifferentiatorsStep
              differentiators={differentiators}
              updateDifferentiator={updateDifferentiator}
              onBack={goBack}
              onContinue={() => setStep("knowledge")}
            />
          )}

          {/* Step 4: Knowledge Base */}
          {step === "knowledge" && (
            <KnowledgeStep
              proposalTypes={proposalTypes}
              toggleProposalType={toggleProposalType}
              onBack={goBack}
              onContinue={() => setStep("ready")}
              router={router}
            />
          )}

          {/* Step 5: Ready */}
          {step === "ready" && (
            <ReadyStep
              firstName={firstName}
              companyName={companyName}
              industry={industry}
              differentiators={differentiators}
              loading={loading}
              onComplete={handleComplete}
              onBack={goBack}
            />
          )}
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-[var(--foreground-subtle)] mt-6">
          Need help? Email us at{" "}
          <a
            href="mailto:support@intentbid.com"
            className="text-[var(--accent)] hover:underline"
          >
            support@intentbid.com
          </a>
        </p>
      </div>
    </div>
  );
}
