/**
 * Task Response Prompt Builder
 * Generates the prompt for a single RFP task-mirrored section.
 * Part of Phase 5: RFP Task-by-Task Mirroring.
 *
 * One flexible prompt template — categories are metadata only, not prompt selectors.
 */

import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildEditorialStandards } from "./editorial-standards";
import { buildWinStrategySection } from "./win-strategy-section";

const MAX_TASK_DESCRIPTION_LENGTH = 2000;

export interface TaskResponsePromptInput {
  taskNumber: string;
  taskTitle: string;
  taskDescription: string;
  intakeData: Record<string, unknown>;
  analysis: string;
  l1Context: string;
  winStrategy?: WinStrategyData | null;
  companyInfo?: CompanyInfo;
  differentiators?: string[];
  solicitationType?: string;
  audienceProfile?: unknown;
  primaryBrandName?: string;
}

/**
 * Build the prompt for generating a single task-mirrored section.
 *
 * The prompt mirrors the RFP task structure by including the task number,
 * title, and full description as the "requirements to address."
 * Uses the same editorial standards, anti-fabrication rules, and
 * repetition limiter as fixed section prompts.
 */
export function buildTaskResponsePrompt(input: TaskResponsePromptInput): string {
  const {
    taskNumber,
    taskTitle,
    taskDescription,
    intakeData,
    analysis,
    l1Context,
    winStrategy,
    companyInfo,
    differentiators,
    solicitationType = "RFP",
    audienceProfile,
    primaryBrandName,
  } = input;

  const companyName = companyInfo?.name || "Our Company";

  // Truncate long descriptions but always keep task number and title
  const truncatedDescription =
    taskDescription.length > MAX_TASK_DESCRIPTION_LENGTH
      ? taskDescription.slice(0, MAX_TASK_DESCRIPTION_LENGTH) + "..."
      : taskDescription;

  // Build win strategy section if available
  const winStrategyBlock = buildWinStrategySection(winStrategy);

  // Editorial standards with repetition limiter and user-selected tone
  const editorialStandards = buildEditorialStandards(
    solicitationType,
    audienceProfile,
    primaryBrandName,
    differentiators,
    intakeData.tone as string | undefined,
  );

  return `Write the response for **Task ${taskNumber}: ${taskTitle}** in a ${companyName} proposal.

## RFP Task Requirements
The following is the RFP's description of what the vendor must address for this task. Your response must directly address every point below.

### Task ${taskNumber}: ${taskTitle}
${truncatedDescription}

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${l1Context || ""}
${winStrategyBlock}
## Instructions
Write a focused, evidence-backed response (400-600 words) for Task ${taskNumber}: ${taskTitle}.

**Structure your response as follows:**

### Understanding
1-2 sentences demonstrating you understand what this task requires and WHY it matters to the client.

### Our Approach for Task ${taskNumber}
Describe ${companyName}'s specific approach to delivering this task:
- **What** will be done (concrete activities, not vague promises)
- **How** it will be executed (methodology, tools, processes)
- **Who** will do it (reference named personnel from Company Context if available)
- **When** key milestones will be reached

### Relevant Experience
Cite 1-2 specific examples from the Verified Evidence section that demonstrate ${companyName}'s ability to deliver this type of work. Include concrete metrics.

### Key Deliverables
Bullet list of tangible outputs the client will receive for this task.

**CRITICAL RULES:**
- Address EVERY requirement mentioned in the RFP task description above
- Do not invent capabilities, metrics, or case studies not in the Company Context
- Use active voice and client-first framing
- Every claim must be backed by evidence from the provided context

${editorialStandards}`;
}
