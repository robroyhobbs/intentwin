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
          threshold: 0.5,
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Search Knowledge Base</h1>
      <p className="mt-1 text-sm text-gray-500">
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
              className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
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
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Search className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No results found. Try different search terms.
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {result.document_title}
                    </span>
                    {result.section_heading && (
                      <span className="text-sm text-gray-400">
                        &middot; {result.section_heading}
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {(result.similarity * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {result.content.length > 500
                    ? result.content.slice(0, 500) + "..."
                    : result.content}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {result.document_type.replace("_", " ")}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
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
