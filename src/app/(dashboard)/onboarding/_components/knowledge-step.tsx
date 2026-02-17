"use client";

import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PROPOSAL_TYPES } from "./constants";

interface KnowledgeStepProps {
  proposalTypes: string[];
  toggleProposalType: (type: string) => void;
  onBack: () => void;
  onContinue: () => void;
  router: ReturnType<typeof useRouter>;
}

export function KnowledgeStep({
  proposalTypes,
  toggleProposalType,
  onBack,
  onContinue,
  router,
}: KnowledgeStepProps) {
  return (
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
              After setup, you can upload winning proposals and case
              studies to train the AI on your style.
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
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onContinue}
          className="btn-primary"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
