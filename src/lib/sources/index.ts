/**
 * Sources Library
 *
 * Load and format static source materials from the sources/ directory
 * for injection into proposal generation prompts.
 *
 * Usage:
 * ```typescript
 * import { loadSources, formatSourcesAsL1Context } from '@/lib/sources';
 *
 * const sources = await loadSources();
 * const l1Context = formatSourcesAsL1Context(sources, {
 *   opportunityType: 'cloud_migration',
 *   industry: 'financial_services',
 * });
 * ```
 */

// Parser exports
export {
  parseSourceDocument,
  extractTables,
  extractBulletPoints,
  getSection,
  getSections,
  type ParsedSourceDocument,
  type SourceMetadata,
  type SourceSection,
} from './parser';

// Loader exports
export {
  loadSources,
  extractMetrics,
  extractCaseStudy,
  extractMethodology,
  filterByContentType,
  filterVerified,
  getRelevantSources,
  type LoadedSources,
  type LoadedSource,
  type SourceCategory,
  type ExtractedMetric,
  type ExtractedCaseStudy,
  type ExtractedMethodology,
} from './loader';

// Formatter exports
export {
  formatSourcesAsL1Context,
  formatSourcesForSection,
} from './formatter';
