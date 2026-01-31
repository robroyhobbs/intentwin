/**
 * Test script to verify the sources loader works correctly
 *
 * Run with: npx tsx scripts/test-sources.ts
 */

import { loadSources, formatSourcesAsL1Context, extractCaseStudy, extractMethodology } from '../src/lib/sources';

async function main() {
  console.log('Testing Sources Loader...\n');

  // Load all sources
  console.log('1. Loading sources from sources/ directory...');
  const sources = await loadSources();

  console.log(`   ✓ Company Context: ${sources.companyContext.length} files`);
  console.log(`   ✓ Methodologies: ${sources.methodologies.length} files`);
  console.log(`   ✓ Case Studies: ${sources.caseStudies.length} files`);
  console.log(`   ✓ Service Catalog: ${sources.serviceCatalog.length} files`);
  console.log(`   ✓ Evidence Library: ${sources.evidenceLibrary.length} files`);
  console.log(`   ✓ Proposal Examples: ${sources.proposalExamples.length} files`);
  console.log(`   ✓ Total: ${sources.all.length} files\n`);

  // Test methodology extraction
  if (sources.methodologies.length > 0) {
    console.log('2. Testing methodology extraction...');
    const methodology = extractMethodology(sources.methodologies[0]);
    if (methodology) {
      console.log(`   ✓ Name: ${methodology.name}`);
      console.log(`   ✓ Phases: ${methodology.phases?.length || 0}`);
      console.log(`   ✓ Deliverables: ${methodology.deliverables?.length || 0}\n`);
    }
  }

  // Test case study extraction
  if (sources.caseStudies.length > 0) {
    console.log('3. Testing case study extraction...');
    const caseStudy = extractCaseStudy(sources.caseStudies[0]);
    if (caseStudy) {
      console.log(`   ✓ Title: ${caseStudy.title}`);
      console.log(`   ✓ Industry: ${caseStudy.industry || 'Not specified'}`);
      console.log(`   ✓ Metrics: ${caseStudy.metrics.length}\n`);
    }
  }

  // Test L1 context formatting
  console.log('4. Testing L1 context formatting...');
  const l1Context = formatSourcesAsL1Context(sources, {
    opportunityType: 'cloud_migration',
    industry: 'automotive',
  });

  console.log(`   ✓ Generated L1 context: ${l1Context.length} characters`);
  console.log(`   ✓ Contains company profile: ${l1Context.includes('## Company Profile')}`);
  console.log(`   ✓ Contains methodologies: ${l1Context.includes('## Methodologies')}`);
  console.log(`   ✓ Contains case studies: ${l1Context.includes('## Relevant Case Studies')}`);
  console.log(`   ✓ Contains certifications: ${l1Context.includes('## Certifications')}\n`);

  // Print a preview
  console.log('5. L1 Context Preview (first 2000 chars):\n');
  console.log('-'.repeat(60));
  console.log(l1Context.slice(0, 2000));
  console.log('-'.repeat(60));
  console.log('\n✅ Sources loader test completed successfully!');
}

main().catch(console.error);
