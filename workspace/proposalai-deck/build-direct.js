const pptxgen = require('pptxgenjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Capgemini brand colors (without # for PptxGenJS)
const C = {
  navy: '1B365D',
  navyDark: '0A1628',
  blue: '0070AD',
  cyan: '12ABDB',
  white: 'FFFFFF',
  offWhite: 'F5F7FA',
  gray: '64748B',
  grayLight: '94A3B8',
  grayDark: '334155',
};

const WORKSPACE = '/Users/robroyhobbs/projects/capgemini-proposal-generator/workspace/proposalai-deck';
const ASSETS = path.join(WORKSPACE, 'assets');

// Create gradient backgrounds as PNG
async function createGradients() {
  const gradients = {
    'bg-title': `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0A1628"/>
          <stop offset="40%" style="stop-color:#1B365D"/>
          <stop offset="100%" style="stop-color:#0070AD"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="1600" cy="200" r="400" fill="#12ABDB" opacity="0.12"/>
      <circle cx="300" cy="900" r="300" fill="#0070AD" opacity="0.08"/>
    </svg>`,
    'bg-dark': `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0A1628"/>
          <stop offset="100%" style="stop-color:#1B365D"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="0" y="0" width="12" height="1080" fill="#12ABDB"/>
    </svg>`,
    'bg-solution': `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0070AD"/>
          <stop offset="100%" style="stop-color:#12ABDB"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
    'bg-cta': `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1B365D"/>
          <stop offset="50%" style="stop-color:#0070AD"/>
          <stop offset="100%" style="stop-color:#12ABDB"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  };

  for (const [name, svg] of Object.entries(gradients)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, `${name}.png`));
  }
  console.log('Gradients created');
}

// Create icons as PNG
async function createIcons() {
  const icons = {
    clock: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    chart: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    layers: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="#12ABDB" stroke="#12ABDB" stroke-width="0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="#12ABDB" stroke="#12ABDB"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
    arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    scale: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
  };

  // White versions for dark backgrounds
  const whiteVersions = ['clock', 'chart', 'layers', 'target', 'check', 'star', 'trophy'];

  for (const [name, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, `icon-${name}.png`));

    if (whiteVersions.includes(name)) {
      const whiteSvg = svg.replace(/#12ABDB/g, '#FFFFFF');
      await sharp(Buffer.from(whiteSvg)).png().toFile(path.join(ASSETS, `icon-${name}-white.png`));
    }
  }
  console.log('Icons created');
}

async function buildPresentation() {
  console.log('Building ProposalAI Presentation...\n');

  // Ensure assets directory exists
  if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

  // Create assets
  console.log('Creating gradient backgrounds...');
  await createGradients();

  console.log('Creating icons...');
  await createIcons();

  // Create presentation
  console.log('Building slides...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'ProposalAI - Intelligent Proposal Generation';
  pptx.author = 'Capgemini';
  pptx.company = 'Capgemini';

  // ========== SLIDE 1: Title ==========
  let slide = pptx.addSlide();
  slide.addImage({ path: path.join(ASSETS, 'bg-title.png'), x: 0, y: 0, w: 10, h: 5.625 });

  // Logo
  slide.addText('CAPGEMINI', { x: 0.5, y: 0.4, w: 2, h: 0.3, fontSize: 12, bold: true, color: C.white, fontFace: 'Arial' });

  // Main title
  slide.addText([
    { text: 'Proposal', options: { color: C.white } },
    { text: 'AI', options: { color: C.cyan } }
  ], { x: 0.5, y: 2.1, w: 9, h: 0.9, fontSize: 56, bold: true, fontFace: 'Arial', align: 'center' });

  slide.addText('Intelligent Proposal Generation', { x: 0.5, y: 2.9, w: 9, h: 0.5, fontSize: 24, color: C.grayLight, fontFace: 'Arial', align: 'center' });
  slide.addText('Transforming How Capgemini Wins Business', { x: 0.5, y: 4.8, w: 9, h: 0.3, fontSize: 14, color: C.gray, fontFace: 'Arial', align: 'center' });

  // ========== SLIDE 2: The Challenge ==========
  slide = pptx.addSlide();
  slide.addImage({ path: path.join(ASSETS, 'bg-dark.png'), x: 0, y: 0, w: 10, h: 5.625 });

  slide.addText('THE CHALLENGE', { x: 0.5, y: 0.4, w: 3, h: 0.25, fontSize: 11, bold: true, color: C.cyan, fontFace: 'Arial' });
  slide.addText('Why We Need Change', { x: 0.5, y: 0.65, w: 6, h: 0.5, fontSize: 36, bold: true, color: C.white, fontFace: 'Arial' });

  const challenges = [
    { icon: 'clock', title: 'Weeks of Work', desc: 'Proposals take 2-4 weeks, delaying responses to opportunities' },
    { icon: 'chart', title: 'Inconsistent Quality', desc: 'Quality varies by team, no standard approach' },
    { icon: 'layers', title: 'Knowledge Silos', desc: 'Best practices scattered across organization' },
    { icon: 'target', title: 'Senior Bottleneck', desc: 'Expert resources tied up in manual work' },
  ];

  challenges.forEach((c, i) => {
    const x = 0.5 + i * 2.35;
    // Card background
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.4, w: 2.2, h: 2.8,
      fill: { color: C.white, transparency: 95 },
      line: { color: C.white, transparency: 90, width: 0.5 },
      rectRadius: 0.1
    });
    slide.addImage({ path: path.join(ASSETS, `icon-${c.icon}-white.png`), x: x + 0.15, y: 1.6, w: 0.5, h: 0.5 });
    slide.addText(c.title, { x, y: 2.25, w: 2.2, h: 0.35, fontSize: 14, bold: true, color: C.white, fontFace: 'Arial' });
    slide.addText(c.desc, { x, y: 2.6, w: 2.1, h: 0.8, fontSize: 11, color: C.grayLight, fontFace: 'Arial', valign: 'top' });
  });

  // ========== SLIDE 3: Introducing ProposalAI ==========
  slide = pptx.addSlide();
  slide.addImage({ path: path.join(ASSETS, 'bg-solution.png'), x: 0, y: 0, w: 10, h: 5.625 });

  slide.addText('INTRODUCING', { x: 0.6, y: 1.5, w: 3, h: 0.25, fontSize: 11, bold: true, color: C.white, transparency: 30, fontFace: 'Arial' });
  slide.addText('ProposalAI', { x: 0.6, y: 1.8, w: 5, h: 0.7, fontSize: 48, bold: true, color: C.white, fontFace: 'Arial' });
  slide.addText('An AI-powered proposal generation platform that leverages Capgemini\'s collective intelligence to create winning proposals in hours, not weeks.',
    { x: 0.6, y: 2.6, w: 4.5, h: 1.2, fontSize: 16, color: C.white, transparency: 10, fontFace: 'Arial', valign: 'top' });

  // Stat box
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6, y: 1.8, w: 3.5, h: 2.2,
    fill: { color: C.white, transparency: 85 },
    rectRadius: 0.15
  });
  slide.addText('90%', { x: 6, y: 2.1, w: 3.5, h: 1, fontSize: 72, bold: true, color: C.white, fontFace: 'Arial', align: 'center' });
  slide.addText('Faster Proposals', { x: 6, y: 3.1, w: 3.5, h: 0.4, fontSize: 20, color: C.white, transparency: 20, fontFace: 'Arial', align: 'center' });

  // ========== SLIDE 4: IDD Methodology ==========
  slide = pptx.addSlide();
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy } });
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 5.1, w: 10, h: 0.525, fill: { color: C.cyan } });

  slide.addText('OUR METHODOLOGY', { x: 0.5, y: 0.4, w: 3, h: 0.25, fontSize: 11, bold: true, color: C.cyan, fontFace: 'Arial' });
  slide.addText('Intent-Driven Development (IDD)', { x: 0.5, y: 0.65, w: 8, h: 0.5, fontSize: 32, bold: true, color: C.white, fontFace: 'Arial' });

  const layers = [
    { num: 'LAYER 1', title: 'Company Truth', items: ['Verified capabilities', 'Certifications', 'Case studies with metrics', 'Methodology frameworks'], color: C.blue },
    { num: 'LAYER 2', title: 'Proposal Intent', items: ['Client outcomes', 'Win strategy', 'Constraints', 'Competitive positioning'], color: C.cyan },
    { num: 'LAYER 3', title: 'Generated Content', items: ['AI-created sections', 'Human reviewed', 'Source citations', 'Version controlled'], color: C.white },
  ];

  layers.forEach((l, i) => {
    const x = 0.5 + i * 3.1;
    // Card with left border
    slide.addShape(pptx.shapes.RECTANGLE, { x, y: 1.4, w: 0.06, h: 2.5, fill: { color: l.color } });
    slide.addShape(pptx.shapes.RECTANGLE, { x: x + 0.06, y: 1.4, w: 2.9, h: 2.5, fill: { color: C.white, transparency: 92 } });

    slide.addText(l.num, { x: x + 0.2, y: 1.55, w: 2.5, h: 0.2, fontSize: 10, bold: true, color: C.grayLight, fontFace: 'Arial' });
    slide.addText(l.title, { x: x + 0.2, y: 1.8, w: 2.5, h: 0.35, fontSize: 16, bold: true, color: C.white, fontFace: 'Arial' });

    l.items.forEach((item, j) => {
      slide.addText('• ' + item, { x: x + 0.2, y: 2.25 + j * 0.38, w: 2.6, h: 0.35, fontSize: 11, color: C.grayLight, fontFace: 'Arial' });
    });
  });

  // Key point
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.2, w: 9, h: 0.6, fill: { color: C.cyan, transparency: 80 }, rectRadius: 0.08 });
  slide.addText('Every claim is traceable to verified sources', { x: 0.5, y: 4.2, w: 9, h: 0.6, fontSize: 14, bold: true, color: C.cyan, fontFace: 'Arial', align: 'center', valign: 'middle' });

  // ========== SLIDE 5: Why We're Different ==========
  slide = pptx.addSlide();
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: C.navy } });
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 1.1, w: 10, h: 4.525, fill: { color: C.offWhite } });

  slide.addText('Why We\'re Different', { x: 0.5, y: 0.35, w: 8, h: 0.5, fontSize: 28, bold: true, color: C.white, fontFace: 'Arial' });

  const diffs = [
    { icon: 'layers', title: 'Embedded Methodologies', desc: 'CCMF, ADMnext, and eAPM frameworks built into every proposal' },
    { icon: 'star', title: 'Real Case Studies', desc: 'Verified metrics: BMW 5,200+ apps, HMRC £245M savings' },
    { icon: 'target', title: 'Intent-First Approach', desc: 'Every proposal aligned to client outcomes from the start' },
    { icon: 'check', title: 'Human-in-the-Loop', desc: 'AI generates, experts review and refine for quality' },
    { icon: 'zap', title: 'Full Lifecycle', desc: 'Not just generation—collaboration, versioning, and export' },
  ];

  diffs.forEach((d, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 4.7;
    const y = 1.4 + row * 1.25;

    // Card
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 4.4, h: 1.1, fill: { color: C.white }, shadow: { type: 'outer', blur: 4, offset: 2, angle: 45, opacity: 0.1 }, rectRadius: 0.1 });

    // Icon circle
    slide.addShape(pptx.shapes.OVAL, { x: x + 0.15, y: y + 0.22, w: 0.65, h: 0.65, fill: { color: C.cyan, transparency: 90 } });
    slide.addImage({ path: path.join(ASSETS, `icon-${d.icon}.png`), x: x + 0.27, y: y + 0.34, w: 0.4, h: 0.4 });

    slide.addText(d.title, { x: x + 0.95, y: y + 0.2, w: 3.2, h: 0.3, fontSize: 13, bold: true, color: C.navy, fontFace: 'Arial' });
    slide.addText(d.desc, { x: x + 0.95, y: y + 0.5, w: 3.2, h: 0.5, fontSize: 10, color: C.gray, fontFace: 'Arial', valign: 'top' });
  });

  // ========== SLIDE 6: How It Works ==========
  slide = pptx.addSlide();
  slide.addImage({ path: path.join(ASSETS, 'bg-dark.png'), x: 0, y: 0, w: 10, h: 5.625 });

  slide.addText('WORKFLOW', { x: 0.5, y: 0.4, w: 3, h: 0.25, fontSize: 11, bold: true, color: C.cyan, fontFace: 'Arial' });
  slide.addText('How It Works', { x: 0.5, y: 0.65, w: 6, h: 0.5, fontSize: 32, bold: true, color: C.white, fontFace: 'Arial' });

  const steps = [
    { num: '1', title: 'Define Client', desc: 'Enter client details and opportunity context' },
    { num: '2', title: 'Set Outcomes', desc: 'Define desired outcomes and win strategy' },
    { num: '3', title: 'AI Generates', desc: 'AI creates content with company context' },
    { num: '4', title: 'Review', desc: 'Refine and collaborate with team' },
    { num: '5', title: 'Export', desc: 'PPTX, DOCX, PDF, or web format' },
  ];

  steps.forEach((s, i) => {
    const x = 0.5 + i * 1.9;

    // Number circle
    slide.addShape(pptx.shapes.OVAL, { x: x + 0.35, y: 1.7, w: 0.6, h: 0.6, fill: { color: C.cyan } });
    slide.addText(s.num, { x: x + 0.35, y: 1.7, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: C.white, fontFace: 'Arial', align: 'center', valign: 'middle' });

    slide.addText(s.title, { x, y: 2.5, w: 1.7, h: 0.35, fontSize: 12, bold: true, color: C.white, fontFace: 'Arial', align: 'center' });
    slide.addText(s.desc, { x, y: 2.85, w: 1.7, h: 0.6, fontSize: 9, color: C.grayLight, fontFace: 'Arial', align: 'center', valign: 'top' });

    // Arrow between steps
    if (i < 4) {
      slide.addImage({ path: path.join(ASSETS, 'icon-arrow.png'), x: x + 1.55, y: 1.85, w: 0.3, h: 0.3 });
    }
  });

  // ========== SLIDE 7: Key Benefits ==========
  slide = pptx.addSlide();
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: C.navy } });
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 1.1, w: 10, h: 4.525, fill: { color: C.offWhite } });

  slide.addText('Key Benefits', { x: 0.5, y: 0.35, w: 8, h: 0.5, fontSize: 28, bold: true, color: C.white, fontFace: 'Arial' });

  const benefits = [
    { icon: 'zap', num: '90%', label: 'Faster', desc: 'From weeks to hours for complete proposals' },
    { icon: 'trophy', num: '15-25%', label: 'Win Rate', desc: 'Better targeting and methodology alignment' },
    { icon: 'chart', num: '100%', label: 'Consistent', desc: 'Every proposal follows best practices' },
    { icon: 'scale', num: '3x', label: 'Scale', desc: 'Handle more opportunities with same team' },
  ];

  benefits.forEach((b, i) => {
    const x = 0.5 + i * 2.35;

    // Card
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.45, w: 2.2, h: 2.9,
      fill: { color: C.white },
      shadow: { type: 'outer', blur: 6, offset: 3, angle: 45, opacity: 0.1 },
      rectRadius: 0.15
    });

    // Icon
    slide.addImage({ path: path.join(ASSETS, `icon-${b.icon}.png`), x: x + 0.8, y: 1.7, w: 0.6, h: 0.6 });

    // Number
    slide.addText(b.num, { x, y: 2.4, w: 2.2, h: 0.6, fontSize: 36, bold: true, color: C.blue, fontFace: 'Arial', align: 'center' });

    // Label
    slide.addText(b.label, { x, y: 3, w: 2.2, h: 0.35, fontSize: 14, bold: true, color: C.navy, fontFace: 'Arial', align: 'center' });

    // Description
    slide.addText(b.desc, { x: x + 0.1, y: 3.4, w: 2, h: 0.6, fontSize: 10, color: C.gray, fontFace: 'Arial', align: 'center', valign: 'top' });
  });

  // ========== SLIDE 8: Demo Highlights ==========
  slide = pptx.addSlide();
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy } });
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 5.1, w: 10, h: 0.525, fill: { color: C.cyan } });

  slide.addText('DEMO', { x: 0.5, y: 0.4, w: 3, h: 0.25, fontSize: 11, bold: true, color: C.cyan, fontFace: 'Arial' });
  slide.addText('Platform Highlights', { x: 0.5, y: 0.65, w: 6, h: 0.5, fontSize: 32, bold: true, color: C.white, fontFace: 'Arial' });

  const features = [
    'Modern, intuitive user interface',
    'Step-by-step proposal wizard',
    'AI-generated sections with citations',
    'Version history and collaboration',
    'Multi-format export (PPTX, DOCX, PDF)',
  ];

  features.forEach((f, i) => {
    const y = 1.4 + i * 0.65;
    // Feature row
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 4.5, h: 0.55, fill: { color: C.white, transparency: 92 }, rectRadius: 0.08 });
    slide.addImage({ path: path.join(ASSETS, 'icon-check-white.png'), x: 0.65, y: y + 0.1, w: 0.35, h: 0.35 });
    slide.addText(f, { x: 1.15, y, w: 3.7, h: 0.55, fontSize: 12, color: C.white, fontFace: 'Arial', valign: 'middle' });
  });

  // Demo placeholder
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 5.3, y: 1.4, w: 4.2, h: 3.4,
    fill: { color: '000000', transparency: 70 },
    line: { color: C.white, transparency: 90, width: 0.5 },
    rectRadius: 0.12
  });
  slide.addText('Live Demo\nor Screenshot', { x: 5.3, y: 2.5, w: 4.2, h: 1.2, fontSize: 16, color: C.gray, fontFace: 'Arial', align: 'center', valign: 'middle' });

  // ========== SLIDE 9: Future Roadmap ==========
  slide = pptx.addSlide();
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: C.navy } });
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 1.1, w: 10, h: 4.525, fill: { color: C.offWhite } });

  slide.addText('Future Roadmap', { x: 0.5, y: 0.35, w: 8, h: 0.5, fontSize: 28, bold: true, color: C.white, fontFace: 'Arial' });

  const phases = [
    { num: 'PHASE 2', title: 'RFP Parsing', desc: 'Auto-parse RFPs and map requirements to response sections' },
    { num: 'PHASE 3', title: 'Competitive Intel', desc: 'Integrate competitive intelligence for better positioning' },
    { num: 'PHASE 4', title: 'Win/Loss Analysis', desc: 'Learn from outcomes to improve future proposals' },
    { num: 'PHASE 5', title: 'Voice Training', desc: 'Client-specific tone and messaging customization' },
    { num: 'PHASE 6', title: 'CRM Integration', desc: 'Seamless connection with Salesforce and pipelines' },
  ];

  phases.forEach((p, i) => {
    const x = 0.5 + i * 1.88;

    // Card with top accent
    slide.addShape(pptx.shapes.RECTANGLE, { x, y: 1.4, w: 1.75, h: 0.06, fill: { color: C.cyan } });
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.46, w: 1.75, h: 2.8,
      fill: { color: C.white },
      shadow: { type: 'outer', blur: 3, offset: 2, angle: 45, opacity: 0.08 },
      rectRadius: 0.08
    });

    slide.addText(p.num, { x, y: 1.6, w: 1.75, h: 0.25, fontSize: 9, bold: true, color: C.cyan, fontFace: 'Arial', align: 'center' });
    slide.addText(p.title, { x, y: 1.9, w: 1.75, h: 0.4, fontSize: 13, bold: true, color: C.navy, fontFace: 'Arial', align: 'center' });
    slide.addText(p.desc, { x: x + 0.1, y: 2.35, w: 1.55, h: 1, fontSize: 9, color: C.gray, fontFace: 'Arial', align: 'center', valign: 'top' });
  });

  // ========== SLIDE 10: Call to Action ==========
  slide = pptx.addSlide();
  slide.addImage({ path: path.join(ASSETS, 'bg-cta.png'), x: 0, y: 0, w: 10, h: 5.625 });

  // Rocket icon
  slide.addImage({ path: path.join(ASSETS, 'icon-rocket.png'), x: 4.6, y: 1.2, w: 0.8, h: 0.8 });

  // Main CTA
  slide.addText('Ready to Transform Your Proposals?', { x: 0.5, y: 2.2, w: 9, h: 0.7, fontSize: 40, bold: true, color: C.white, fontFace: 'Arial', align: 'center' });
  slide.addText('Join the future of intelligent proposal generation', { x: 0.5, y: 2.9, w: 9, h: 0.4, fontSize: 18, color: C.white, transparency: 20, fontFace: 'Arial', align: 'center' });

  // Next steps boxes
  const nextSteps = ['Pilot Program', 'Training', 'Rollout'];
  nextSteps.forEach((step, i) => {
    const x = 2.5 + i * 1.8;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 3.6, w: 1.6, h: 0.6, fill: { color: C.white, transparency: 85 }, rectRadius: 0.1 });
    slide.addText(step, { x, y: 3.6, w: 1.6, h: 0.6, fontSize: 14, bold: true, color: C.white, fontFace: 'Arial', align: 'center', valign: 'middle' });
  });

  // Contact
  slide.addText('Contact: proposalai@capgemini.com', { x: 0.5, y: 4.6, w: 9, h: 0.3, fontSize: 12, color: C.white, transparency: 40, fontFace: 'Arial', align: 'center' });

  // Save presentation
  const outputPath = path.join(WORKSPACE, 'ProposalAI-Presentation.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

buildPresentation().catch(console.error);
