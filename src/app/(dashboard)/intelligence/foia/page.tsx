"use client";

import { useState } from "react";
import { Loader2, Copy, FileText, Check, ShieldCheck, Mail, Building2, Globe, Send } from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { toast } from "sonner";

export default function FOIARequestPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    state: "",
    agency_name: "",
    request_target: "Winning proposal and pricing tabulation from incumbent",
  });
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const authFetch = useAuthFetch();

  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setGeneratedLetter(null);

    try {
      const response = await authFetch("/api/intelligence/foia/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate FOIA request");
      }

      const data = await response.json();
      setGeneratedLetter(data.letter);
      toast.success("Public records request drafted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[var(--shadow-glow)] text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Public Records (FOIA) Engine
            </h1>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              Automate Sunshine Law requests to acquire incumbent contracts and pricing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
          <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-xs font-semibold text-[var(--accent)]">State Laws Applied</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Draft Request</h2>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">State Jurisdiction</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-subtle)]" />
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] pl-10 pr-4 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="" disabled>Select a state</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">Agency Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-subtle)]" />
                  <input
                    required
                    type="text"
                    value={formData.agency_name}
                    onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                    placeholder="e.g., California Dept of Transportation"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] pl-10 pr-4 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">Target Document(s)</label>
                <textarea
                  required
                  rows={3}
                  value={formData.request_target}
                  onChange={(e) => setFormData({ ...formData, request_target: e.target.value })}
                  placeholder="e.g., Winning proposal and pricing tabulation from RFP #1234"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Drafting Legal Letter...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generate Request
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-[var(--foreground-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Inbox Tracking</h3>
            </div>
            <p className="text-xs text-[var(--foreground-subtle)] mb-3">
              Route replies here to automatically parse pricing data into your intelligence dashboard.
            </p>
            <div className="px-3 py-2 bg-[var(--input-bg)] rounded-md border border-[var(--border)] font-mono text-xs text-[var(--foreground-muted)] flex items-center justify-between">
              <span>foia-inbound@intentbid.com</span>
              <span className="text-[9px] uppercase font-bold text-[var(--accent)] tracking-wider">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2">
          {generatedLetter ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <Send className="h-4 w-4 text-[var(--accent)]" />
                  Drafted Letter
                </h3>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--sidebar-hover)] transition-colors border border-[var(--border)]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy to Clipboard"}
                </button>
              </div>
              <div className="p-6 flex-1 bg-[var(--card-bg)]">
                <div className="prose prose-sm dark:prose-invert max-w-none font-serif text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                  {generatedLetter}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] border-dashed bg-[var(--background-secondary)]/50 h-[500px] flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-4 border border-[var(--border)]">
                <FileText className="h-8 w-8 text-[var(--foreground-subtle)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Build Your Data Moat</h3>
              <p className="text-sm text-[var(--foreground-muted)] max-w-md mx-auto">
                Select a state and agency to generate a compliant Freedom of Information Act or Sunshine Law request. Acquire competitor pricing and past proposals to build an unbeatable intelligence advantage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
