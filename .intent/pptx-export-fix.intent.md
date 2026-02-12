# PPTX Export Formatting Fix

## 1. Overview

**Problem:** The PPTX export produces slides with visible markdown syntax, truncated bullets, and minimal content per section. Sections with pages of content are reduced to 4 short bullet points, losing most information.

**Target:** Fix `src/lib/export/pptx-generator.ts` to produce professional, fully-formatted slides.

**Scope:** Single file rewrite — `pptx-generator.ts` (423 lines).

**Priority:** High — export is customer-facing.

---

## 2. Issues to Fix

| Issue | Current Behavior | Target Behavior |
|-------|-----------------|-----------------|
| Markdown visible | `**bold**` renders as literal text | Parsed into actual PPTX bold formatting |
| Hard truncation | 60 chars, mid-word cuts | No hard limit, natural text wrapping |
| Only 4 bullets | Entire section → 4 short lines | Full content across multiple slides |
| No multi-slide | 1 content slide per section | Split by headings into multiple slides |
| Missing content | No slide if no bullets extracted | Always generate content slides |
| Links as markdown | `[text](url)` visible | Strip to just "text" |
| Tables as markdown | Raw `|` pipe tables | Convert to labeled text lines |
| Code/diagrams | Raw code blocks visible | Skip code blocks and diagrams |

---

## 3. Architecture

### Content Flow

```
Section.content (markdown)
    ↓
parseMarkdownToSlides(content)
    ↓
Split by ## headings → SubSection[]
    ↓
For each SubSection:
    ├── Parse paragraphs → rich text runs (bold/italic/plain)
    ├── Parse bullet lists → formatted bullets (with nesting)
    ├── Parse tables → labeled text lines
    ├── Skip code blocks and diagrams
    └── Split into slides when content exceeds slide capacity
    ↓
Render slides with pptxgenjs
```

### Markdown Parser Requirements

Strip/convert these patterns:
- `**bold**` / `__bold__` → bold TextProps
- `*italic*` / `_italic_` → italic TextProps
- `***bold italic***` → bold + italic TextProps
- `[text](url)` → just "text" (plain)
- `` `code` `` → plain text (no backticks)
- `~~strikethrough~~` → plain text (stripped)
- `> blockquote` → italic text
- `---` / `***` → skip (horizontal rules)
- ` ``` ` code blocks → skip entirely
- `![alt](img)` → skip (images)
- HTML tags (`<strong>`, `<em>`, etc.) → strip

### Slide Splitting Logic

```
For each section:
  1. Create section intro slide (dark, as-is — keep current design)
  2. Split markdown by ## headings into sub-sections
  3. For each sub-section:
     - Create content slide with sub-heading as title
     - Render paragraphs and bullets with rich formatting
     - If content exceeds ~5-6 bullets or fills slide height:
       → overflow to continuation slide (same title + "cont.")
  4. If section has NO headings:
     - Render all content on slides, splitting by estimated capacity
```

### Slide Capacity Estimation

- Usable height: ~3.5 inches (y: 1.6 to y: 5.1)
- Bullet line height: ~0.35" at 16pt with 1.5x spacing
- Max items per slide: ~8-10 bullet lines (accounting for wrapping)
- Paragraph text: ~6-8 lines at 14pt

---

## 4. Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Content depth | Full content, multi-slide | User sees all content, not just summary |
| Markdown handling | Parse to rich PPTX formatting | Professional output, no visible syntax |
| Heading behavior | New slide per heading | Natural content splitting |
| Text truncation | No hard limit, natural wrap | pptxgenjs handles wrapping |
| Tables | Convert to labeled text | Simple, readable on slides |
| Code blocks | Skip entirely | Not useful on presentation slides |
| Bullet font size | 16pt (down from 18pt) | More content fits per slide |
| Line spacing | 1.5x (down from 1.8x) | More content fits per slide |

---

## 5. MVP Scope

### Included
- Full markdown-to-rich-text parser
- Multi-slide support per section
- Heading-based slide splitting
- Table-to-text conversion
- Proper bold/italic/plain text runs
- Link stripping (keep text, remove URL)
- Code block skipping
- Keep existing: title slide, agenda slide, section intros, thank you slide

### Excluded
- Image embedding in slides
- Diagram rendering
- Nested bullet indentation (flatten for now)
- Custom slide layouts per section type

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| Too many slides generated | Cap at 3 content slides per section, then summarize remainder |
| Empty slides | Skip slides with no parseable content |
| pptxgenjs rich text complexity | Build incrementally, test each formatting type |

<!-- critique: 2026-02-11 — scope is tight, single file, no over-engineering -->
