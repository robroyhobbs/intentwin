# Execution Plan: PPTX Export Formatting Fix

## Overview

Fix `src/lib/export/pptx-generator.ts` to produce professional, fully-formatted slides. The current code has a good markdown parser (`parseMarkdownToBlocks`, `parseInlineMarkdown`) but the rendering pipeline reduces everything to 3-5 truncated plain-text bullets per section. Replace the condensed rendering path with full-content multi-slide rendering using rich text.

## Prerequisites

- vitest configured and passing ✓
- `pptxgenjs` installed ✓
- `parseMarkdownToBlocks()` and `parseInlineMarkdown()` already exist and are correct ✓
- Intent critiqued (2026-02-11) ✓

---

## Phase 0: Rich Multi-Slide Renderer + Tests

### Description

Replace the "extract key bullets → condensed slide" rendering path with a multi-slide renderer that:

1. Splits content blocks into slide-sized groups (~8 items per slide)
2. Renders rich text runs (bold/italic) via pptxgenjs TextProps
3. Renders paragraphs, bullets, blockquotes, and table rows
4. Adds continuation slides when content overflows ("(cont.)" suffix)
5. Caps at 3 content slides per section (summarize remainder)
6. Keeps existing: title slide, agenda slide, section intro slides, thank you slide

**Files to create:**

- `src/lib/export/__tests__/pptx-generator.test.ts`

**Files to modify:**

- `src/lib/export/pptx-generator.ts`

### Tests

#### Happy Path

- [x] `parseInlineMarkdown("**bold**")` returns `[{ text: "bold", bold: true }]`
- [x] `parseInlineMarkdown("*italic*")` returns `[{ text: "italic", italic: true }]`
- [x] `parseInlineMarkdown("***both***")` returns `[{ text: "both", bold: true, italic: true }]`
- [x] `parseInlineMarkdown("[link](http://x.com)")` returns `[{ text: "link" }]`
- [x] `parseInlineMarkdown("plain text")` returns `[{ text: "plain text" }]`
- [x] `parseInlineMarkdown("before **bold** after")` returns 3 runs with correct formatting
- [x] `parseMarkdownToBlocks` parses headings into `{ type: "heading" }` blocks
- [x] `parseMarkdownToBlocks` parses `- item` into `{ type: "bullet" }` blocks
- [x] `parseMarkdownToBlocks` parses numbered lists `1. item` into bullet blocks
- [x] `parseMarkdownToBlocks` parses regular text into `{ type: "paragraph" }` blocks
- [x] `parseMarkdownToBlocks` parses `> quote` into `{ type: "blockquote" }` blocks
- [x] `parseMarkdownToBlocks` parses pipe tables into `{ type: "table-row" }` blocks
- [x] `parseMarkdownToBlocks` skips code blocks entirely
- [x] `parseMarkdownToBlocks` skips image lines `![alt](url)`
- [x] `parseMarkdownToBlocks` skips horizontal rules `---`
- [x] `splitBlocksIntoSlides` splits 12 bullets into 2 slides (~8 + ~4)
- [x] `splitBlocksIntoSlides` puts heading at start of new slide group
- [x] `splitBlocksIntoSlides` returns 1 slide group for ≤8 items
- [x] `generatePptx` produces a Buffer (non-empty)
- [x] `generatePptx` with 1 section produces: title + agenda + intro + content + thank you (≥5 slides)
- [x] `generatePptx` with long section content produces multiple content slides
- [x] `generatePptx` with section containing ## headings creates slide per heading group
- [x] Continuation slides have " (cont.)" in the title

#### Bad Path

- [x] `parseInlineMarkdown("")` returns empty array
- [x] `parseMarkdownToBlocks("")` returns empty array
- [x] `parseMarkdownToBlocks` with only code blocks returns empty array
- [x] `generatePptx` with empty section content still produces at least intro slide
- [x] `generatePptx` with section content that is only code blocks produces intro + fallback slide
- [x] `splitBlocksIntoSlides` with empty blocks array returns empty array
- [x] `parseInlineMarkdown` handles unclosed `**bold` without crashing
- [x] `parseMarkdownToBlocks` handles unclosed code fence without hanging

#### Edge Cases

- [x] `parseInlineMarkdown("` `code` `")` strips backticks to plain text
- [x] `parseInlineMarkdown("~~strike~~")` strips to plain text
- [x] `parseInlineMarkdown("<strong>html</strong>")` strips HTML tags
- [x] `parseMarkdownToBlocks` handles mixed content (bullets, paragraphs, tables, headings)
- [x] Section with exactly 8 bullets fits on 1 slide (no split)
- [x] Section with 9 bullets splits to 2 slides
- [x] Section with 25+ bullets caps at 3 content slides max
- [x] Table rows render as "Key: Value" formatted bullets
- [x] Blockquotes render as italic text
- [x] Very long section (5000+ chars) doesn't crash, produces slides within cap

#### Security

- [x] `parseInlineMarkdown` strips HTML tags (prevents injection into PPTX XML)
- [x] Content with `<script>` tags is stripped clean
- [x] Extremely long single line (10K chars) doesn't cause memory issues

#### Data Leak

- [x] Generated PPTX metadata uses company name, not internal identifiers
- [x] No raw markdown syntax visible in any slide text
- [x] Error during generation doesn't expose internal file paths

#### Data Damage

- [x] Failed generation throws (doesn't return partial/corrupt buffer)
- [x] Modifying one section's content doesn't affect other sections' slides
- [x] Empty proposal data (no sections) still produces title + thank you slides

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run PPTX generator tests
npx vitest run src/lib/export/__tests__/pptx-generator.test.ts

# All tests pass (no regressions)
npx vitest run

# TypeScript compiles
npx tsc --noEmit
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] Rich text (bold/italic) renders correctly in PPTX output
- [x] Multi-slide splitting works for long sections
- [x] Heading-based splitting creates natural slide breaks
- [x] Tables convert to labeled text lines
- [x] Code blocks and images are skipped
- [x] No visible markdown syntax in slides
- [x] Cap at 3 content slides per section
- [x] Existing title, agenda, section intro, and thank you slides unchanged
- [x] TypeScript compiles clean

---

## Phase 1: Integration Verification + Production Build

### Description

Verify the full export pipeline works end-to-end: API route calls `generatePptx`, produces valid PPTX, and production build succeeds. Fix any type errors or import issues introduced.

**Files to modify (if needed):**

- `src/app/api/proposals/[id]/export-pptx/route.ts` (verify integration)

### Tests

#### Happy Path

- [x] Export API route calls `generatePptx` and returns PPTX content-type
- [x] Generated PPTX can be parsed back (valid ZIP/PPTX structure)
- [x] Production build succeeds with modified pptx-generator.ts

#### Bad Path

- [x] Export with missing proposal ID returns error (not crash)
- [x] Export with proposal that has no sections returns minimal PPTX

#### Edge Cases

- [x] Proposal with 10+ sections generates within memory limits
- [x] Proposal with unicode characters in content renders correctly

#### Security

- [x] Export route requires authentication
- [x] Cannot export proposals from other organizations

#### Data Leak

- [x] PPTX author field uses company name, not user email
- [x] Error responses don't expose file system paths

#### Data Damage

- [x] Failed PPTX generation returns 500, doesn't leave temp files
- [x] Concurrent export requests don't interfere

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Full test suite
npx vitest run

# TypeScript compiles
npx tsc --noEmit

# Production build
npx next build
```

### Acceptance Criteria

- [x] Full test suite passes (no regressions)
- [x] TypeScript compiles clean
- [x] Production build succeeds
- [x] Export route produces valid PPTX with rich formatting

---

## Final E2E Verification

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Full test suite
npx vitest run

# TypeScript compile
npx tsc --noEmit

# Production build
npx next build
```

## Risk Mitigation

| Risk                                 | Mitigation                                 | Contingency                            |
| ------------------------------------ | ------------------------------------------ | -------------------------------------- |
| Too many slides generated            | Cap at 3 content slides per section        | Reduce to 2 if feedback warrants       |
| pptxgenjs TextProps complexity       | Build incrementally, test each type        | Fall back to plain text for edge cases |
| Regression in existing slides        | Keep title/agenda/intro/thankyou unchanged | Revert rendering only, keep parser     |
| Large content causes slow generation | Cap per-section, skip code blocks          | Add chunking if needed                 |

## References

- [Intent Spec](./pptx-export-fix.intent.md)
- Source: `src/lib/export/pptx-generator.ts` (618 lines)
- Export route: `src/app/api/proposals/[id]/export-pptx/route.ts`
