# Quality & UX Release Intent

> Anchor: Improve IntentBid reliability, progress visibility, and input handling so paying customers can complete the proposal workflow without retries or confusion.

## Responsibilities

1. **Retry & Resilience** — Auto-retry transient failures across extraction, bid evaluation, and section generation with exponential backoff (2x max), then surface diagnostic errors with a Retry button
2. **Progress Visibility** — Replace static spinners with task-based percentage progress bars for extraction (4 sub-tasks) and bid evaluation (3 sub-tasks)
3. **SAM.gov URL Support** — Detect workspace URLs, extract opportunity ID, redirect to public URL format, auto-fetch
4. **Product Recommendations** — Inline collapsible panel in bid evaluation showing product-to-requirement match scores with one-click enable/disable
5. **Parallel Generation** — Executive summary first, then remaining sections in batches of 3-4 for ~3x speedup
6. **NAICS Input** — Searchable multi-select combobox with autocomplete, RFP extraction with user confirmation
7. **Changelog** — In-app `/changelog` page with "What's New" nav badge that clears on page view
8. **Error Diagnostics** — Structured error messages with failure reason, attempt count, Retry button, and Support link

## Non-Goals

- SAM.gov full API integration (future Intent)
- SSE/WebSocket streaming infrastructure
- External docs site for changelog
- Changing AI model providers
- Redesigning the wizard step flow

## New Files

- `src/lib/retry/with-retry.ts` — Generic retry wrapper with exponential backoff
- `src/lib/progress/task-progress.ts` — Task-based progress tracker
- `src/lib/naics/naics-lookup.ts` — NAICS code search/lookup (2022 revision data)
- `src/lib/naics/naics-extractor.ts` — Extract NAICS from RFP text via AI
- `src/components/naics/naics-multi-select.tsx` — Searchable multi-select combobox
- `src/components/product-recs/product-alignment-panel.tsx` — Inline product match panel
- `src/components/changelog/whats-new-badge.tsx` — Nav badge component
- `src/app/(dashboard)/changelog/page.tsx` — Changelog page
- `src/data/changelog.json` — Structured changelog entries

## API

### Retry Wrapper

```typescript
// src/lib/retry/with-retry.ts
interface RetryOptions {
  maxRetries?: number; // default: 2
  baseDelay?: number; // default: 2000ms
  backoffFactor?: number; // default: 2
  onRetry?: (attempt: number, error: Error) => void;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T>;
// Throws last error with attempt count metadata on final failure
```

### Progress Tracker

```typescript
// src/lib/progress/task-progress.ts
interface ProgressTracker {
  total: number;
  completed: number;
  currentStep: string;
  percentage: number; // computed: Math.round((completed / total) * 100)
}

// Backend: Store progress in extraction/eval metadata
// Frontend: Poll existing status endpoint, read progress from metadata
```

### SAM.gov URL Handler

```typescript
// Added to src/app/api/intake/fetch-url/route.ts
function detectSamGovUrl(url: string): {
  isWorkspace: boolean;
  opportunityId?: string;
};
function constructPublicSamUrl(opportunityId: string): string;
// Flow: detect → extract ID → construct public URL → fetch public URL → fallback guidance
```

### Product Alignment Panel

```typescript
// src/components/product-recs/product-alignment-panel.tsx
interface ProductRecommendation {
  productId: string;
  productName: string;
  matchScore: number; // 0-100
  matchedRequirements: string[];
  unmatchedRequirements: string[];
  enabled: boolean;
}
// Uses existing computeCapabilityAlignment() output
// Renders as collapsible panel in bid evaluation step
```

### NAICS Multi-Select

```typescript
// src/components/naics/naics-multi-select.tsx
interface NaicsCode {
  code: string; // e.g., "541512"
  description: string; // e.g., "Computer Systems Design Services"
}

interface NaicsMultiSelectProps {
  selected: NaicsCode[];
  onChange: (codes: NaicsCode[]) => void;
  extracted?: NaicsCode[]; // from RFP, shown as suggestions
  placeholder?: string;
}
// Supports: type-ahead search, multi-select tags, comma-paste bulk entry
```

### Changelog

```typescript
// src/data/changelog.json structure
interface ChangelogEntry {
  version: string; // e.g., "2.1.0"
  date: string; // ISO date
  title: string; // e.g., "Reliability & UX Improvements"
  categories: {
    type: "new" | "improved" | "fixed";
    items: string[];
  }[];
}

// User tracking: last_viewed_changelog timestamp in user_preferences
// Badge logic: show if latest entry.date > last_viewed_changelog
```

## Edge Cases

| Scenario                       | Handling                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Parallel batch hits rate limit | Catch 429, wait for retry-after header, continue batch. Log for monitoring.       |
| Section fails in batch         | Mark individual section FAILED, continue other sections. Show per-section retry.  |
| Progress polling gap           | If no progress update in 30s, show "Still working..." with elapsed timer fallback |
