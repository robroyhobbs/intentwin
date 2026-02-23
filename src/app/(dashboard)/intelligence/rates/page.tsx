"use client";

import { useState, useMemo } from "react";
import { DollarSign, Search } from "lucide-react";
import { useIntelligence } from "../_components/use-intelligence";
import { IntelligenceLoading } from "../_components/intelligence-loading";
import { NotConfigured } from "../_components/not-configured-view";
import type { PricingLookupResponse, RateBenchmark } from "../_components/types";

export default function RateBenchmarksPage() {
  const [categories, setCategories] = useState("project manager");
  const [businessSize, setBusinessSize] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const params = useMemo(() => {
    if (!submitted || !categories.trim()) return null;
    const p: Record<string, string> = {
      categories: categories.trim(),
    };
    if (businessSize) p.business_size = businessSize;
    return p;
  }, [submitted, categories, businessSize]);

  const { data, loading, error, configured } = useIntelligence<PricingLookupResponse>(
    "/api/v1/pricing/rates",
    params ?? undefined,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (!submitted && !loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader />
        <SearchForm
          categories={categories}
          setCategories={setCategories}
          businessSize={businessSize}
          setBusinessSize={setBusinessSize}
          onSubmit={handleSearch}
        />
        <div className="text-center py-12">
          <p className="text-sm text-[var(--foreground-muted)]">
            Enter labor categories above to search GSA rate benchmarks
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <IntelligenceLoading icon={DollarSign} label="rate benchmarks" />;
  }

  if (!configured) {
    return <NotConfigured />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader />
      <SearchForm
        categories={categories}
        setCategories={setCategories}
        businessSize={businessSize}
        setBusinessSize={setBusinessSize}
        onSubmit={handleSearch}
      />

      {error && (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      )}

      {data && data.rate_benchmarks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--foreground-muted)]">
            No rates found for &quot;{categories}&quot;
          </p>
        </div>
      )}

      {data && data.rate_benchmarks.length > 0 && (
        <>
          <p className="text-xs text-[var(--foreground-muted)]">
            {data.rate_benchmarks.length} rate benchmarks found
          </p>
          <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              <span className="col-span-4">Category</span>
              <span className="col-span-2 text-right">GSA Median</span>
              <span className="col-span-2 text-right">GSA Range</span>
              <span className="col-span-2 text-right">Data Points</span>
              <span className="col-span-2 text-right">Effective</span>
            </div>
            {data.rate_benchmarks.map((rate) => (
              <RateRow key={rate.category} rate={rate} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
        <DollarSign className="h-6 w-6 text-black" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Rate Benchmarks</h1>
        <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
          GSA CALC+ labor rate data for competitive pricing
        </p>
      </div>
    </div>
  );
}

function SearchForm({
  categories,
  setCategories,
  businessSize,
  setBusinessSize,
  onSubmit,
}: {
  categories: string;
  setCategories: (v: string) => void;
  businessSize: string;
  setBusinessSize: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[240px]">
        <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
          Labor Categories
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-subtle)]" />
          <input
            type="text"
            placeholder="e.g., project manager, software engineer"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>
      </div>
      <div className="w-40">
        <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
          Business Size
        </label>
        <select
          value={businessSize}
          onChange={(e) => setBusinessSize(e.target.value)}
          className="w-full py-2.5 rounded-xl text-sm"
        >
          <option value="">All Sizes</option>
          <option value="small">Small Business</option>
          <option value="large">Large Business</option>
        </select>
      </div>
      <button type="submit" className="btn-primary py-2.5 px-6">
        Search Rates
      </button>
    </form>
  );
}

function RateRow({ rate }: { rate: RateBenchmark }) {
  const formatCurrency = (v: number | null) => (v != null ? `$${v.toFixed(2)}` : "-");
  const formatRange = (r: [number, number] | null) =>
    r ? `$${r[0].toFixed(0)} - $${r[1].toFixed(0)}` : "-";

  return (
    <div className="grid grid-cols-12 gap-2 px-5 py-3 text-sm hover:bg-[var(--background-tertiary)] transition-colors">
      <span className="col-span-4 text-[var(--foreground)] truncate font-medium">
        {rate.category}
      </span>
      <span className="col-span-2 text-right font-mono text-[var(--accent)]">
        {formatCurrency(rate.gsa_median)}
      </span>
      <span className="col-span-2 text-right text-[var(--foreground-muted)]">
        {formatRange(rate.gsa_range)}
      </span>
      <span className="col-span-2 text-right text-[var(--foreground-muted)]">
        {rate.data_points}
      </span>
      <span className="col-span-2 text-right text-[var(--foreground-subtle)]">
        {rate.effective_date ?? "-"}
      </span>
    </div>
  );
}
