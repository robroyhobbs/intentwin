"use client";

import { useState } from "react";
import { Search, Loader2, FileText } from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

interface SearchResult {
  id: string;
  document_id: string;
  content: string;
  section_heading: string | null;
  similarity: number;
  document_title: string;
  document_type: string;
  file_name: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [documentType, setDocumentType] = useState("");

  const authFetch = useAuthFetch();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await authFetch("/api/documents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          document_type: documentType || undefined,
          limit: 10,
          threshold: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "block w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Search Knowledge Base
      </h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        Search across all indexed documents using natural language
      </p>

      <form onSubmit={handleSearch} className="mt-6 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. AWS cloud migration strategy for financial services"
              className={fieldClass}
            />
          </div>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <option value="">All types</option>
            <option value="proposal">Proposals</option>
            <option value="case_study">Case Studies</option>
            <option value="methodology">Methodology</option>
            <option value="capability">Capabilities</option>
          </select>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="mt-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="card p-8 text-center">
            <Search className="mx-auto h-10 w-10 text-[var(--foreground-subtle)]" />
            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              No results found. Try different search terms.
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-muted)]">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            {results.map((result) => (
              <div key={result.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--foreground-subtle)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {result.document_title}
                    </span>
                    {result.section_heading && (
                      <span className="text-sm text-[var(--foreground-subtle)]">
                        &middot; {result.section_heading}
                      </span>
                    )}
                  </div>
                  <span className="badge badge-generating">
                    {(result.similarity * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="mt-3 text-sm text-[var(--foreground-muted)] leading-relaxed whitespace-pre-wrap">
                  {result.content.length > 500
                    ? result.content.slice(0, 500) + "..."
                    : result.content}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="rounded bg-[var(--background-tertiary)] px-2 py-0.5 text-xs text-[var(--foreground-muted)]">
                    {result.document_type.replace("_", " ")}
                  </span>
                  <span className="rounded bg-[var(--background-tertiary)] px-2 py-0.5 text-xs text-[var(--foreground-muted)]">
                    {result.file_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
