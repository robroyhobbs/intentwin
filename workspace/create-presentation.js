const pptxgen = require('pptxgenjs');
const path = require('path');

// Get html2pptx from the skill directory
const html2pptx = require('/Users/robroyhobbs/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/pptx/scripts/html2pptx.js');

async function createPresentation() {
    const pptx = new pptxgen();

    // Set presentation properties
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Capgemini';
    pptx.title = 'ProposalAI: Intelligent Proposal Generation';
    pptx.subject = 'Stakeholder Presentation';
    pptx.company = 'Capgemini';

    const slidesDir = path.join(__dirname, 'slides');

    // Define slides in order
    const slideFiles = [
        'slide01-title.html',
        'slide02-challenge.html',
        'slide03-introducing.html',
        'slide04-methodology.html',
        'slide05-differentiators.html',
        'slide06-workflow.html',
        'slide07-benefits.html',
        'slide08-features.html',
        'slide09-roadmap.html',
        'slide10-cta.html'
    ];

    console.log('Creating ProposalAI stakeholder presentation...\n');

    // Process each slide
    for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const slidePath = path.join(slidesDir, slideFile);

        console.log(`Processing slide ${i + 1}: ${slideFile}`);

        try {
            await html2pptx(slidePath, pptx);
            console.log(`  ✓ Slide ${i + 1} created successfully`);
        } catch (error) {
            console.error(`  ✗ Error creating slide ${i + 1}:`, error.message);
            throw error;
        }
    }

    // Save the presentation
    const outputPath = path.join(__dirname, 'ProposalAI-Stakeholder-Presentation.pptx');
    await pptx.writeFile({ fileName: outputPath });

    console.log(`\n✓ Presentation saved to: ${outputPath}`);
    console.log(`\nTotal slides: ${slideFiles.length}`);

    return outputPath;
}

createPresentation()
    .then(outputPath => {
        console.log('\nPresentation created successfully!');
    })
    .catch(error => {
        console.error('\nError creating presentation:', error);
        process.exit(1);
    });
