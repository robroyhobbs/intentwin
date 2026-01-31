const pptxgen = require('pptxgenjs');
const path = require('path');

// Capgemini brand colors (without # for PptxGenJS)
const COLORS = {
    navy: '1B365D',
    blue: '0070AD',
    cyan: '12ABDB',
    white: 'FFFFFF',
    lightGray: 'F5F7FA',
    darkGray: '666666',
    text: '1B365D'
};

async function createPresentation() {
    const pptx = new pptxgen();

    // Set presentation properties
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Capgemini';
    pptx.title = 'ProposalAI: Intelligent Proposal Generation';
    pptx.subject = 'Stakeholder Presentation';
    pptx.company = 'Capgemini';

    // Define master slides
    pptx.defineSlideMaster({
        title: 'TITLE_SLIDE',
        background: { color: COLORS.navy },
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: COLORS.cyan } } },
            { rect: { x: 0, y: 5.0, w: '100%', h: 0.6, fill: { color: COLORS.blue } } }
        ]
    });

    pptx.defineSlideMaster({
        title: 'CONTENT_SLIDE',
        background: { color: COLORS.white },
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: COLORS.navy } } }
        ]
    });

    console.log('Creating ProposalAI stakeholder presentation...\n');

    // Slide 1: Title
    createTitleSlide(pptx);
    console.log('✓ Slide 1: Title');

    // Slide 2: The Challenge
    createChallengeSlide(pptx);
    console.log('✓ Slide 2: The Challenge');

    // Slide 3: Introducing ProposalAI
    createIntroducingSlide(pptx);
    console.log('✓ Slide 3: Introducing ProposalAI');

    // Slide 4: IDD Methodology
    createMethodologySlide(pptx);
    console.log('✓ Slide 4: IDD Methodology');

    // Slide 5: Why We're Different
    createDifferentiatorsSlide(pptx);
    console.log('✓ Slide 5: Why We\'re Different');

    // Slide 6: How It Works
    createWorkflowSlide(pptx);
    console.log('✓ Slide 6: How It Works');

    // Slide 7: Key Benefits
    createBenefitsSlide(pptx);
    console.log('✓ Slide 7: Key Benefits');

    // Slide 8: Platform Features
    createFeaturesSlide(pptx);
    console.log('✓ Slide 8: Platform Features');

    // Slide 9: Future Roadmap
    createRoadmapSlide(pptx);
    console.log('✓ Slide 9: Future Roadmap');

    // Slide 10: Call to Action
    createCTASlide(pptx);
    console.log('✓ Slide 10: Call to Action');

    // Save the presentation
    const outputPath = path.join(__dirname, 'ProposalAI-Stakeholder-Presentation.pptx');
    await pptx.writeFile({ fileName: outputPath });

    console.log(`\n✓ Presentation saved to: ${outputPath}`);
    console.log(`\nTotal slides: 10`);

    return outputPath;
}

function createTitleSlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });

    slide.addText('ProposalAI', {
        x: 0.5, y: 1.8, w: 9, h: 1,
        fontSize: 54, bold: true, color: COLORS.white,
        align: 'center'
    });

    slide.addText('Intelligent Proposal Generation', {
        x: 0.5, y: 2.8, w: 9, h: 0.6,
        fontSize: 28, color: COLORS.cyan,
        align: 'center'
    });

    slide.addText('Transforming How Capgemini Wins Business', {
        x: 0.5, y: 3.5, w: 9, h: 0.5,
        fontSize: 18, color: COLORS.white,
        align: 'center'
    });

    slide.addText('Capgemini Internal | Stakeholder Presentation', {
        x: 0, y: 5.1, w: 10, h: 0.4,
        fontSize: 12, color: COLORS.white,
        align: 'center'
    });
}

function createChallengeSlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    // Header
    addHeaderWithAccent(slide, 'The Challenge', pptx);

    // Intro text
    slide.addText('Our current proposal process creates bottlenecks and inconsistencies:', {
        x: 0.6, y: 1.1, w: 8.5, h: 0.4,
        fontSize: 14, color: COLORS.text
    });

    // Challenge items
    const challenges = [
        { icon: 'TIME', text: 'Proposals take weeks to complete, missing opportunities' },
        { icon: 'QUALITY', text: 'Inconsistent output quality across teams and regions' },
        { icon: 'KNOWLEDGE', text: 'Best practices and case studies scattered across silos' },
        { icon: 'RESOURCES', text: 'Senior experts bottlenecked on repetitive writing tasks' },
        { icon: 'REUSE', text: 'Winning strategies rarely captured or replicated' },
        { icon: 'SCALE', text: 'Cannot pursue more opportunities with current capacity' }
    ];

    const cols = 3;
    const rows = 2;
    const boxW = 2.9;
    const boxH = 1.0;
    const startX = 0.6;
    const startY = 1.6;
    const gapX = 0.15;
    const gapY = 0.15;

    challenges.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = startX + col * (boxW + gapX);
        const y = startY + row * (boxH + gapY);

        // Box background
        slide.addShape(pptx.shapes.RECTANGLE, {
            x: x, y: y, w: boxW, h: boxH,
            fill: { color: COLORS.lightGray },
            line: { color: COLORS.lightGray }
        });

        // Left accent
        slide.addShape(pptx.shapes.RECTANGLE, {
            x: x, y: y, w: 0.05, h: boxH,
            fill: { color: COLORS.blue },
            line: { color: COLORS.blue }
        });

        // Icon label
        slide.addText(item.icon, {
            x: x + 0.15, y: y + 0.1, w: boxW - 0.2, h: 0.25,
            fontSize: 10, bold: true, color: COLORS.blue
        });

        // Text
        slide.addText(item.text, {
            x: x + 0.15, y: y + 0.35, w: boxW - 0.25, h: 0.6,
            fontSize: 11, color: COLORS.text
        });
    });

    // Stat box
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 7.2, y: 4.0, w: 2.5, h: 1.2,
        fill: { color: COLORS.cyan },
        rectRadius: 0.05
    });

    slide.addText('4-6 weeks', {
        x: 7.2, y: 4.15, w: 2.5, h: 0.5,
        fontSize: 26, bold: true, color: COLORS.white,
        align: 'center'
    });

    slide.addText('Average proposal cycle time', {
        x: 7.2, y: 4.7, w: 2.5, h: 0.4,
        fontSize: 10, color: COLORS.white,
        align: 'center'
    });
}

function createIntroducingSlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    addHeaderWithAccent(slide, 'Introducing ProposalAI', pptx);

    // Left column
    slide.addText('AI-Powered Proposal Generation', {
        x: 0.6, y: 1.1, w: 5, h: 0.4,
        fontSize: 18, bold: true, color: COLORS.blue
    });

    slide.addText('ProposalAI is an intelligent platform that leverages Capgemini\'s collective knowledge to generate winning proposals in hours, not weeks.', {
        x: 0.6, y: 1.6, w: 5, h: 0.8,
        fontSize: 13, color: COLORS.text
    });

    slide.addText('It combines our methodologies, case studies, and institutional expertise with advanced AI to create consistent, high-quality proposals at scale.', {
        x: 0.6, y: 2.5, w: 5, h: 0.8,
        fontSize: 13, color: COLORS.text
    });

    // Highlight box
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.6, y: 3.4, w: 5, h: 1.0,
        fill: { color: COLORS.blue },
        rectRadius: 0.05
    });

    slide.addText('Hours, Not Weeks', {
        x: 0.6, y: 3.55, w: 5, h: 0.4,
        fontSize: 22, bold: true, color: COLORS.white,
        align: 'center'
    });

    slide.addText('From initial brief to complete proposal', {
        x: 0.6, y: 3.95, w: 5, h: 0.3,
        fontSize: 12, color: COLORS.white,
        align: 'center'
    });

    // Right column - Feature cards
    const features = [
        { title: 'Embedded Expertise', desc: 'Built-in Capgemini methodologies, frameworks, and best practices' },
        { title: 'Verified Content', desc: 'Real case studies with verified metrics and outcomes' },
        { title: 'Intent-Driven', desc: 'Every proposal aligned to client outcomes and win strategy' },
        { title: 'Human Quality', desc: 'AI generates, humans review and refine' }
    ];

    features.forEach((f, i) => {
        const y = 1.1 + i * 0.95;

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: 6.0, y: y, w: 3.7, h: 0.85,
            fill: { color: COLORS.lightGray },
            rectRadius: 0.03
        });

        slide.addText(f.title, {
            x: 6.15, y: y + 0.1, w: 3.4, h: 0.3,
            fontSize: 12, bold: true, color: COLORS.blue
        });

        slide.addText(f.desc, {
            x: 6.15, y: y + 0.4, w: 3.4, h: 0.4,
            fontSize: 10, color: COLORS.text
        });
    });
}

function createMethodologySlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    addHeaderWithAccent(slide, 'Intent-Driven Development (IDD)', pptx);

    slide.addText('A 3-Layer Context Model for Trustworthy AI Generation', {
        x: 0.6, y: 1.1, w: 8.5, h: 0.35,
        fontSize: 16, bold: true, color: COLORS.blue
    });

    // Three layers
    const layers = [
        { label: 'L1', title: 'Company Truth', desc: 'Verified capabilities, certifications, case studies, and methodologies. The canonical source of what we can claim.', color: COLORS.navy },
        { label: 'L2', title: 'Proposal Intent', desc: 'Client outcomes, win strategy, constraints, and success metrics. Human-defined goals that guide generation.', color: COLORS.blue },
        { label: 'L3', title: 'Generated Content', desc: 'AI-created proposal sections, reviewed and refined by humans. Every claim traceable to L1 sources.', color: COLORS.cyan }
    ];

    const layerW = 3.0;
    const startX = 0.6;
    const gapX = 0.15;

    layers.forEach((layer, i) => {
        const x = startX + i * (layerW + gapX);

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: x, y: 1.6, w: layerW, h: 2.3,
            fill: { color: layer.color },
            rectRadius: 0.05
        });

        slide.addText(layer.label, {
            x: x, y: 1.7, w: layerW, h: 0.3,
            fontSize: 11, color: COLORS.white,
            align: 'center'
        });

        slide.addText(layer.title, {
            x: x, y: 2.0, w: layerW, h: 0.4,
            fontSize: 16, bold: true, color: COLORS.white,
            align: 'center'
        });

        slide.addText(layer.desc, {
            x: x + 0.15, y: 2.5, w: layerW - 0.3, h: 1.2,
            fontSize: 10, color: COLORS.white,
            align: 'center'
        });
    });

    // Key point box
    slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.6, y: 4.2, w: 8.7, h: 0.8,
        fill: { color: COLORS.lightGray },
        line: { color: COLORS.lightGray }
    });

    slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.6, y: 4.2, w: 0.05, h: 0.8,
        fill: { color: COLORS.cyan },
        line: { color: COLORS.cyan }
    });

    slide.addText('KEY DIFFERENTIATOR', {
        x: 0.8, y: 4.3, w: 8, h: 0.25,
        fontSize: 10, bold: true, color: COLORS.blue
    });

    slide.addText('Every claim in every proposal is traceable to verified company sources', {
        x: 0.8, y: 4.55, w: 8, h: 0.35,
        fontSize: 14, bold: true, color: COLORS.text
    });
}

function createDifferentiatorsSlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    addHeaderWithAccent(slide, 'Why We\'re Different', pptx);

    const diffs = [
        { title: 'Embedded Methodologies', desc: 'Built-in CCMF, ADMnext, and eAPM frameworks ensure consistent, proven approaches' },
        { title: 'Verified Case Studies', desc: 'Real examples with metrics: BMW 5,200+ apps, HMRC £245M contract, aerospace migrations' },
        { title: 'Intent-First Approach', desc: 'Start with client outcomes and win strategy - every section aligned to what matters most' },
        { title: 'Human-in-the-Loop', desc: 'AI accelerates, humans validate. Quality control at every stage of the process' },
        { title: 'Full Lifecycle', desc: 'Not just generation - review, collaboration, versioning, and multi-format export' },
        { title: 'Traceable Claims', desc: 'Every claim links back to verified sources. No hallucinations, no unsupported statements' }
    ];

    const cols = 3;
    const boxW = 3.0;
    const boxH = 1.25;
    const startX = 0.6;
    const startY = 1.1;
    const gapX = 0.15;
    const gapY = 0.15;

    diffs.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = startX + col * (boxW + gapX);
        const y = startY + row * (boxH + gapY);

        slide.addShape(pptx.shapes.RECTANGLE, {
            x: x, y: y, w: boxW, h: boxH,
            fill: { color: COLORS.lightGray },
            line: { color: COLORS.lightGray }
        });

        slide.addShape(pptx.shapes.RECTANGLE, {
            x: x, y: y, w: boxW, h: 0.05,
            fill: { color: COLORS.blue },
            line: { color: COLORS.blue }
        });

        slide.addText(item.title, {
            x: x + 0.15, y: y + 0.15, w: boxW - 0.3, h: 0.35,
            fontSize: 12, bold: true, color: COLORS.text
        });

        slide.addText(item.desc, {
            x: x + 0.15, y: y + 0.5, w: boxW - 0.3, h: 0.7,
            fontSize: 10, color: COLORS.text
        });
    });

    // Bottom message
    slide.addText('This isn\'t generic AI - it\'s Capgemini\'s institutional knowledge, made accessible', {
        x: 0.5, y: 4.6, w: 9, h: 0.4,
        fontSize: 13, italic: true, color: COLORS.text,
        align: 'center'
    });
}

function createWorkflowSlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    addHeaderWithAccent(slide, 'How It Works', pptx);

    const steps = [
        { num: '1', title: 'Define', desc: 'Enter client details, industry, and opportunity type' },
        { num: '2', title: 'Outcomes', desc: 'Set desired outcomes, win strategy, and constraints' },
        { num: '3', title: 'Generate', desc: 'AI creates sections using company context' },
        { num: '4', title: 'Review', desc: 'Refine content, collaborate with team' },
        { num: '5', title: 'Export', desc: 'Download in your preferred format' }
    ];

    const startX = 0.5;
    const stepW = 1.7;
    const gap = 0.25;

    steps.forEach((step, i) => {
        const x = startX + i * (stepW + gap);

        // Circle
        slide.addShape(pptx.shapes.OVAL, {
            x: x + (stepW - 0.7) / 2, y: 1.3, w: 0.7, h: 0.7,
            fill: { color: COLORS.blue }
        });

        // Number
        slide.addText(step.num, {
            x: x + (stepW - 0.7) / 2, y: 1.4, w: 0.7, h: 0.5,
            fontSize: 22, bold: true, color: COLORS.white,
            align: 'center'
        });

        // Title
        slide.addText(step.title, {
            x: x, y: 2.1, w: stepW, h: 0.35,
            fontSize: 12, bold: true, color: COLORS.text,
            align: 'center'
        });

        // Description
        slide.addText(step.desc, {
            x: x, y: 2.45, w: stepW, h: 0.6,
            fontSize: 9, color: COLORS.darkGray,
            align: 'center'
        });

        // Arrow (except last)
        if (i < steps.length - 1) {
            slide.addText('>', {
                x: x + stepW + 0.05, y: 1.4, w: 0.2, h: 0.5,
                fontSize: 18, color: COLORS.cyan,
                align: 'center'
            });
        }
    });

    // Bottom boxes
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 1.5, y: 3.6, w: 2.8, h: 0.9,
        fill: { color: COLORS.lightGray },
        rectRadius: 0.03
    });

    slide.addText('EXPORT FORMATS', {
        x: 1.5, y: 3.7, w: 2.8, h: 0.3,
        fontSize: 10, bold: true, color: COLORS.blue,
        align: 'center'
    });

    slide.addText('PPTX, DOCX, PDF, Web', {
        x: 1.5, y: 4.0, w: 2.8, h: 0.4,
        fontSize: 11, color: COLORS.text,
        align: 'center'
    });

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 4.7, y: 3.6, w: 4.5, h: 0.9,
        fill: { color: COLORS.lightGray },
        rectRadius: 0.03
    });

    slide.addText('SECTIONS GENERATED', {
        x: 4.7, y: 3.7, w: 4.5, h: 0.3,
        fontSize: 10, bold: true, color: COLORS.blue,
        align: 'center'
    });

    slide.addText('Executive Summary, Approach, Methodology, Team, Case Studies, Timeline, Pricing, Risk, Why Capgemini', {
        x: 4.8, y: 4.0, w: 4.3, h: 0.45,
        fontSize: 9, color: COLORS.text,
        align: 'center'
    });
}

function createBenefitsSlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    addHeaderWithAccent(slide, 'Key Benefits', pptx);

    const benefits = [
        { metric: '90%', label: 'Faster Delivery', desc: 'From weeks to hours. First draft ready in minutes, polished proposal in hours.', highlight: true },
        { metric: '15-25%', label: 'Win Rate Potential', desc: 'Better targeting, consistent quality, and methodology-aligned content.', highlight: false },
        { metric: '100%', label: 'Consistent Quality', desc: 'Every proposal follows best practices and brand standards.', highlight: false },
        { metric: '3x', label: 'More Opportunities', desc: 'Same team capacity can pursue significantly more deals.', highlight: false },
        { metric: '1', label: 'Knowledge Source', desc: 'Capture and reuse institutional expertise across the organization.', highlight: false }
    ];

    const boxW = 1.8;
    const boxH = 2.5;
    const startX = 0.5;
    const gap = 0.1;

    benefits.forEach((b, i) => {
        const x = startX + i * (boxW + gap);
        const bgColor = b.highlight ? 'E8F4FC' : COLORS.lightGray;
        const accentColor = b.highlight ? COLORS.cyan : COLORS.blue;

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: x, y: 1.1, w: boxW, h: boxH,
            fill: { color: bgColor },
            rectRadius: 0.03
        });

        slide.addShape(pptx.shapes.RECTANGLE, {
            x: x, y: 1.1, w: boxW, h: 0.06,
            fill: { color: accentColor }
        });

        slide.addText(b.metric, {
            x: x, y: 1.4, w: boxW, h: 0.6,
            fontSize: 32, bold: true, color: accentColor,
            align: 'center'
        });

        slide.addText(b.label, {
            x: x, y: 2.0, w: boxW, h: 0.4,
            fontSize: 12, bold: true, color: COLORS.text,
            align: 'center'
        });

        slide.addText(b.desc, {
            x: x + 0.1, y: 2.5, w: boxW - 0.2, h: 0.9,
            fontSize: 9, color: COLORS.darkGray,
            align: 'center'
        });
    });
}

function createFeaturesSlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    addHeaderWithAccent(slide, 'Platform Features', pptx);

    // Left column
    slide.addText('Core Capabilities', {
        x: 0.6, y: 1.1, w: 4.5, h: 0.35,
        fontSize: 14, bold: true, color: COLORS.blue
    });

    const capabilities = [
        'Step-by-step proposal creation wizard',
        'AI-generated sections with source citations',
        'Outcome contract definition with success metrics',
        'Win strategy analysis and positioning',
        'Version history and change tracking',
        'Team collaboration and comments',
        'Multi-format export (PPTX, DOCX, PDF)',
        'Knowledge base with RAG search'
    ];

    capabilities.forEach((cap, i) => {
        slide.addText('•  ' + cap, {
            x: 0.6, y: 1.5 + i * 0.38, w: 4.5, h: 0.35,
            fontSize: 11, color: COLORS.text
        });
    });

    // Right column
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 5.4, y: 1.1, w: 4.3, h: 3.8,
        fill: { color: COLORS.navy },
        rectRadius: 0.1
    });

    slide.addText('Modern User Experience', {
        x: 5.6, y: 1.3, w: 3.9, h: 0.35,
        fontSize: 14, bold: true, color: COLORS.white
    });

    const uxFeatures = [
        { title: 'Warm, Human Design', desc: 'Clean, approachable interface that guides users through the process' },
        { title: 'Real-Time Generation', desc: 'Watch AI create content with live progress updates' },
        { title: 'Inline Editing', desc: 'Edit, refine, and perfect content directly in the interface' },
        { title: 'Source Transparency', desc: 'See exactly which company sources informed each section' }
    ];

    uxFeatures.forEach((f, i) => {
        const y = 1.8 + i * 0.8;

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: 5.6, y: y, w: 3.9, h: 0.7,
            fill: { color: '2A4A72' },
            rectRadius: 0.03
        });

        slide.addText(f.title, {
            x: 5.75, y: y + 0.1, w: 3.6, h: 0.25,
            fontSize: 11, bold: true, color: COLORS.cyan
        });

        slide.addText(f.desc, {
            x: 5.75, y: y + 0.35, w: 3.6, h: 0.3,
            fontSize: 9, color: COLORS.white
        });
    });
}

function createRoadmapSlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    addHeaderWithAccent(slide, 'Future Roadmap', pptx);

    const phases = [
        { phase: 'PHASE 1', title: 'Foundation', items: ['Core proposal generation', 'IDD methodology', 'Knowledge base', 'Multi-format export'], current: true },
        { phase: 'PHASE 2', title: 'RFP Intelligence', items: ['RFP document parsing', 'Auto-response mapping', 'Requirement extraction', 'Compliance checking'], current: false },
        { phase: 'PHASE 3', title: 'Competitive Intel', items: ['Competitor analysis', 'Differentiation suggestions', 'Market positioning', 'Win theme optimization'], current: false },
        { phase: 'PHASE 4', title: 'Learning Loop', items: ['Win/loss analysis', 'Feedback integration', 'Continuous improvement', 'Success pattern mining'], current: false },
        { phase: 'PHASE 5', title: 'Voice & CRM', items: ['Client-specific voice', 'Salesforce integration', 'Pipeline automation', 'Opportunity scoring'], current: false }
    ];

    const boxW = 1.85;
    const startX = 0.35;
    const gap = 0.1;

    phases.forEach((p, i) => {
        const x = startX + i * (boxW + gap);
        const headerColor = p.current ? COLORS.cyan : COLORS.blue;
        const bgColor = p.current ? 'E8F4FC' : COLORS.lightGray;

        // Header
        slide.addShape(pptx.shapes.RECTANGLE, {
            x: x, y: 1.1, w: boxW, h: 0.9,
            fill: { color: headerColor }
        });

        slide.addText(p.phase, {
            x: x, y: 1.15, w: boxW, h: 0.25,
            fontSize: 9, color: COLORS.white,
            align: 'center'
        });

        slide.addText(p.title + (p.current ? ' NOW' : ''), {
            x: x, y: 1.4, w: boxW, h: 0.35,
            fontSize: 11, bold: true, color: COLORS.white,
            align: 'center'
        });

        // Body
        slide.addShape(pptx.shapes.RECTANGLE, {
            x: x, y: 2.0, w: boxW, h: 2.5,
            fill: { color: bgColor }
        });

        p.items.forEach((item, j) => {
            slide.addText('• ' + item, {
                x: x + 0.1, y: 2.1 + j * 0.5, w: boxW - 0.2, h: 0.45,
                fontSize: 9, color: COLORS.text
            });
        });
    });
}

function createCTASlide(pptx) {
    const slide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });

    slide.addText('Ready to Transform Your Proposal Process?', {
        x: 0.5, y: 1.0, w: 9, h: 0.7,
        fontSize: 32, bold: true, color: COLORS.white,
        align: 'center'
    });

    slide.addText('Join the pilot program and experience the future of proposal generation', {
        x: 0.5, y: 1.7, w: 9, h: 0.5,
        fontSize: 16, color: COLORS.cyan,
        align: 'center'
    });

    // Next steps boxes
    const steps = [
        { num: '1', title: 'Pilot Program', desc: 'Select teams to test with real opportunities' },
        { num: '2', title: 'Training', desc: 'Onboard users and configure knowledge base' },
        { num: '3', title: 'Rollout', desc: 'Scale to broader organization' }
    ];

    steps.forEach((step, i) => {
        const x = 1.5 + i * 2.6;

        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: x, y: 2.4, w: 2.3, h: 1.5,
            fill: { color: '2A4A72' },
            rectRadius: 0.05
        });

        slide.addShape(pptx.shapes.RECTANGLE, {
            x: x, y: 2.4, w: 2.3, h: 0.04,
            fill: { color: COLORS.cyan }
        });

        slide.addText(step.num, {
            x: x, y: 2.55, w: 2.3, h: 0.4,
            fontSize: 22, bold: true, color: COLORS.cyan,
            align: 'center'
        });

        slide.addText(step.title, {
            x: x, y: 2.95, w: 2.3, h: 0.3,
            fontSize: 13, bold: true, color: COLORS.white,
            align: 'center'
        });

        slide.addText(step.desc, {
            x: x + 0.1, y: 3.25, w: 2.1, h: 0.5,
            fontSize: 9, color: COLORS.white,
            align: 'center'
        });
    });

    // Contact
    slide.addText('FOR MORE INFORMATION', {
        x: 0.5, y: 4.15, w: 9, h: 0.25,
        fontSize: 10, color: COLORS.white,
        align: 'center'
    });

    slide.addText('Contact the ProposalAI Team', {
        x: 0.5, y: 4.4, w: 9, h: 0.35,
        fontSize: 14, bold: true, color: COLORS.cyan,
        align: 'center'
    });

    slide.addText('ProposalAI | Intelligent Proposal Generation | Capgemini', {
        x: 0, y: 5.1, w: 10, h: 0.4,
        fontSize: 11, color: COLORS.white,
        align: 'center'
    });
}

function addHeaderWithAccent(slide, title, pptx) {
    // Accent bar
    slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.4, y: 0.25, w: 0.08, h: 0.4,
        fill: { color: COLORS.cyan }
    });

    // Title
    slide.addText(title, {
        x: 0.6, y: 0.2, w: 8, h: 0.6,
        fontSize: 26, bold: true, color: COLORS.white
    });
}

createPresentation()
    .then(outputPath => {
        console.log('\nPresentation created successfully!');
    })
    .catch(error => {
        console.error('\nError creating presentation:', error);
        process.exit(1);
    });
