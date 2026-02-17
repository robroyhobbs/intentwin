"use client";

import {
  X,
  Plus,
  Target,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ContextPhaseProps {
  clientName: string;
  setClientName: (value: string) => void;
  clientIndustry: string;
  setClientIndustry: (value: string) => void;
  opportunityType: string;
  setOpportunityType: (value: string) => void;
  currentStatePains: string[];
  setCurrentStatePains: React.Dispatch<React.SetStateAction<string[]>>;
  desiredOutcomes: string[];
  setDesiredOutcomes: React.Dispatch<React.SetStateAction<string[]>>;
  scopeDescription: string;
  setScopeDescription: (value: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (value: boolean) => void;
  budgetRange: string;
  setBudgetRange: (value: string) => void;
  timelineExpectation: string;
  setTimelineExpectation: (value: string) => void;
  technicalEnvironment: string;
  setTechnicalEnvironment: (value: string) => void;
  complianceRequirements: string;
  setComplianceRequirements: (value: string) => void;
  fieldClass: string;
  labelClass: string;
  addToArray: (setter: React.Dispatch<React.SetStateAction<string[]>>) => void;
  updateArrayItem: (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) => void;
  removeFromArray: (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
  ) => void;
}

export function ContextPhase({
  clientName,
  setClientName,
  clientIndustry,
  setClientIndustry,
  opportunityType,
  setOpportunityType,
  currentStatePains,
  setCurrentStatePains,
  desiredOutcomes,
  setDesiredOutcomes,
  scopeDescription,
  setScopeDescription,
  showAdvanced,
  setShowAdvanced,
  budgetRange,
  setBudgetRange,
  timelineExpectation,
  setTimelineExpectation,
  technicalEnvironment,
  setTechnicalEnvironment,
  complianceRequirements,
  setComplianceRequirements,
  fieldClass,
  labelClass,
  addToArray,
  updateArrayItem,
  removeFromArray,
}: ContextPhaseProps) {
  return (
    <div className="space-y-8">
      {/* Essential Info */}
      <section>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[var(--accent)]" />
          Client Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>
              Client Name{" "}
              <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Acme Corporation"
            />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <select
              value={clientIndustry}
              onChange={(e) => setClientIndustry(e.target.value)}
              className={fieldClass}
            >
              <option value="">Select industry...</option>
              <option value="financial_services">
                Financial Services
              </option>
              <option value="healthcare">Healthcare</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="retail">Retail</option>
              <option value="energy">Energy & Utilities</option>
              <option value="public_sector">Public Sector</option>
              <option value="telecom">Telecom</option>
              <option value="technology">Technology</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Opportunity Type</label>
            <select
              value={opportunityType}
              onChange={(e) => setOpportunityType(e.target.value)}
              className={fieldClass}
            >
              <option value="cloud_migration">Cloud Migration</option>
              <option value="app_modernization">
                App Modernization
              </option>
              <option value="data_analytics">Data & Analytics</option>
              <option value="ai_ml">AI / Machine Learning</option>
              <option value="both">Migration + Modernization</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
          What challenges are they facing?
          <span className="text-[var(--danger)]">*</span>
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-4">
          Describe the pain points. These drive the proposal
          narrative.
        </p>
        <div className="space-y-3">
          {currentStatePains.map((pain, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-lg bg-[var(--warning-subtle)] text-sm font-bold text-[var(--warning)]">
                {idx + 1}
              </span>
              <input
                type="text"
                value={pain}
                onChange={(e) =>
                  updateArrayItem(
                    setCurrentStatePains,
                    idx,
                    e.target.value,
                  )
                }
                className={`${fieldClass} flex-1`}
                placeholder="e.g. Legacy systems causing $2M/year in downtime"
              />
              {currentStatePains.length > 1 && (
                <button
                  onClick={() =>
                    removeFromArray(setCurrentStatePains, idx)
                  }
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => addToArray(setCurrentStatePains)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-subtle)] rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> Add another
          </button>
        </div>
      </section>

      {/* Outcomes */}
      <section>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-[var(--accent)]" />
          What outcomes do they want?
          <span className="text-[var(--danger)]">*</span>
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-4">
          Define success. Be specific about measurable results.
        </p>
        <div className="space-y-3">
          {desiredOutcomes.map((outcome, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-sm font-bold text-[var(--accent)]">
                {idx + 1}
              </span>
              <input
                type="text"
                value={outcome}
                onChange={(e) =>
                  updateArrayItem(
                    setDesiredOutcomes,
                    idx,
                    e.target.value,
                  )
                }
                className={`${fieldClass} flex-1`}
                placeholder="e.g. Reduce infrastructure costs by 40% in 12 months"
              />
              {desiredOutcomes.length > 1 && (
                <button
                  onClick={() =>
                    removeFromArray(setDesiredOutcomes, idx)
                  }
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => addToArray(setDesiredOutcomes)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-subtle)] rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> Add another
          </button>
        </div>
      </section>

      {/* Scope description */}
      <section>
        <label className={labelClass}>
          Scope Description
          <span className="font-normal text-[var(--foreground-muted)] ml-2">
            (Optional)
          </span>
        </label>
        <textarea
          value={scopeDescription}
          onChange={(e) => setScopeDescription(e.target.value)}
          rows={3}
          className={fieldClass}
          placeholder="Any additional context about what they need..."
        />
      </section>

      {/* Advanced options (collapsed) */}
      <section>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          Advanced Options
          <span className="text-xs text-[var(--foreground-subtle)]">
            (budget, timeline, constraints)
          </span>
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--background-tertiary)] space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1 block">
                  Budget Range
                </label>
                <input
                  type="text"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className={fieldClass}
                  placeholder="e.g. $2M-$5M"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1 block">
                  Timeline
                </label>
                <input
                  type="text"
                  value={timelineExpectation}
                  onChange={(e) =>
                    setTimelineExpectation(e.target.value)
                  }
                  className={fieldClass}
                  placeholder="e.g. 6-12 months"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1 block">
                Technical Environment
              </label>
              <textarea
                value={technicalEnvironment}
                onChange={(e) =>
                  setTechnicalEnvironment(e.target.value)
                }
                rows={2}
                className={fieldClass}
                placeholder="Current tech stack, cloud providers..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1 block">
                Compliance Requirements
              </label>
              <input
                type="text"
                value={complianceRequirements}
                onChange={(e) =>
                  setComplianceRequirements(e.target.value)
                }
                className={fieldClass}
                placeholder="HIPAA, SOC 2, GDPR..."
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
