const pptxgen = require('pptxgenjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Capgemini brand colors (without # for PptxGenJS)
const COLORS = {
  navy: '1B365D',
  blue: '0070AD',
  cyan: '12ABDB',
  white: 'FFFFFF',
  offWhite: 'F5F7FA',
  gray: '64748B',
  grayDark: '334155',
  grayLight: 'E2E8F0',
};

const WORKSPACE = '/Users/robroyhobbs/projects/capgemini-proposal-generator/workspace/proposalai-deck';
const ASSETS = path.join(WORKSPACE, 'assets');
const SLIDES = path.join(WORKSPACE, 'slides');
const SKILL_PATH = '/Users/robroyhobbs/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/pptx/scripts';

// Import html2pptx
const html2pptx = require(path.join(SKILL_PATH, 'html2pptx.js'));

// Create gradient backgrounds
async function createGradients() {
  // Title slide - dramatic navy to blue diagonal
  const titleGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0A1628"/>
        <stop offset="40%" style="stop-color:#1B365D"/>
        <stop offset="100%" style="stop-color:#0070AD"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g1)"/>
    <circle cx="1200" cy="150" r="300" fill="#12ABDB" opacity="0.15"/>
    <circle cx="200" cy="700" r="200" fill="#0070AD" opacity="0.1"/>
  </svg>`;

  await sharp(Buffer.from(titleGradient)).png().toFile(path.join(ASSETS, 'bg-title.png'));

  // Challenge slide - dark dramatic
  const challengeGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#0A1628"/>
        <stop offset="100%" style="stop-color:#1B365D"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g2)"/>
    <rect x="0" y="0" width="8" height="810" fill="#12ABDB"/>
  </svg>`;

  await sharp(Buffer.from(challengeGradient)).png().toFile(path.join(ASSETS, 'bg-challenge.png'));

  // Solution slide - bright optimistic
  const solutionGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0070AD"/>
        <stop offset="100%" style="stop-color:#12ABDB"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g3)"/>
  </svg>`;

  await sharp(Buffer.from(solutionGradient)).png().toFile(path.join(ASSETS, 'bg-solution.png'));

  // Methodology slide - clean navy
  const methodGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <rect width="100%" height="100%" fill="#1B365D"/>
    <rect x="0" y="750" width="1440" height="60" fill="#12ABDB"/>
  </svg>`;

  await sharp(Buffer.from(methodGradient)).png().toFile(path.join(ASSETS, 'bg-method.png'));

  // Content slides - light clean
  const contentGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <rect width="100%" height="100%" fill="#F5F7FA"/>
    <rect x="0" y="0" width="1440" height="100" fill="#1B365D"/>
  </svg>`;

  await sharp(Buffer.from(contentGradient)).png().toFile(path.join(ASSETS, 'bg-content.png'));

  // CTA slide - vibrant
  const ctaGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <defs>
      <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1B365D"/>
        <stop offset="50%" style="stop-color:#0070AD"/>
        <stop offset="100%" style="stop-color:#12ABDB"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g5)"/>
  </svg>`;

  await sharp(Buffer.from(ctaGradient)).png().toFile(path.join(ASSETS, 'bg-cta.png'));

  console.log('Gradients created');
}

// Create icons
async function createIcons() {
  const icons = {
    clock: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    puzzle: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.452-.743-.925l.076-.617c.045-.366-.196-.69-.569-.69h-.001a.645.645 0 0 0-.643.643v1.574a2.43 2.43 0 0 1-2.43 2.43h-1.574a.643.643 0 0 0-.643.643c0 .373.324.614.69.569l.617-.076c.473-.059.855.273.925.743a.98.98 0 0 1-.276.837l-1.611 1.611c-.47.47-1.087.706-1.704.706s-1.233-.235-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.878-.29c-.493.074-.84.504-.84 1.002v.69c0 .552-.447 1-1 1h-2c-.552 0-1-.447-1-1v-.689c0-.498-.347-.928-.84-1.002a1.026 1.026 0 0 0-.878.29l-1.568 1.568c-.47.47-1.087.706-1.704.706s-1.233-.236-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.878-.29c-.493.074-.84.504-.84 1.002v.689c0 .552-.447 1-1 1h-2c-.552 0-1-.447-1-1v-2c0-.552.447-1 1-1h.689c.498 0 .928-.347 1.002-.84a1.026 1.026 0 0 0-.29-.878L2.706 13.704c-.47-.47-.706-1.087-.706-1.704s.235-1.233.706-1.704l1.568-1.568c.23-.23.338-.556.289-.878-.074-.493-.504-.84-1.002-.84H2.87c-.552 0-1-.447-1-1v-2c0-.552.447-1 1-1h.689c.498 0 .928-.347 1.002-.84a1.026 1.026 0 0 0-.29-.878L2.706 3.704C2.235 3.233 2 2.617 2 2s.235-1.233.706-1.704S3.617 0 4.234 0s1.233.235 1.704.706l1.568 1.568c.23.23.556.338.878.289.493-.074.84-.504.84-1.002V.87c0-.552.447-1 1-1h2c.552 0 1 .447 1 1v.689c0 .498.347.928.84 1.002.322.049.648-.059.878-.289l1.568-1.568C15.976.235 16.593 0 17.21 0s1.233.235 1.704.706l1.568 1.568c.23.23.556.338.878.289.493-.074.84-.504.84-1.002V.87c0-.552.447-1 1-1h2c.552 0 1 .447 1 1v2c0 .552-.447 1-1 1h-.689c-.498 0-.928.347-1.002.84z"/></svg>`,
    database: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    bottleneck: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#12ABDB" stroke="#12ABDB" stroke-width="0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    brain: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0070AD" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`,
    layers: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0070AD" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    target: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
    arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    speed: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M12 9v-4"/><path d="M12 3v-.5"/><path d="M12 21v-.5"/><path d="M12 19v-4"/><path d="M9 12h-4"/><path d="M3 12h-.5"/><path d="M21 12h-.5"/><path d="M19 12h-4"/></svg>`,
    chart: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    scale: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#12ABDB" stroke="#12ABDB"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#12ABDB" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  };

  for (const [name, svg] of Object.entries(icons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, `icon-${name}.png`));
  }

  // White versions for dark backgrounds
  const whiteIcons = {
    clock: icons.clock.replace(/#12ABDB/g, '#FFFFFF'),
    zap: icons.zap.replace(/#12ABDB/g, '#FFFFFF'),
    check: icons.check.replace(/#12ABDB/g, '#FFFFFF'),
    target: icons.target.replace(/#12ABDB/g, '#FFFFFF'),
    trophy: icons.trophy.replace(/#12ABDB/g, '#FFFFFF'),
    arrow: icons.arrow.replace(/#12ABDB/g, '#FFFFFF'),
    chart: icons.chart.replace(/#12ABDB/g, '#FFFFFF'),
    star: icons.star.replace(/#12ABDB/g, '#FFFFFF'),
    layers: icons.layers.replace(/#0070AD/g, '#FFFFFF'),
    brain: icons.brain.replace(/#0070AD/g, '#FFFFFF'),
  };

  for (const [name, svg] of Object.entries(whiteIcons)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, `icon-${name}-white.png`));
  }

  console.log('Icons created');
}

// Create HTML slides
function createSlides() {
  const slides = [];

  // =============== SLIDE 1: Title ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #1B365D; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background-image: url('${ASSETS}/bg-title.png');
  background-size: cover;
}
.content {
  flex: 1; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  padding: 40pt;
}
.logo {
  position: absolute; top: 30pt; left: 40pt;
  color: #FFFFFF; font-size: 14pt; font-weight: bold;
  letter-spacing: 2pt;
}
.main-title {
  color: #FFFFFF; font-size: 52pt; font-weight: bold;
  text-align: center; margin: 0 0 8pt 0;
}
.highlight { color: #12ABDB; }
.subtitle {
  color: #94A3B8; font-size: 22pt;
  text-align: center; margin: 0;
}
.tagline {
  position: absolute; bottom: 40pt;
  color: #64748B; font-size: 12pt;
  text-align: center;
}
</style>
</head>
<body>
<div class="logo"><p>CAPGEMINI</p></div>
<div class="content">
  <h1 class="main-title">Proposal<span class="highlight">AI</span></h1>
  <p class="subtitle">Intelligent Proposal Generation</p>
</div>
<div class="tagline"><p>Transforming How Capgemini Wins Business</p></div>
</body>
</html>`);

  // =============== SLIDE 2: The Challenge ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #0A1628; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background-image: url('${ASSETS}/bg-challenge.png');
  background-size: cover;
}
.header {
  padding: 25pt 40pt;
}
.section-label {
  color: #12ABDB; font-size: 11pt; font-weight: bold;
  letter-spacing: 3pt; margin: 0 0 5pt 0;
}
.title {
  color: #FFFFFF; font-size: 36pt; font-weight: bold;
  margin: 0;
}
.content {
  flex: 1; display: flex; padding: 0 40pt 30pt 40pt;
  gap: 20pt;
}
.pain-card {
  flex: 1; background: rgba(255,255,255,0.05);
  border: 1pt solid rgba(255,255,255,0.1);
  border-radius: 8pt; padding: 20pt;
  display: flex; flex-direction: column;
}
.icon-box {
  width: 40pt; height: 40pt; margin-bottom: 12pt;
}
.pain-title {
  color: #FFFFFF; font-size: 14pt; font-weight: bold;
  margin: 0 0 8pt 0;
}
.pain-desc {
  color: #94A3B8; font-size: 11pt; line-height: 1.4;
  margin: 0;
}
</style>
</head>
<body>
<div class="header">
  <p class="section-label">THE CHALLENGE</p>
  <h1 class="title">Why We Need Change</h1>
</div>
<div class="content">
  <div class="pain-card">
    <div class="icon-box"><img src="${ASSETS}/icon-clock-white.png" style="width: 40pt; height: 40pt;"></div>
    <h2 class="pain-title">Weeks of Work</h2>
    <p class="pain-desc">Proposals take 2-4 weeks to complete, delaying responses to opportunities</p>
  </div>
  <div class="pain-card">
    <div class="icon-box"><img src="${ASSETS}/icon-chart-white.png" style="width: 40pt; height: 40pt;"></div>
    <h2 class="pain-title">Inconsistent Quality</h2>
    <p class="pain-desc">Quality varies by team, with no standard approach or templates</p>
  </div>
  <div class="pain-card">
    <div class="icon-box"><img src="${ASSETS}/icon-layers-white.png" style="width: 40pt; height: 40pt;"></div>
    <h2 class="pain-title">Knowledge Silos</h2>
    <p class="pain-desc">Best practices and case studies scattered across the organization</p>
  </div>
  <div class="pain-card">
    <div class="icon-box"><img src="${ASSETS}/icon-target-white.png" style="width: 40pt; height: 40pt;"></div>
    <h2 class="pain-title">Senior Bottleneck</h2>
    <p class="pain-desc">Expert resources tied up in manual proposal writing</p>
  </div>
</div>
</body>
</html>`);

  // =============== SLIDE 3: Introducing ProposalAI ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #0070AD; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex;
  background-image: url('${ASSETS}/bg-solution.png');
  background-size: cover;
}
.left {
  width: 50%; display: flex; flex-direction: column;
  justify-content: center; padding: 40pt;
}
.right {
  width: 50%; display: flex; align-items: center;
  justify-content: center;
}
.section-label {
  color: rgba(255,255,255,0.7); font-size: 11pt; font-weight: bold;
  letter-spacing: 3pt; margin: 0 0 10pt 0;
}
.title {
  color: #FFFFFF; font-size: 40pt; font-weight: bold;
  margin: 0 0 15pt 0; line-height: 1.1;
}
.description {
  color: rgba(255,255,255,0.9); font-size: 16pt;
  line-height: 1.5; margin: 0;
}
.feature-box {
  background: rgba(255,255,255,0.15);
  border-radius: 12pt; padding: 30pt;
  backdrop-filter: blur(10px);
}
.stat-number {
  color: #FFFFFF; font-size: 72pt; font-weight: bold;
  margin: 0; line-height: 1;
}
.stat-label {
  color: rgba(255,255,255,0.8); font-size: 18pt;
  margin: 10pt 0 0 0;
}
</style>
</head>
<body>
<div class="left">
  <p class="section-label">INTRODUCING</p>
  <h1 class="title">ProposalAI</h1>
  <p class="description">An AI-powered proposal generation platform that leverages Capgemini's collective intelligence to create winning proposals in hours, not weeks.</p>
</div>
<div class="right">
  <div class="feature-box">
    <p class="stat-number">90%</p>
    <p class="stat-label">Faster Proposals</p>
  </div>
</div>
</body>
</html>`);

  // =============== SLIDE 4: IDD Methodology ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #1B365D; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background-image: url('${ASSETS}/bg-method.png');
  background-size: cover;
}
.header {
  padding: 25pt 40pt 15pt 40pt;
}
.section-label {
  color: #12ABDB; font-size: 11pt; font-weight: bold;
  letter-spacing: 3pt; margin: 0 0 5pt 0;
}
.title {
  color: #FFFFFF; font-size: 32pt; font-weight: bold;
  margin: 0;
}
.content {
  flex: 1; display: flex; padding: 0 40pt 60pt 40pt;
  gap: 15pt; align-items: stretch;
}
.layer {
  flex: 1; border-radius: 8pt; padding: 20pt;
  display: flex; flex-direction: column;
}
.l1 { background: rgba(0, 112, 173, 0.3); border-left: 4pt solid #0070AD; }
.l2 { background: rgba(18, 171, 219, 0.2); border-left: 4pt solid #12ABDB; }
.l3 { background: rgba(255, 255, 255, 0.1); border-left: 4pt solid #FFFFFF; }
.layer-num {
  color: rgba(255,255,255,0.5); font-size: 12pt; font-weight: bold;
  margin: 0 0 8pt 0;
}
.layer-title {
  color: #FFFFFF; font-size: 16pt; font-weight: bold;
  margin: 0 0 10pt 0;
}
.layer-items {
  color: #94A3B8; font-size: 11pt; line-height: 1.6;
  margin: 0; padding: 0 0 0 15pt;
}
.key-point {
  position: absolute; bottom: 70pt; left: 40pt; right: 40pt;
  background: rgba(18, 171, 219, 0.2); border-radius: 6pt;
  padding: 12pt 20pt;
}
.key-text {
  color: #12ABDB; font-size: 12pt; font-weight: bold;
  margin: 0; text-align: center;
}
</style>
</head>
<body>
<div class="header">
  <p class="section-label">OUR METHODOLOGY</p>
  <h1 class="title">Intent-Driven Development (IDD)</h1>
</div>
<div class="content">
  <div class="layer l1">
    <p class="layer-num">LAYER 1</p>
    <h2 class="layer-title">Company Truth</h2>
    <ul class="layer-items">
      <li>Verified capabilities</li>
      <li>Certifications</li>
      <li>Case studies with metrics</li>
      <li>Methodology frameworks</li>
    </ul>
  </div>
  <div class="layer l2">
    <p class="layer-num">LAYER 2</p>
    <h2 class="layer-title">Proposal Intent</h2>
    <ul class="layer-items">
      <li>Client outcomes</li>
      <li>Win strategy</li>
      <li>Constraints</li>
      <li>Competitive positioning</li>
    </ul>
  </div>
  <div class="layer l3">
    <p class="layer-num">LAYER 3</p>
    <h2 class="layer-title">Generated Content</h2>
    <ul class="layer-items">
      <li>AI-created sections</li>
      <li>Human reviewed</li>
      <li>Source citations</li>
      <li>Version controlled</li>
    </ul>
  </div>
</div>
<div class="key-point">
  <p class="key-text">Every claim is traceable to verified sources</p>
</div>
</body>
</html>`);

  // =============== SLIDE 5: Why We're Different ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #F5F7FA; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background-image: url('${ASSETS}/bg-content.png');
  background-size: cover;
}
.header {
  background: #1B365D; padding: 20pt 40pt;
}
.title {
  color: #FFFFFF; font-size: 28pt; font-weight: bold;
  margin: 0;
}
.content {
  flex: 1; display: flex; flex-wrap: wrap;
  padding: 25pt 35pt; gap: 15pt;
}
.diff-card {
  width: calc(50% - 10pt); background: #FFFFFF;
  border-radius: 8pt; padding: 18pt;
  box-shadow: 0 2pt 8pt rgba(0,0,0,0.08);
  display: flex; align-items: flex-start; gap: 15pt;
}
.icon-circle {
  width: 36pt; height: 36pt; min-width: 36pt;
  background: rgba(18, 171, 219, 0.1);
  border-radius: 50%; display: flex;
  align-items: center; justify-content: center;
}
.diff-title {
  color: #1B365D; font-size: 13pt; font-weight: bold;
  margin: 0 0 5pt 0;
}
.diff-desc {
  color: #64748B; font-size: 10pt; line-height: 1.4;
  margin: 0;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="title">Why We're Different</h1>
</div>
<div class="content">
  <div class="diff-card">
    <div class="icon-circle"><img src="${ASSETS}/icon-layers.png" style="width: 22pt; height: 22pt;"></div>
    <div>
      <h2 class="diff-title">Embedded Methodologies</h2>
      <p class="diff-desc">CCMF, ADMnext, and eAPM frameworks built into every proposal</p>
    </div>
  </div>
  <div class="diff-card">
    <div class="icon-circle"><img src="${ASSETS}/icon-star.png" style="width: 22pt; height: 22pt;"></div>
    <div>
      <h2 class="diff-title">Real Case Studies</h2>
      <p class="diff-desc">Verified metrics: BMW 5,200+ apps, HMRC £245M savings</p>
    </div>
  </div>
  <div class="diff-card">
    <div class="icon-circle"><img src="${ASSETS}/icon-target.png" style="width: 22pt; height: 22pt;"></div>
    <div>
      <h2 class="diff-title">Intent-First Approach</h2>
      <p class="diff-desc">Every proposal aligned to client outcomes from the start</p>
    </div>
  </div>
  <div class="diff-card">
    <div class="icon-circle"><img src="${ASSETS}/icon-check.png" style="width: 22pt; height: 22pt;"></div>
    <div>
      <h2 class="diff-title">Human-in-the-Loop</h2>
      <p class="diff-desc">AI generates, experts review and refine for quality</p>
    </div>
  </div>
  <div class="diff-card">
    <div class="icon-circle"><img src="${ASSETS}/icon-zap.png" style="width: 22pt; height: 22pt;"></div>
    <div>
      <h2 class="diff-title">Full Lifecycle</h2>
      <p class="diff-desc">Not just generation—collaboration, versioning, and export</p>
    </div>
  </div>
</div>
</body>
</html>`);

  // =============== SLIDE 6: How It Works ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #0A1628; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background-image: url('${ASSETS}/bg-challenge.png');
  background-size: cover;
}
.header {
  padding: 25pt 40pt 15pt 40pt;
}
.section-label {
  color: #12ABDB; font-size: 11pt; font-weight: bold;
  letter-spacing: 3pt; margin: 0 0 5pt 0;
}
.title {
  color: #FFFFFF; font-size: 32pt; font-weight: bold;
  margin: 0;
}
.content {
  flex: 1; display: flex; padding: 15pt 40pt 35pt 40pt;
  gap: 12pt; align-items: center;
}
.step {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; text-align: center;
}
.step-num {
  width: 36pt; height: 36pt; background: #12ABDB;
  border-radius: 50%; display: flex;
  align-items: center; justify-content: center;
  color: #FFFFFF; font-size: 16pt; font-weight: bold;
  margin-bottom: 12pt;
}
.step-title {
  color: #FFFFFF; font-size: 12pt; font-weight: bold;
  margin: 0 0 6pt 0;
}
.step-desc {
  color: #94A3B8; font-size: 9pt; line-height: 1.4;
  margin: 0;
}
.arrow-box {
  width: 20pt; display: flex;
  align-items: center; justify-content: center;
}
</style>
</head>
<body>
<div class="header">
  <p class="section-label">WORKFLOW</p>
  <h1 class="title">How It Works</h1>
</div>
<div class="content">
  <div class="step">
    <div class="step-num"><p>1</p></div>
    <h2 class="step-title">Define Client</h2>
    <p class="step-desc">Enter client details and opportunity context</p>
  </div>
  <div class="arrow-box"><img src="${ASSETS}/icon-arrow-white.png" style="width: 16pt; height: 16pt;"></div>
  <div class="step">
    <div class="step-num"><p>2</p></div>
    <h2 class="step-title">Set Outcomes</h2>
    <p class="step-desc">Define desired outcomes and win strategy</p>
  </div>
  <div class="arrow-box"><img src="${ASSETS}/icon-arrow-white.png" style="width: 16pt; height: 16pt;"></div>
  <div class="step">
    <div class="step-num"><p>3</p></div>
    <h2 class="step-title">AI Generates</h2>
    <p class="step-desc">AI creates content with company context</p>
  </div>
  <div class="arrow-box"><img src="${ASSETS}/icon-arrow-white.png" style="width: 16pt; height: 16pt;"></div>
  <div class="step">
    <div class="step-num"><p>4</p></div>
    <h2 class="step-title">Review</h2>
    <p class="step-desc">Refine and collaborate with team</p>
  </div>
  <div class="arrow-box"><img src="${ASSETS}/icon-arrow-white.png" style="width: 16pt; height: 16pt;"></div>
  <div class="step">
    <div class="step-num"><p>5</p></div>
    <h2 class="step-title">Export</h2>
    <p class="step-desc">PPTX, DOCX, PDF, or web format</p>
  </div>
</div>
</body>
</html>`);

  // =============== SLIDE 7: Key Benefits ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #F5F7FA; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background-image: url('${ASSETS}/bg-content.png');
  background-size: cover;
}
.header {
  background: #1B365D; padding: 20pt 40pt;
}
.title {
  color: #FFFFFF; font-size: 28pt; font-weight: bold;
  margin: 0;
}
.content {
  flex: 1; display: flex; padding: 25pt 40pt;
  gap: 20pt;
}
.benefit {
  flex: 1; background: #FFFFFF;
  border-radius: 12pt; padding: 25pt 20pt;
  text-align: center;
  box-shadow: 0 4pt 12pt rgba(0,0,0,0.08);
}
.benefit-icon {
  margin-bottom: 10pt;
}
.benefit-number {
  color: #0070AD; font-size: 36pt; font-weight: bold;
  margin: 0;
}
.benefit-label {
  color: #1B365D; font-size: 14pt; font-weight: bold;
  margin: 8pt 0 6pt 0;
}
.benefit-desc {
  color: #64748B; font-size: 10pt; line-height: 1.4;
  margin: 0;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="title">Key Benefits</h1>
</div>
<div class="content">
  <div class="benefit">
    <div class="benefit-icon"><img src="${ASSETS}/icon-zap.png" style="width: 36pt; height: 36pt;"></div>
    <p class="benefit-number">90%</p>
    <h2 class="benefit-label">Faster</h2>
    <p class="benefit-desc">From weeks to hours for complete proposals</p>
  </div>
  <div class="benefit">
    <div class="benefit-icon"><img src="${ASSETS}/icon-trophy.png" style="width: 36pt; height: 36pt;"></div>
    <p class="benefit-number">15-25%</p>
    <h2 class="benefit-label">Win Rate</h2>
    <p class="benefit-desc">Better targeting and methodology alignment</p>
  </div>
  <div class="benefit">
    <div class="benefit-icon"><img src="${ASSETS}/icon-chart.png" style="width: 36pt; height: 36pt;"></div>
    <p class="benefit-number">100%</p>
    <h2 class="benefit-label">Consistent</h2>
    <p class="benefit-desc">Every proposal follows best practices</p>
  </div>
  <div class="benefit">
    <div class="benefit-icon"><img src="${ASSETS}/icon-scale.png" style="width: 36pt; height: 36pt;"></div>
    <p class="benefit-number">3x</p>
    <h2 class="benefit-label">Scale</h2>
    <p class="benefit-desc">Handle more opportunities with same team</p>
  </div>
</div>
</body>
</html>`);

  // =============== SLIDE 8: Demo Highlights ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #1B365D; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background-image: url('${ASSETS}/bg-method.png');
  background-size: cover;
}
.header {
  padding: 25pt 40pt 15pt 40pt;
}
.section-label {
  color: #12ABDB; font-size: 11pt; font-weight: bold;
  letter-spacing: 3pt; margin: 0 0 5pt 0;
}
.title {
  color: #FFFFFF; font-size: 32pt; font-weight: bold;
  margin: 0;
}
.content {
  flex: 1; display: flex; padding: 10pt 40pt 60pt 40pt;
  gap: 20pt;
}
.features {
  width: 50%; display: flex; flex-direction: column;
  gap: 12pt;
}
.feature {
  background: rgba(255,255,255,0.08);
  border-radius: 6pt; padding: 14pt 18pt;
  display: flex; align-items: center; gap: 12pt;
}
.feature-text {
  color: #FFFFFF; font-size: 12pt; margin: 0;
}
.preview {
  width: 50%; background: rgba(0,0,0,0.3);
  border-radius: 10pt; border: 1pt solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
}
.preview-text {
  color: #64748B; font-size: 14pt; margin: 0;
  text-align: center;
}
</style>
</head>
<body>
<div class="header">
  <p class="section-label">DEMO</p>
  <h1 class="title">Platform Highlights</h1>
</div>
<div class="content">
  <div class="features">
    <div class="feature">
      <div><img src="${ASSETS}/icon-check-white.png" style="width: 20pt; height: 20pt;"></div>
      <p class="feature-text">Modern, intuitive user interface</p>
    </div>
    <div class="feature">
      <div><img src="${ASSETS}/icon-check-white.png" style="width: 20pt; height: 20pt;"></div>
      <p class="feature-text">Step-by-step proposal wizard</p>
    </div>
    <div class="feature">
      <div><img src="${ASSETS}/icon-check-white.png" style="width: 20pt; height: 20pt;"></div>
      <p class="feature-text">AI-generated sections with citations</p>
    </div>
    <div class="feature">
      <div><img src="${ASSETS}/icon-check-white.png" style="width: 20pt; height: 20pt;"></div>
      <p class="feature-text">Version history and collaboration</p>
    </div>
    <div class="feature">
      <div><img src="${ASSETS}/icon-check-white.png" style="width: 20pt; height: 20pt;"></div>
      <p class="feature-text">Multi-format export (PPTX, DOCX, PDF)</p>
    </div>
  </div>
  <div class="preview">
    <p class="preview-text">Live Demo<br>or Screenshot</p>
  </div>
</div>
</body>
</html>`);

  // =============== SLIDE 9: Future Roadmap ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #F5F7FA; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background-image: url('${ASSETS}/bg-content.png');
  background-size: cover;
}
.header {
  background: #1B365D; padding: 20pt 40pt;
}
.title {
  color: #FFFFFF; font-size: 28pt; font-weight: bold;
  margin: 0;
}
.content {
  flex: 1; display: flex; padding: 25pt 40pt;
  gap: 15pt;
}
.phase {
  flex: 1; background: #FFFFFF;
  border-radius: 8pt; padding: 18pt;
  box-shadow: 0 2pt 8pt rgba(0,0,0,0.06);
  border-top: 4pt solid #12ABDB;
}
.phase-num {
  color: #12ABDB; font-size: 10pt; font-weight: bold;
  letter-spacing: 1pt; margin: 0 0 6pt 0;
}
.phase-title {
  color: #1B365D; font-size: 13pt; font-weight: bold;
  margin: 0 0 8pt 0;
}
.phase-desc {
  color: #64748B; font-size: 9pt; line-height: 1.5;
  margin: 0;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="title">Future Roadmap</h1>
</div>
<div class="content">
  <div class="phase">
    <p class="phase-num">PHASE 2</p>
    <h2 class="phase-title">RFP Parsing</h2>
    <p class="phase-desc">Auto-parse RFPs and map requirements to response sections</p>
  </div>
  <div class="phase">
    <p class="phase-num">PHASE 3</p>
    <h2 class="phase-title">Competitive Intel</h2>
    <p class="phase-desc">Integrate competitive intelligence for better positioning</p>
  </div>
  <div class="phase">
    <p class="phase-num">PHASE 4</p>
    <h2 class="phase-title">Win/Loss Analysis</h2>
    <p class="phase-desc">Learn from outcomes to improve future proposals</p>
  </div>
  <div class="phase">
    <p class="phase-num">PHASE 5</p>
    <h2 class="phase-title">Voice Training</h2>
    <p class="phase-desc">Client-specific tone and messaging customization</p>
  </div>
  <div class="phase">
    <p class="phase-num">PHASE 6</p>
    <h2 class="phase-title">CRM Integration</h2>
    <p class="phase-desc">Seamless connection with Salesforce and pipelines</p>
  </div>
</div>
</body>
</html>`);

  // =============== SLIDE 10: Call to Action ===============
  slides.push(`<!DOCTYPE html>
<html>
<head>
<style>
html { background: #0070AD; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background-image: url('${ASSETS}/bg-cta.png');
  background-size: cover;
}
.icon-box {
  margin-bottom: 20pt;
}
.cta-title {
  color: #FFFFFF; font-size: 40pt; font-weight: bold;
  text-align: center; margin: 0 0 15pt 0;
}
.cta-subtitle {
  color: rgba(255,255,255,0.8); font-size: 18pt;
  text-align: center; margin: 0 0 30pt 0;
}
.next-steps {
  display: flex; gap: 30pt;
  margin-bottom: 30pt;
}
.step-item {
  background: rgba(255,255,255,0.15);
  border-radius: 8pt; padding: 16pt 24pt;
  text-align: center;
}
.step-text {
  color: #FFFFFF; font-size: 14pt; font-weight: bold;
  margin: 0;
}
.contact {
  color: rgba(255,255,255,0.6); font-size: 12pt;
  text-align: center; margin: 0;
}
</style>
</head>
<body>
<div class="icon-box"><img src="${ASSETS}/icon-rocket.png" style="width: 60pt; height: 60pt;"></div>
<h1 class="cta-title">Ready to Transform Your Proposals?</h1>
<p class="cta-subtitle">Join the future of intelligent proposal generation</p>
<div class="next-steps">
  <div class="step-item"><p class="step-text">Pilot Program</p></div>
  <div class="step-item"><p class="step-text">Training</p></div>
  <div class="step-item"><p class="step-text">Rollout</p></div>
</div>
<p class="contact">Contact: proposalai@capgemini.com</p>
</body>
</html>`);

  // Write slides to files
  slides.forEach((html, i) => {
    fs.writeFileSync(path.join(SLIDES, `slide-${i + 1}.html`), html);
  });

  console.log(`Created ${slides.length} slide HTML files`);
  return slides.length;
}

// Build the presentation
async function buildPresentation() {
  console.log('Building ProposalAI Presentation...\n');

  // Step 1: Create assets
  console.log('Step 1: Creating gradient backgrounds...');
  await createGradients();

  console.log('Step 2: Creating icons...');
  await createIcons();

  console.log('Step 3: Creating HTML slides...');
  const slideCount = createSlides();

  // Step 4: Convert to PPTX
  console.log('Step 4: Converting to PowerPoint...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'ProposalAI - Intelligent Proposal Generation';
  pptx.author = 'Capgemini';
  pptx.company = 'Capgemini';

  for (let i = 1; i <= slideCount; i++) {
    const htmlPath = path.join(SLIDES, `slide-${i}.html`);
    console.log(`  Processing slide ${i}...`);
    try {
      await html2pptx(htmlPath, pptx, { tmpDir: WORKSPACE });
    } catch (err) {
      console.error(`  Error on slide ${i}:`, err.message);
    }
  }

  // Save
  const outputPath = path.join(WORKSPACE, 'ProposalAI-Presentation.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

buildPresentation().catch(console.error);
