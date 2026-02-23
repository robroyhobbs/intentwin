/**
 * RFP Task Structure Extraction
 * Extracts hierarchical task/scope structure from RFP documents.
 * Part of Phase 5: RFP Task-by-Task Mirroring.
 *
 * Fail-open: all failures return a valid empty RfpTaskStructure.
 */

import { logger } from "@/lib/utils/logger";
import {
  TASK_CATEGORIES,
  isValidRfpTask,
  type RfpTask,
  type RfpTaskStructure,
  type TaskCategory,
} from "../pipeline/types";

const MAX_DOCUMENT_CHARS = 500_000;
const MAX_DESCRIPTION_LENGTH = 2000;

const taskCategorySet = new Set<string>(TASK_CATEGORIES);

function emptyStructure(): RfpTaskStructure {
  return { tasks: [], extracted_at: new Date().toISOString() };
}

/**
 * Build the prompt for extracting task structure from RFP text.
 */
export function buildExtractTaskStructurePrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_DOCUMENT_CHARS
      ? documentText.slice(0, MAX_DOCUMENT_CHARS) +
        "\n\n[Document truncated — only the first portion was analyzed]"
      : documentText;

  return `You are analyzing a government/enterprise RFP document to extract its hierarchical task and scope structure. Your job is to identify all explicitly numbered tasks and subtasks that a vendor must respond to.

## Document Content
<document>
${truncated}
</document>

## Your Task

Extract every explicitly numbered task, scope area, or deliverable from this document. Focus on:
- Numbered task orders (Task 1, Task 2, etc.)
- Subtasks within task orders (1.1, 1.2, etc.)
- Numbered scope of work sections with clear deliverables
- Contract Line Item Numbers (CLINs) that describe work areas

Do NOT extract:
- Administrative sections (submission instructions, evaluation criteria, terms)
- Section numbers that are just document organization (not scope/task assignments)
- Unnumbered narrative descriptions without clear task boundaries

For each task, return:
- **task_number**: The exact numbering from the RFP (e.g., "1", "1.1", "2.3.1", "A", "A.1")
- **title**: A concise title for the task (from the RFP heading or first sentence)
- **description**: The full scope text describing what the vendor must do (up to 2000 chars)
- **category**: One of: ${TASK_CATEGORIES.join(", ")}
- **parent_task_number**: The parent task's number (e.g., "1" for subtask "1.1"), or null for top-level tasks

## Category Definitions
- **technical**: Software development, system integration, engineering work
- **staffing**: Personnel requirements, labor categories, staffing plans
- **management**: Program management, project oversight, governance
- **support-operations**: Help desk, tier 1-3 support, operations center
- **compliance-security**: Security controls, compliance frameworks, FedRAMP, FISMA
- **transition-onboarding**: Transition-in/out plans, knowledge transfer, onboarding
- **training**: User training, documentation, CBT development
- **reporting-analytics**: Dashboards, reports, analytics, metrics tracking
- **quality-assurance**: QA processes, testing, SLA monitoring
- **infrastructure**: Network, cloud, hardware, data center operations

## Output Format
Return ONLY a JSON array. No markdown wrapping, no explanation.

Example:
[
  {
    "task_number": "1",
    "title": "Help Desk Services",
    "description": "The vendor shall provide Tier 1 through Tier 3 help desk support services including...",
    "category": "support-operations",
    "parent_task_number": null
  },
  {
    "task_number": "1.1",
    "title": "Tier 1 Support",
    "description": "Handle initial user contacts via phone, email, and chat...",
    "category": "support-operations",
    "parent_task_number": "1"
  }
]

## Guidelines
1. Preserve the EXACT numbering from the RFP — do not renumber
2. Only extract explicitly numbered tasks — do not infer structure from narrative
3. If no numbered tasks are found, return an empty array: []
4. Keep descriptions verbatim from the RFP where possible (truncate at 2000 chars)
5. Set parent_task_number based on the numbering hierarchy (1.1 → parent "1")
6. Every subtask must reference a valid parent task_number`;
}

/**
 * Parse AI response into a validated RfpTaskStructure.
 * Never throws — always returns a valid (possibly empty) structure.
 */
export function parseTaskStructureResponse(response: string): RfpTaskStructure {
  if (!response || !response.trim()) {
    return emptyStructure();
  }

  let jsonStr = response.trim();

  // Strip markdown code block wrapper if present
  const codeFenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) {
    jsonStr = codeFenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    logger.warn("Failed to parse task structure extraction response as JSON");
    return emptyStructure();
  }

  if (!Array.isArray(parsed)) {
    logger.warn("Task structure extraction response is not an array");
    return emptyStructure();
  }

  // Deduplicate by task_number (keep first occurrence)
  const seenNumbers = new Set<string>();
  const validTasks: RfpTask[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;

    const raw = item as Record<string, unknown>;

    // Required fields check
    if (
      typeof raw.task_number !== "string" ||
      !raw.task_number.trim() ||
      typeof raw.title !== "string" ||
      !raw.title.trim() ||
      typeof raw.description !== "string"
    ) {
      continue;
    }

    // Deduplicate
    if (seenNumbers.has(raw.task_number)) continue;
    seenNumbers.add(raw.task_number);

    // Normalize category — default to "technical" for invalid values
    const category: TaskCategory = (
      typeof raw.category === "string" && taskCategorySet.has(raw.category)
        ? raw.category
        : "technical"
    ) as TaskCategory;

    // Normalize parent_task_number — default to null
    const parent_task_number: string | null =
      typeof raw.parent_task_number === "string" ? raw.parent_task_number : null;

    // Truncate long descriptions
    const description =
      raw.description.length > MAX_DESCRIPTION_LENGTH
        ? (raw.description as string).slice(0, MAX_DESCRIPTION_LENGTH)
        : (raw.description as string);

    const task: RfpTask = {
      task_number: raw.task_number,
      title: raw.title as string,
      description,
      category,
      parent_task_number,
    };

    // Final validation
    if (isValidRfpTask(task)) {
      validTasks.push(task);
    }
  }

  return {
    tasks: validTasks,
    extracted_at: new Date().toISOString(),
  };
}
