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

interface ExtractCall {
  name: string;
  prompt: string;
  maxTokens: number;
}

interface ExtractionOpts {
  content: string;
  contentType: ContentType;
  generateFn: GenerateFn;
  parseFn: ParseFn;
  systemPrompt: string;
  fallbackBuilder: (c: string, ct: ContentType) => string;
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

/** Stagger delay between launching parallel calls to avoid rate limits */
const STAGGER_MS = 300;
/** Delay before fallback to let rate limits recover */
const FALLBACK_DELAY_MS = 2_000;

/** Launch 3 staggered extraction calls and return their settled results. */
async function launchStaggeredCalls(
  calls: ExtractCall[],
  opts: Pick<ExtractionOpts, "generateFn" | "parseFn" | "systemPrompt">,
): Promise<PromiseSettledResult<Record<string, unknown> | null>[]> {
  const promises: Promise<Record<string, unknown> | null>[] = [];
  for (let i = 0; i < calls.length; i++) {
    const c = calls[i];
    promises.push(
      extractWithParse({
        name: c.name,
        generateFn: opts.generateFn,
        parseFn: opts.parseFn,
        systemPrompt: opts.systemPrompt,
        prompt: c.prompt,
        maxTokens: c.maxTokens,
      }),
    );
    if (i < calls.length - 1) await delay(STAGGER_MS);
  }
  return Promise.allSettled(promises);
}

export async function runParallelExtraction(
  opts: ExtractionOpts,
): Promise<ExtractedIntake> {
  const { content, contentType } = opts;
  const truncated = truncateForQuickFields(content);

  logger.info("Starting parallel extraction", {
    contentLength: content.length,
    truncatedLength: truncated.length,
    contentType,
  });

  const calls: ExtractCall[] = [
    { name: "quickFields", prompt: buildQuickFieldsPrompt(truncated, contentType), maxTokens: 4096 },
    { name: "requirements", prompt: buildRequirementsPrompt(content, contentType), maxTokens: 6144 },
    { name: "rfpStructure", prompt: buildRfpStructurePrompt(content, contentType), maxTokens: 8192 },
  ];

  const [qfResult, reqResult, rfpResult] = await launchStaggeredCalls(calls, opts);

  const quickFields = fulfilled(qfResult);
  const requirements = fulfilled(reqResult);
  const rfpStructure = fulfilled(rfpResult);
  const count = [quickFields, requirements, rfpStructure].filter(Boolean).length;

  logExtractionOutcome(qfResult, reqResult, rfpResult, count);

  if (count === 0) {
    await delay(FALLBACK_DELAY_MS);
    return runFallback(opts);
  }

  return mergeExtractionResults({ quickFields, requirements, rfpStructure });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractWithParse(args: {
  name: string;
  generateFn: GenerateFn;
  parseFn: ParseFn;
  systemPrompt: string;
  prompt: string;
  maxTokens: number;
}): Promise<Record<string, unknown> | null> {
  let raw: string;
  try {
    raw = await args.generateFn(args.prompt, {
      systemPrompt: args.systemPrompt,
      temperature: 0.3,
      maxTokens: args.maxTokens,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Extractor "${args.name}" AI call failed`, {
      error: msg.slice(0, 300),
    });
    throw err;
  }

  const parsed = args.parseFn(raw);
  if (!parsed) {
    logger.warn(`Extractor "${args.name}" returned unparseable response`, {
      responseLength: raw.length,
      responseSnippet: raw.slice(0, 200),
    });
  }
  return parsed;
}

function fulfilled(
  r: PromiseSettledResult<Record<string, unknown> | null>,
): Record<string, unknown> | null {
  return r.status === "fulfilled" ? r.value : null;
}

function rejectionReason(r: PromiseSettledResult<unknown>): string {
  if (r.status === "rejected") {
    const err = r.reason;
    return err instanceof Error ? err.message.slice(0, 150) : String(err);
  }
  return r.status;
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
      quickFields: rejectionReason(qf),
      requirements: rejectionReason(req),
      rfpStructure: rejectionReason(rfp),
    });
  } else {
    logger.error("Parallel extraction: all 3 failed", undefined, {
      quickFields: rejectionReason(qf),
      requirements: rejectionReason(req),
      rfpStructure: rejectionReason(rfp),
    });
  }
}

async function runFallback(opts: ExtractionOpts): Promise<ExtractedIntake> {
  logger.info("Running single-call fallback extraction");
  const prompt = opts.fallbackBuilder(opts.content, opts.contentType);
  const raw = await opts.generateFn(prompt, {
    systemPrompt: opts.systemPrompt,
    temperature: 0.3,
    maxTokens: 12288,
  });
  const parsed = opts.parseFn(raw);
  if (!parsed) {
    logger.error("Fallback extraction: unparseable response", undefined, {
      responseLength: raw.length,
      responseSnippet: raw.slice(0, 200),
    });
    throw new Error("Failed to parse fallback extraction results");
  }
  logger.info("Fallback extraction succeeded");
  return parsed as unknown as ExtractedIntake;
}
