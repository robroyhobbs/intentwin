/**
 * Parallel Extraction Orchestrator
 * Runs 3 focused micro-extractors in parallel via Promise.allSettled,
 * merges results, and falls back to single-call if all 3 fail.
 */

import type { ExtractedIntake } from "@/types/intake";
import { logger } from "@/lib/utils/logger";
import {
  buildQuickFieldsPrompt,
  buildRequirementsPrompt,
  buildRfpStructurePrompt,
  truncateForQuickFields,
} from "./extract-parallel-prompts";

// ── Types ────────────────────────────────────────────────────────────────────

type ContentType = "file" | "pasted" | "verbal";

interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

type GenerateFn = (prompt: string, opts: GenerateOptions) => Promise<string>;
type ParseFn = (response: string) => Record<string, unknown> | null;

interface ParallelResults {
  quickFields: Record<string, unknown> | null;
  requirements: Record<string, unknown> | null;
  rfpStructure: Record<string, unknown> | null;
}

// ── Merge Results ────────────────────────────────────────────────────────────

export function mergeExtractionResults(
  results: ParallelResults,
): ExtractedIntake {
  const qf = results.quickFields as Record<string, unknown> | null;
  const req = results.requirements as Record<string, unknown> | null;
  const rfp = results.rfpStructure as Record<string, unknown> | null;

  const qfExtracted = (qf?.extracted ?? {}) as Record<string, unknown>;
  const reqExtracted = (req?.extracted ?? {}) as Record<string, unknown>;

  const merged: ExtractedIntake = {
    input_type: (qf?.input_type as ExtractedIntake["input_type"]) ?? "other",
    input_summary: (qf?.input_summary as string) ?? "Document analyzed",
    extracted: {
      ...qfExtracted,
      ...reqExtracted,
    } as ExtractedIntake["extracted"],
    inferred: (qf?.inferred ?? {}) as ExtractedIntake["inferred"],
    rfp_analysis: rfp?.rfp_analysis as ExtractedIntake["rfp_analysis"],
    gaps: (rfp?.gaps as ExtractedIntake["gaps"]) ?? [],
  };

  if (merged.rfp_analysis) {
    if (!Array.isArray(merged.rfp_analysis.sections))
      merged.rfp_analysis.sections = [];
    if (!Array.isArray(merged.rfp_analysis.evaluation_criteria))
      merged.rfp_analysis.evaluation_criteria = [];
  }

  return merged;
}

// ── Parallel Orchestrator ────────────────────────────────────────────────────

export async function runParallelExtraction(opts: {
  content: string;
  contentType: ContentType;
  generateFn: GenerateFn;
  parseFn: ParseFn;
  systemPrompt: string;
  fallbackBuilder: (c: string, ct: ContentType) => string;
}): Promise<ExtractedIntake> {
  const { content, contentType, generateFn, parseFn, systemPrompt } = opts;
  const truncated = truncateForQuickFields(content);

  const [qfResult, reqResult, rfpResult] = await Promise.allSettled([
    extractWithParse(
      generateFn, parseFn, systemPrompt,
      buildQuickFieldsPrompt(truncated, contentType), 4096,
    ),
    extractWithParse(
      generateFn, parseFn, systemPrompt,
      buildRequirementsPrompt(content, contentType), 6144,
    ),
    extractWithParse(
      generateFn, parseFn, systemPrompt,
      buildRfpStructurePrompt(content, contentType), 8192,
    ),
  ]);

  const quickFields = fulfilled(qfResult);
  const requirements = fulfilled(reqResult);
  const rfpStructure = fulfilled(rfpResult);
  const count = [quickFields, requirements, rfpStructure].filter(
    Boolean,
  ).length;

  logExtractionOutcome(qfResult, reqResult, rfpResult, count);

  if (count === 0) {
    return runFallback(opts);
  }

  return mergeExtractionResults({ quickFields, requirements, rfpStructure });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function extractWithParse(
  generateFn: GenerateFn,
  parseFn: ParseFn,
  systemPrompt: string,
  prompt: string,
  maxTokens: number,
): Promise<Record<string, unknown> | null> {
  const raw = await generateFn(prompt, {
    systemPrompt,
    temperature: 0.3,
    maxTokens,
  });
  return parseFn(raw);
}

function fulfilled(
  r: PromiseSettledResult<Record<string, unknown> | null>,
): Record<string, unknown> | null {
  return r.status === "fulfilled" ? r.value : null;
}

function logExtractionOutcome(
  qf: PromiseSettledResult<unknown>,
  req: PromiseSettledResult<unknown>,
  rfp: PromiseSettledResult<unknown>,
  count: number,
): void {
  if (count === 3) {
    logger.info("Parallel extraction: all 3 extractors succeeded");
  } else if (count > 0) {
    logger.warn("Parallel extraction: partial success", {
      quickFields: qf.status,
      requirements: req.status,
      rfpStructure: rfp.status,
    });
  } else {
    logger.warn("Parallel extraction: all 3 failed, attempting fallback");
  }
}

async function runFallback(opts: {
  content: string;
  contentType: ContentType;
  generateFn: GenerateFn;
  parseFn: ParseFn;
  systemPrompt: string;
  fallbackBuilder: (c: string, ct: ContentType) => string;
}): Promise<ExtractedIntake> {
  const prompt = opts.fallbackBuilder(opts.content, opts.contentType);
  const raw = await opts.generateFn(prompt, {
    systemPrompt: opts.systemPrompt,
    temperature: 0.3,
    maxTokens: 12288,
  });
  const parsed = opts.parseFn(raw);
  if (!parsed) throw new Error("Failed to parse fallback extraction results");
  return parsed as unknown as ExtractedIntake;
}
