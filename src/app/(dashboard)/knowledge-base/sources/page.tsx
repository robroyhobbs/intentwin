"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  Briefcase,
  Award,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Database,
  Shield,
  ArrowLeft,
  Users,
} from "lucide-react";

interface SourceFile {
  fileName: string;
  category: string;
  title: string;
  status: string;
  contentType?: string;
  verifiedDate?: string;
}

interface SourceCategory {
  name: string;
  key: string;
  icon: React.ReactNode;
  description: string;
  files: SourceFile[];
}

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<{
    category: string;
    fileName: string;
    content: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    async function loadSources() {
      try {
        const response = await fetch("/api/sources");
        if (response.ok) {
          const data = await response.json();
          setSources(data.categories);
        }
      } catch (error) {
        console.error("Failed to load sources:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSources();
  }, []);

  async function viewSource(category: string, fileName: string) {
    try {
      const response = await fetch(`/api/sources/${category}/${fileName}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedSource({
          category,
          fileName,
          content: data.content,
          title: data.title,
        });
      }
    } catch (error) {
      console.error("Failed to load source:", error);
    }
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    "company-context": <Building2 className="h-5 w-5" />,
    methodologies: <BookOpen className="h-5 w-5" />,
    "case-studies": <Briefcase className="h-5 w-5" />,
    "service-catalog": <FileText className="h-5 w-5" />,
    "evidence-library": <Award className="h-5 w-5" />,
    "team-members": <Users className="h-5 w-5" />,
    "proposal-examples": <FileText className="h-5 w-5" />,
  };

  const categoryDescriptions: Record<string, string> = {
    "company-context": "Company profile, values, and market position",
    methodologies: "Proven frameworks like CCMF, ADMnext, and eAPM",
    "case-studies": "Real client success stories with verified metrics",
    "service-catalog": "Service offerings and capabilities",
    "evidence-library": "Certifications, partnerships, and success metrics",
    "team-members": "Key personnel with credentials, clearances, and past performance",
    "proposal-examples": "Templates and structure guides",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="h-8 w-8 text-[var(--accent)] animate-pulse" />
          <p className="text-sm text-[var(--foreground-muted)]">
            Loading L1 Context...
          </p>
        </div>
      </div>
    );
  }

  if (selectedSource) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setSelectedSource(null)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sources
        </button>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
              {categoryIcons[selectedSource.category] || (
                <FileText className="h-5 w-5 text-[var(--accent)]" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {selectedSource.title}
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
                {selectedSource.category.replace(/-/g, " ")}
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <div
              className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap font-mono bg-[var(--background-tertiary)] rounded-xl p-6 overflow-auto max-h-[70vh]"
              dangerouslySetInnerHTML={{
                __html: selectedSource.content
                  .replace(
                    /^# .+$/gm,
                    (match) =>
                      `<h1 class="text-xl font-bold text-[var(--foreground)] mt-6 mb-3">${match.slice(2)}</h1>`,
                  )
                  .replace(
                    /^## .+$/gm,
                    (match) =>
                      `<h2 class="text-lg font-semibold text-[var(--foreground)] mt-5 mb-2">${match.slice(3)}</h2>`,
                  )
                  .replace(
                    /^### .+$/gm,
                    (match) =>
                      `<h3 class="text-base font-medium text-[var(--foreground)] mt-4 mb-2">${match.slice(4)}</h3>`,
                  )
                  .replace(
                    /\*\*([^*]+)\*\*/g,
                    '<strong class="text-[var(--foreground)]">$1</strong>',
                  )
                  .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
                  .replace(/\n/g, "<br>"),
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
              <Database className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                L1 Context: Company Truth
              </h1>
              <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
                Verified company knowledge that powers proposal generation
              </p>
            </div>
          </div>

          <Link
            href="/knowledge-base"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Uploaded Documents
          </Link>
        </div>

        {/* IDD Banner */}
        <div className="mt-6 rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-subtle)] p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-[var(--accent)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Intent-Driven Development (IDD)
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                L1 Context is verified company knowledge - methodologies, case
                studies, and capabilities that are automatically injected into
                every proposal. AI-generated content is always grounded in these
                verified sources.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-5 gap-4">
        {[
          {
            label: "Case Studies",
            count:
              sources.find((s) => s.key === "case-studies")?.files.length || 0,
            icon: <Briefcase className="h-5 w-5" />,
          },
          {
            label: "Evidence Items",
            count:
              sources.find((s) => s.key === "evidence-library")?.files.length ||
              0,
            icon: <Award className="h-5 w-5" />,
          },
          {
            label: "Team Members",
            count:
              sources.find((s) => s.key === "team-members")?.files.length || 0,
            icon: <Users className="h-5 w-5" />,
          },
          {
            label: "Services",
            count:
              sources.find((s) => s.key === "service-catalog")?.files.length || 0,
            icon: <FileText className="h-5 w-5" />,
          },
          {
            label: "Total Sources",
            count: sources.reduce((sum, cat) => sum + cat.files.length, 0),
            icon: <Database className="h-5 w-5" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] text-[var(--accent)]">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {stat.count}
              </p>
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Grid */}
      <div className="space-y-6">
        {sources.map((category) => (
          <div key={category.key} className="card overflow-hidden">
            <div className="flex items-center gap-4 p-5 border-b border-[var(--border)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                {categoryIcons[category.key] || (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[var(--foreground)] capitalize">
                  {category.key.replace(/-/g, " ")}
                </h2>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {categoryDescriptions[category.key] ||
                    `${category.files.length} source files`}
                </p>
              </div>
              <span className="rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                {category.files.length} files
              </span>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {category.files.map((file) => (
                <button
                  key={file.fileName}
                  onClick={() => viewSource(category.key, file.fileName)}
                  className="flex items-center gap-4 w-full p-4 text-left hover:bg-[var(--background-tertiary)] transition-colors group"
                >
                  <FileText className="h-5 w-5 text-[var(--foreground-subtle)] group-hover:text-[var(--accent)] transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {file.title || file.fileName}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {file.contentType
                        ? file.contentType.replace(/_/g, " ")
                        : file.fileName}
                    </p>
                  </div>
                  {file.status === "VERIFIED" && (
                    <span className="flex items-center gap-1 rounded-full bg-[var(--success-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-[var(--foreground-subtle)] group-hover:text-[var(--accent)] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
