/**
 * Sources Library — public API
 *
 * Load and format static source materials from the sources/ directory
 * for injection into proposal generation prompts.
 *
 * Tests and internal modules import directly from parser.ts, loader.ts,
 * and formatter.ts. This barrel exports only the symbols used by
 * application code.
 */

export { loadSources } from "./loader";
export { formatSourcesAsL1Context } from "./formatter";
