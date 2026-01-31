import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, basename } from 'path';
import {
  parseSourceDocument,
  ParsedSourceDocument,
  extractTables,
  extractBulletPoints,
  getSection,
} from './parser';

// Source directory paths
const SOURCES_DIR = join(process.cwd(), 'sources');

// Source categories matching directory structure
export type SourceCategory =
  | 'company-context'
  | 'methodologies'
  | 'case-studies'
  | 'service-catalog'
  | 'evidence-library'
  | 'proposal-examples';

// Loaded source with parsed content and file info
export interface LoadedSource {
  filePath: string;
  fileName: string;
  category: SourceCategory;
  document: ParsedSourceDocument;
}

// Organized sources by category
export interface LoadedSources {
  companyContext: LoadedSource[];
  methodologies: LoadedSource[];
  caseStudies: LoadedSource[];
  serviceCatalog: LoadedSource[];
  evidenceLibrary: LoadedSource[];
  proposalExamples: LoadedSource[];
  all: LoadedSource[];
}

// Metric extracted from source documents
export interface ExtractedMetric {
  name: string;
  value: string;
  context?: string;
  source: string;
}

// Case study extracted from source documents
export interface ExtractedCaseStudy {
  title: string;
  client?: string;
  industry?: string;
  challenge?: string;
  solution?: string;
  outcomes?: string[];
  metrics: ExtractedMetric[];
  source: string;
}

// Methodology extracted from source documents
export interface ExtractedMethodology {
  name: string;
  description?: string;
  phases?: Array<{ name: string; description: string; duration?: string }>;
  deliverables?: string[];
  source: string;
}

/**
 * Load all markdown files from a directory
 */
function loadDirectory(dirPath: string, category: SourceCategory): LoadedSource[] {
  const sources: LoadedSource[] = [];

  if (!existsSync(dirPath)) {
    return sources;
  }

  const files = readdirSync(dirPath);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isFile()) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const document = parseSourceDocument(content);

        sources.push({
          filePath,
          fileName: basename(file, '.md'),
          category,
          document,
        });
      } catch (error) {
        console.error(`Failed to parse source file: ${filePath}`, error);
      }
    }
  }

  return sources;
}

/**
 * Load all sources from the sources/ directory
 */
export async function loadSources(): Promise<LoadedSources> {
  const companyContext = loadDirectory(join(SOURCES_DIR, 'company-context'), 'company-context');
  const methodologies = loadDirectory(join(SOURCES_DIR, 'methodologies'), 'methodologies');
  const caseStudies = loadDirectory(join(SOURCES_DIR, 'case-studies'), 'case-studies');
  const serviceCatalog = loadDirectory(join(SOURCES_DIR, 'service-catalog'), 'service-catalog');
  const evidenceLibrary = loadDirectory(join(SOURCES_DIR, 'evidence-library'), 'evidence-library');
  const proposalExamples = loadDirectory(join(SOURCES_DIR, 'proposal-examples'), 'proposal-examples');

  const all = [
    ...companyContext,
    ...methodologies,
    ...caseStudies,
    ...serviceCatalog,
    ...evidenceLibrary,
    ...proposalExamples,
  ];

  return {
    companyContext,
    methodologies,
    caseStudies,
    serviceCatalog,
    evidenceLibrary,
    proposalExamples,
    all,
  };
}

/**
 * Extract metrics from a source document
 */
export function extractMetrics(source: LoadedSource): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = [];
  const doc = source.document;

  // Look for tables with metric data
  const tables = extractTables(doc.content);
  for (const table of tables) {
    // Check if this looks like a metrics table
    const metricIdx = table.headers.findIndex(h =>
      h.toLowerCase().includes('metric') || h.toLowerCase().includes('result')
    );
    const valueIdx = table.headers.findIndex(h =>
      h.toLowerCase().includes('value') ||
      h.toLowerCase().includes('result') ||
      h.toLowerCase().includes('typical')
    );

    if (metricIdx >= 0 || valueIdx >= 0) {
      for (const row of table.rows) {
        if (row.length >= 2) {
          metrics.push({
            name: row[0],
            value: row[valueIdx >= 0 ? valueIdx : 1],
            source: source.fileName,
          });
        }
      }
    }
  }

  // Look for sections with "Metrics" or "Outcomes" in heading
  const metricsSection = doc.sections.find(s =>
    s.heading.toLowerCase().includes('metric') ||
    s.heading.toLowerCase().includes('outcome') ||
    s.heading.toLowerCase().includes('result')
  );

  if (metricsSection) {
    const bullets = extractBulletPoints(metricsSection.content);
    for (const bullet of bullets) {
      // Try to extract name: value pattern
      const match = bullet.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        metrics.push({
          name: match[1].trim(),
          value: match[2].trim(),
          source: source.fileName,
        });
      }
    }
  }

  return metrics;
}

/**
 * Extract case study details from a source document
 */
export function extractCaseStudy(source: LoadedSource): ExtractedCaseStudy | null {
  if (source.category !== 'case-studies') return null;

  const doc = source.document;

  // Extract client info from "Client Profile" table or section
  let client: string | undefined;
  let industry: string | undefined;

  const clientSection = getSection(doc, 'client');
  if (clientSection) {
    const tables = extractTables(clientSection.content);
    for (const table of tables) {
      for (const row of table.rows) {
        if (row[0]?.toLowerCase().includes('company')) {
          client = row[1];
        }
        if (row[0]?.toLowerCase().includes('industry')) {
          industry = row[1];
        }
      }
    }
  }

  // Extract challenge
  const challengeSection = getSection(doc, 'challenge');
  const challenge = challengeSection?.content;

  // Extract solution/approach
  const solutionSection = getSection(doc, 'solution') || getSection(doc, 'approach');
  const solution = solutionSection?.content;

  // Extract outcomes
  const outcomesSection = getSection(doc, 'outcome') || getSection(doc, 'key outcome');
  const outcomes = outcomesSection ? extractBulletPoints(outcomesSection.content) : undefined;

  // Extract metrics
  const metrics = extractMetrics(source);

  return {
    title: doc.title,
    client,
    industry,
    challenge,
    solution,
    outcomes,
    metrics,
    source: source.fileName,
  };
}

/**
 * Extract methodology details from a source document
 */
export function extractMethodology(source: LoadedSource): ExtractedMethodology | null {
  if (source.category !== 'methodologies') return null;

  const doc = source.document;

  // Extract description from Overview section
  const overviewSection = getSection(doc, 'overview');
  const description = overviewSection?.content.split('\n')[0];

  // Extract phases
  const phases: Array<{ name: string; description: string; duration?: string }> = [];

  // Look for phase sections
  const phaseSections = doc.sections.filter(s =>
    s.heading.toLowerCase().includes('phase') ||
    s.heading.toLowerCase().includes('stage')
  );

  for (const section of phaseSections) {
    const durationMatch = section.heading.match(/\(([^)]+)\)/);
    phases.push({
      name: section.heading.replace(/\([^)]+\)/, '').trim(),
      description: section.content.split('\n')[0] || '',
      duration: durationMatch?.[1],
    });
  }

  // Extract deliverables
  const deliverablesSection = getSection(doc, 'deliverable');
  const deliverables = deliverablesSection
    ? extractBulletPoints(deliverablesSection.content)
    : undefined;

  return {
    name: doc.title,
    description,
    phases: phases.length > 0 ? phases : undefined,
    deliverables,
    source: source.fileName,
  };
}

/**
 * Filter sources by content type from metadata
 */
export function filterByContentType(
  sources: LoadedSource[],
  contentType: string
): LoadedSource[] {
  return sources.filter(s =>
    s.document.metadata.content_type?.toLowerCase() === contentType.toLowerCase()
  );
}

/**
 * Filter sources by verification status
 */
export function filterVerified(sources: LoadedSource[]): LoadedSource[] {
  return sources.filter(s => s.document.metadata.status === 'VERIFIED');
}

/**
 * Get sources relevant to a specific opportunity type
 */
export function getRelevantSources(
  sources: LoadedSources,
  opportunityType: string,
  industry?: string
): LoadedSource[] {
  const relevant: LoadedSource[] = [];

  // Always include company context
  relevant.push(...sources.companyContext);

  // Include evidence library (certifications, metrics)
  relevant.push(...sources.evidenceLibrary);

  // Filter methodologies by opportunity type
  const opportunityKeywords = opportunityType.toLowerCase().split('_');
  for (const source of sources.methodologies) {
    const fileName = source.fileName.toLowerCase();
    const title = source.document.title.toLowerCase();

    if (opportunityKeywords.some(kw => fileName.includes(kw) || title.includes(kw))) {
      relevant.push(source);
    }
  }

  // Filter case studies by industry if provided
  for (const source of sources.caseStudies) {
    if (industry) {
      const caseStudy = extractCaseStudy(source);
      if (caseStudy?.industry?.toLowerCase().includes(industry.toLowerCase())) {
        relevant.push(source);
        continue;
      }
    }
    // Include all case studies if no industry filter
    relevant.push(source);
  }

  // Include service catalog
  relevant.push(...sources.serviceCatalog);

  return relevant;
}
