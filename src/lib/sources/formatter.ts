import {
  LoadedSources,
  LoadedSource,
  extractMetrics,
  extractCaseStudy,
  extractMethodology,
} from './loader';
import { getSection, extractBulletPoints, extractTables } from './parser';

/**
 * Format loaded sources as L1 context string for prompt injection
 *
 * Output format matches the existing pipeline.ts buildL1ContextString() format
 */
export function formatSourcesAsL1Context(
  sources: LoadedSources,
  options: {
    opportunityType?: string;
    industry?: string;
    includeFullContent?: boolean;
  } = {}
): string {
  const sections: string[] = [];

  // 1. Company Profile
  const companyProfile = formatCompanyProfile(sources.companyContext);
  if (companyProfile) {
    sections.push(companyProfile);
  }

  // 2. Certifications & Partnerships
  const certifications = formatCertifications(sources.evidenceLibrary, sources.companyContext);
  if (certifications) {
    sections.push(certifications);
  }

  // 3. Methodologies (filtered by opportunity type if provided)
  const methodologies = formatMethodologies(sources.methodologies, options.opportunityType);
  if (methodologies) {
    sections.push(methodologies);
  }

  // 4. Case Studies (filtered by industry if provided)
  const caseStudies = formatCaseStudies(sources.caseStudies, options.industry);
  if (caseStudies) {
    sections.push(caseStudies);
  }

  // 5. Success Metrics
  const metrics = formatSuccessMetrics(sources.evidenceLibrary);
  if (metrics) {
    sections.push(metrics);
  }

  // 6. Service Offerings
  const services = formatServiceOfferings(sources.serviceCatalog);
  if (services) {
    sections.push(services);
  }

  if (sections.length === 0) {
    return '';
  }

  return `

=== STATIC SOURCES (L1 - Verified Content) ===

${sections.join('\n\n')}

=== END STATIC SOURCES ===
`;
}

/**
 * Format company profile section
 */
function formatCompanyProfile(companyContext: LoadedSource[]): string | null {
  if (companyContext.length === 0) return null;

  const lines: string[] = ['## Company Profile'];

  for (const source of companyContext) {
    const doc = source.document;

    // Extract key facts from Company Profile section
    const profileSection = getSection(doc, 'company profile') || getSection(doc, 'key facts');
    if (profileSection) {
      const bullets = extractBulletPoints(profileSection.content);
      for (const bullet of bullets) {
        lines.push(`- ${bullet}`);
      }
    }

    // Extract service lines
    const servicesSection = getSection(doc, 'service lines');
    if (servicesSection) {
      const bullets = extractBulletPoints(servicesSection.content);
      if (bullets.length > 0) {
        lines.push(`- **Service Lines**: ${bullets.join(', ')}`);
      }
    }

    // Extract core values
    const valuesSection = getSection(doc, 'core values') || getSection(doc, 'values');
    if (valuesSection) {
      const bullets = extractBulletPoints(valuesSection.content);
      if (bullets.length > 0) {
        lines.push('');
        lines.push('### Core Values');
        lines.push(bullets.join(', '));
      }
    }

    // Extract market position/recognition
    const marketSection = getSection(doc, 'market position') || getSection(doc, 'recognition');
    if (marketSection) {
      const bullets = extractBulletPoints(marketSection.content);
      if (bullets.length > 0) {
        lines.push('');
        lines.push('### Industry Recognition');
        for (const bullet of bullets.slice(0, 5)) {
          lines.push(`- ${bullet}`);
        }
      }
    }
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Format certifications and partnerships section
 */
function formatCertifications(
  evidenceLibrary: LoadedSource[],
  companyContext: LoadedSource[]
): string | null {
  const lines: string[] = ['## Certifications & Partnerships'];

  // Look for certifications in evidence library
  for (const source of evidenceLibrary) {
    if (source.fileName.includes('certification') || source.fileName.includes('partnership')) {
      const doc = source.document;

      // Extract partnership sections
      const partnerSection =
        getSection(doc, 'cloud partner') ||
        getSection(doc, 'partnership') ||
        getSection(doc, 'key partner');
      if (partnerSection) {
        const bullets = extractBulletPoints(partnerSection.content);
        for (const bullet of bullets) {
          lines.push(`- ${bullet}`);
        }
      }

      // Extract certification sections
      const certSection = getSection(doc, 'certification') || getSection(doc, 'compliance');
      if (certSection) {
        const bullets = extractBulletPoints(certSection.content);
        for (const bullet of bullets) {
          lines.push(`- ${bullet}`);
        }
      }

      // Extract from tables
      const tables = extractTables(doc.content);
      const certTables = tables.filter(t =>
        t.headers.some(h => h.toLowerCase().includes('certification') || h.toLowerCase().includes('vehicle'))
      );
      for (const table of certTables) {
        for (const row of table.rows) {
          lines.push(`- **${row[0]}**: ${row.slice(1).join(' - ')}`);
        }
      }
    }
  }

  // Also check company context for certifications
  for (const source of companyContext) {
    const certSection = getSection(source.document, 'certification');
    if (certSection) {
      const bullets = extractBulletPoints(certSection.content);
      for (const bullet of bullets) {
        if (!lines.includes(`- ${bullet}`)) {
          lines.push(`- ${bullet}`);
        }
      }
    }
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Format methodologies section
 */
function formatMethodologies(
  methodologies: LoadedSource[],
  opportunityType?: string
): string | null {
  if (methodologies.length === 0) return null;

  const lines: string[] = ['## Methodologies'];

  // Filter by opportunity type if provided
  let relevantMethodologies = methodologies;
  if (opportunityType) {
    const keywords = opportunityType.toLowerCase().split('_');
    relevantMethodologies = methodologies.filter(m => {
      const fileName = m.fileName.toLowerCase();
      const title = m.document.title.toLowerCase();
      return keywords.some(kw => fileName.includes(kw) || title.includes(kw));
    });

    // Fall back to all if none match
    if (relevantMethodologies.length === 0) {
      relevantMethodologies = methodologies;
    }
  }

  for (const source of relevantMethodologies) {
    const methodology = extractMethodology(source);
    if (!methodology) continue;

    lines.push('');
    lines.push(`### ${methodology.name}`);

    if (methodology.description) {
      lines.push(methodology.description);
    }

    if (methodology.phases && methodology.phases.length > 0) {
      lines.push('');
      for (const phase of methodology.phases) {
        const duration = phase.duration ? ` (${phase.duration})` : '';
        lines.push(`- **${phase.name}**${duration}: ${phase.description}`);
      }
    }

    if (methodology.deliverables && methodology.deliverables.length > 0) {
      lines.push('');
      lines.push('**Key Deliverables:**');
      for (const deliverable of methodology.deliverables.slice(0, 5)) {
        lines.push(`- ${deliverable}`);
      }
    }
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Format case studies section
 */
function formatCaseStudies(
  caseStudies: LoadedSource[],
  industry?: string
): string | null {
  if (caseStudies.length === 0) return null;

  const lines: string[] = ['## Relevant Case Studies'];

  // Filter by industry if provided
  let relevantCases = caseStudies;
  if (industry) {
    const filtered = caseStudies.filter(cs => {
      const caseStudy = extractCaseStudy(cs);
      return caseStudy?.industry?.toLowerCase().includes(industry.toLowerCase());
    });
    if (filtered.length > 0) {
      relevantCases = filtered;
    }
  }

  // Limit to top 3 case studies
  for (const source of relevantCases.slice(0, 3)) {
    const caseStudy = extractCaseStudy(source);
    if (!caseStudy) continue;

    lines.push('');
    const industryTag = caseStudy.industry ? ` [${caseStudy.industry}]` : '';
    lines.push(`### ${caseStudy.title}${industryTag}`);

    if (caseStudy.client) {
      lines.push(`- **Client**: ${caseStudy.client}`);
    }

    if (caseStudy.challenge) {
      // Truncate challenge to first sentence
      const firstSentence = caseStudy.challenge.split(/[.!?]/)[0];
      if (firstSentence) {
        lines.push(`- **Challenge**: ${firstSentence.trim()}`);
      }
    }

    if (caseStudy.solution) {
      // Truncate solution to first sentence
      const firstSentence = caseStudy.solution.split(/[.!?]/)[0];
      if (firstSentence) {
        lines.push(`- **Approach**: ${firstSentence.trim()}`);
      }
    }

    // Include key metrics
    if (caseStudy.metrics.length > 0) {
      lines.push(`- **Key Metrics**: ${caseStudy.metrics.slice(0, 3).map(m => `${m.name}: ${m.value}`).join(', ')}`);
    }
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Format success metrics section
 */
function formatSuccessMetrics(evidenceLibrary: LoadedSource[]): string | null {
  const lines: string[] = ['## Success Metrics (Verified)'];

  // Look for success metrics file
  const metricsSource = evidenceLibrary.find(s => s.fileName.includes('metrics'));

  if (metricsSource) {
    // Extract tables from metrics document
    const tables = extractTables(metricsSource.document.content);

    for (const table of tables) {
      lines.push('');
      lines.push(`| ${table.headers.join(' | ')} |`);
      lines.push(`| ${table.headers.map(() => '---').join(' | ')} |`);
      for (const row of table.rows.slice(0, 10)) {
        lines.push(`| ${row.join(' | ')} |`);
      }
    }
  }

  // Also extract metrics from other evidence sources
  const allMetrics: Array<{ name: string; value: string }> = [];
  for (const source of evidenceLibrary) {
    if (source.document.metadata.status === 'VERIFIED') {
      const metrics = extractMetrics(source);
      for (const metric of metrics) {
        if (!allMetrics.find(m => m.name === metric.name)) {
          allMetrics.push({ name: metric.name, value: metric.value });
        }
      }
    }
  }

  if (allMetrics.length > 0 && lines.length === 1) {
    lines.push('');
    lines.push('| Metric | Typical Result |');
    lines.push('| --- | --- |');
    for (const metric of allMetrics.slice(0, 10)) {
      lines.push(`| ${metric.name} | ${metric.value} |`);
    }
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Format service offerings section
 */
function formatServiceOfferings(serviceCatalog: LoadedSource[]): string | null {
  if (serviceCatalog.length === 0) return null;

  const lines: string[] = ['## Service Offerings'];

  for (const source of serviceCatalog) {
    const doc = source.document;

    // Extract service overview
    const overviewSection = getSection(doc, 'overview');
    if (overviewSection) {
      lines.push('');
      lines.push(`### ${doc.title}`);
      const firstParagraph = overviewSection.content.split('\n\n')[0];
      if (firstParagraph) {
        lines.push(firstParagraph.trim());
      }
    }

    // Extract pricing info
    const pricingSection = getSection(doc, 'pricing');
    if (pricingSection) {
      const bullets = extractBulletPoints(pricingSection.content);
      if (bullets.length > 0) {
        lines.push('');
        lines.push('**Pricing Models:**');
        for (const bullet of bullets.slice(0, 4)) {
          lines.push(`- ${bullet}`);
        }
      }
    }

    // Extract offerings table
    const tables = extractTables(doc.content);
    for (const table of tables) {
      if (table.headers.some(h =>
        h.toLowerCase().includes('service') ||
        h.toLowerCase().includes('offering') ||
        h.toLowerCase().includes('package')
      )) {
        lines.push('');
        for (const row of table.rows.slice(0, 5)) {
          lines.push(`- **${row[0]}**: ${row.slice(1).join(' - ')}`);
        }
        break;
      }
    }
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Format sources for a specific proposal section
 */
export function formatSourcesForSection(
  sources: LoadedSources,
  sectionType: string,
  options: { opportunityType?: string; industry?: string } = {}
): string {
  const sections: string[] = [];

  switch (sectionType) {
    case 'executive_summary':
      // Include company overview and key differentiators
      const company = formatCompanyProfile(sources.companyContext);
      if (company) sections.push(company);
      const certs = formatCertifications(sources.evidenceLibrary, sources.companyContext);
      if (certs) sections.push(certs);
      break;

    case 'methodology':
    case 'proposed_approach':
      // Focus on methodologies
      const methods = formatMethodologies(sources.methodologies, options.opportunityType);
      if (methods) sections.push(methods);
      break;

    case 'case_studies':
    case 'relevant_experience':
      // Focus on case studies
      const cases = formatCaseStudies(sources.caseStudies, options.industry);
      if (cases) sections.push(cases);
      break;

    case 'why_us':
    case 'why_intentwin':
    case 'why_capgemini': // legacy alias
      // Include everything
      return formatSourcesAsL1Context(sources, options);

    default:
      // Return relevant subset
      return formatSourcesAsL1Context(sources, options);
  }

  if (sections.length === 0) {
    return '';
  }

  return `\n\n=== REFERENCE MATERIAL ===\n${sections.join('\n\n')}\n=== END REFERENCE MATERIAL ===\n`;
}
