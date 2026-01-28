import { extractMermaidBlocks } from "@/lib/diagrams/extract-mermaid";
import { batchMermaidToSvg } from "@/lib/diagrams/mermaid-to-svg";

interface ProposalSection {
  title: string;
  content: string;
  section_type: string;
}

interface ProposalData {
  title: string;
  client_name: string;
  date: string;
  sections: ProposalSection[];
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const htmlLines: string[] = [];
  let inList = false;
  let inOrderedList = false;
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Table rows
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;
      if (!inTable) {
        if (inList) { htmlLines.push("</ul>"); inList = false; }
        if (inOrderedList) { htmlLines.push("</ol>"); inOrderedList = false; }
        htmlLines.push('<table class="content-table">');
        inTable = true;
      }
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      const cellTag = htmlLines.filter((l) => l.includes("<tr>")).length === 0 ? "th" : "td";
      htmlLines.push(
        `<tr>${cells.map((c) => `<${cellTag}>${inlineFormat(c)}</${cellTag}>`).join("")}</tr>`
      );
      continue;
    } else if (inTable) {
      htmlLines.push("</table>");
      inTable = false;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      if (inOrderedList) { htmlLines.push("</ol>"); inOrderedList = false; }
      htmlLines.push(`<h4>${inlineFormat(trimmed.slice(4))}</h4>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      if (inOrderedList) { htmlLines.push("</ol>"); inOrderedList = false; }
      htmlLines.push(`<h3>${inlineFormat(trimmed.slice(3))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      if (inOrderedList) { htmlLines.push("</ol>"); inOrderedList = false; }
      htmlLines.push(`<h2>${inlineFormat(trimmed.slice(2))}</h2>`);
      continue;
    }

    // Unordered lists
    if (/^[-*]\s/.test(trimmed)) {
      if (inOrderedList) { htmlLines.push("</ol>"); inOrderedList = false; }
      if (!inList) { htmlLines.push("<ul>"); inList = true; }
      htmlLines.push(`<li>${inlineFormat(trimmed.slice(2))}</li>`);
      continue;
    }
    // Ordered lists
    if (/^\d+\.\s/.test(trimmed)) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      if (!inOrderedList) { htmlLines.push("<ol>"); inOrderedList = true; }
      htmlLines.push(`<li>${inlineFormat(trimmed.replace(/^\d+\.\s/, ""))}</li>`);
      continue;
    }

    if (inList && trimmed) { htmlLines.push("</ul>"); inList = false; }
    if (inOrderedList && trimmed) { htmlLines.push("</ol>"); inOrderedList = false; }

    if (!trimmed) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      if (inOrderedList) { htmlLines.push("</ol>"); inOrderedList = false; }
      continue;
    }

    htmlLines.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  if (inList) htmlLines.push("</ul>");
  if (inOrderedList) htmlLines.push("</ol>");
  if (inTable) htmlLines.push("</table>");

  return htmlLines.join("\n");
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="inline-code">$1</code>');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ACCENT_COLORS = ["#0070AD", "#12ABDB", "#1B365D", "#0070AD", "#12ABDB"];

export async function generateHtml(data: ProposalData): Promise<string> {
  // Collect all mermaid blocks for batch SVG conversion
  const allMermaidCodes: string[] = [];
  for (const section of data.sections) {
    const blocks = extractMermaidBlocks(section.content);
    for (const b of blocks) {
      if (b.type === "mermaid") allMermaidCodes.push(b.content);
    }
  }

  const svgMap = await batchMermaidToSvg(allMermaidCodes);

  // Build section HTML
  const sectionsHtml = data.sections
    .map((section, idx) => {
      const slug = slugify(section.title);
      const blocks = extractMermaidBlocks(section.content);
      const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
      const bodyHtml = blocks
        .map((block) => {
          if (block.type === "mermaid") {
            const svg = svgMap.get(block.content);
            if (svg) {
              return `<div class="diagram-container"><div class="diagram">${svg}</div></div>`;
            }
            return `<pre class="diagram-fallback"><code>${escapeHtml(block.content)}</code></pre>`;
          }
          return markdownToHtml(block.content);
        })
        .join("\n");

      return `
      <section id="${slug}" class="proposal-section animate-on-scroll" data-accent="${accentColor}">
        <div class="section-inner">
          <div class="section-header">
            <span class="section-number">${String(idx + 1).padStart(2, "0")}</span>
            <h2 class="section-title" style="border-left-color: ${accentColor}">${escapeHtml(section.title)}</h2>
          </div>
          <div class="section-body">${bodyHtml}</div>
        </div>
      </section>`;
    })
    .join("\n");

  // Build TOC
  const tocHtml = data.sections
    .map((s, i) => {
      const slug = slugify(s.title);
      return `<a href="#${slug}" class="toc-item" data-index="${i}">
        <span class="toc-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="toc-text">${escapeHtml(s.title)}</span>
      </a>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.title)} | Capgemini</title>
<meta name="description" content="Proposal for ${escapeHtml(data.client_name)} - ${escapeHtml(data.title)}">
<meta property="og:title" content="${escapeHtml(data.title)} | Capgemini">
<meta property="og:description" content="Proposal prepared for ${escapeHtml(data.client_name)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0070AD">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --cap-blue: #0070AD;
    --cap-dark: #1B365D;
    --cap-accent: #12ABDB;
    --cap-light: #F5F7FA;
    --cap-text: #333333;
    --cap-text-light: #64748B;
    --cap-border: #E2E8F0;
    --cap-white: #FFFFFF;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 30px rgba(0,0,0,0.12);
    --radius: 16px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--cap-text);
    background: var(--cap-light);
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  /* ===== HERO ===== */
  .hero {
    background: linear-gradient(135deg, #0F2440 0%, #1B365D 30%, #0070AD 70%, #12ABDB 100%);
    color: #fff;
    padding: 100px 60px 80px;
    position: relative;
    overflow: hidden;
    min-height: 420px;
    display: flex;
    align-items: center;
  }
  .hero::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: rgba(18, 171, 219, 0.08);
    animation: float 6s ease-in-out infinite;
  }
  .hero::after {
    content: '';
    position: absolute;
    bottom: -80px;
    left: 10%;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.03);
    animation: float 8s ease-in-out infinite;
    animation-delay: 2s;
  }
  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 800px;
  }
  .hero-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 100px;
    padding: 6px 16px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.9);
    margin-bottom: 24px;
  }
  .hero-label .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #12ABDB;
    box-shadow: 0 0 8px rgba(18,171,219,0.6);
  }
  .hero h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 3.2rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 16px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.2);
  }
  .hero .subtitle {
    font-size: 1.25rem;
    font-weight: 300;
    opacity: 0.85;
    margin-bottom: 32px;
  }
  .hero-meta {
    display: flex;
    gap: 24px;
    font-size: 0.85rem;
    opacity: 0.6;
  }
  .hero-meta span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Floating shapes */
  .shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .shape-1 { width: 120px; height: 120px; top: 60px; right: 15%; animation: float 7s ease-in-out infinite; }
  .shape-2 { width: 60px; height: 60px; top: 40%; right: 8%; border-radius: 12px; animation: float 5s ease-in-out infinite; animation-delay: 1s; }
  .shape-3 { width: 80px; height: 80px; bottom: 30px; right: 25%; animation: float 9s ease-in-out infinite; animation-delay: 3s; }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }

  /* ===== STATS BAR ===== */
  .stats-bar {
    max-width: 1100px;
    margin: -40px auto 0;
    padding: 0 40px;
    position: relative;
    z-index: 10;
  }
  .stats-bar-inner {
    display: flex;
    gap: 1px;
    background: rgba(0,112,173,0.1);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  .stat-card {
    flex: 1;
    background: var(--cap-white);
    padding: 24px 28px;
    text-align: center;
  }
  .stat-card:first-child { border-radius: var(--radius) 0 0 var(--radius); }
  .stat-card:last-child { border-radius: 0 var(--radius) var(--radius) 0; }
  .stat-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--cap-dark);
  }
  .stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cap-text-light);
    margin-top: 4px;
    font-weight: 600;
  }

  /* ===== LAYOUT ===== */
  .layout {
    display: flex;
    max-width: 1100px;
    margin: 60px auto 0;
    padding: 0 40px;
    gap: 48px;
  }

  /* ===== TOC SIDEBAR ===== */
  .toc {
    width: 240px;
    flex-shrink: 0;
    position: sticky;
    top: 24px;
    height: fit-content;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
  }
  .toc-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--cap-accent);
    font-weight: 700;
    margin-bottom: 16px;
    padding: 0 12px;
  }
  .toc-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    font-size: 0.8rem;
    color: var(--cap-text-light);
    text-decoration: none;
    border-radius: 10px;
    margin-bottom: 2px;
    transition: all 0.2s ease;
  }
  .toc-item:hover {
    background: var(--cap-white);
    color: var(--cap-blue);
    box-shadow: var(--shadow-sm);
  }
  .toc-item.active {
    background: var(--cap-white);
    color: var(--cap-blue);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
  }
  .toc-num {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--cap-accent);
    opacity: 0.7;
    min-width: 20px;
  }
  .toc-text {
    flex: 1;
  }

  /* ===== SECTIONS ===== */
  .main {
    flex: 1;
    min-width: 0;
    padding-bottom: 80px;
  }

  .proposal-section {
    margin-bottom: 32px;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .proposal-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .section-inner {
    background: var(--cap-white);
    border-radius: var(--radius);
    padding: 40px 44px;
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(226, 232, 240, 0.6);
    transition: box-shadow 0.3s ease;
  }
  .section-inner:hover {
    box-shadow: var(--shadow-md);
  }

  .section-header {
    margin-bottom: 28px;
  }
  .section-number {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--cap-accent);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .section-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.7rem;
    font-weight: 700;
    color: var(--cap-dark);
    padding-left: 16px;
    border-left: 4px solid var(--cap-blue);
    line-height: 1.3;
  }

  /* Section body typography */
  .section-body h2 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.35rem;
    color: var(--cap-dark);
    margin: 32px 0 12px;
    font-weight: 700;
  }
  .section-body h3 {
    font-size: 1.1rem;
    color: var(--cap-dark);
    margin: 24px 0 10px;
    font-weight: 600;
  }
  .section-body h4 {
    font-size: 0.95rem;
    color: var(--cap-blue);
    margin: 20px 0 8px;
    font-weight: 600;
  }
  .section-body p {
    margin-bottom: 14px;
    color: var(--cap-text);
    font-size: 0.95rem;
  }
  .section-body ul, .section-body ol {
    margin: 14px 0 14px 24px;
  }
  .section-body li {
    margin-bottom: 8px;
    font-size: 0.95rem;
    color: var(--cap-text);
  }
  .section-body li::marker {
    color: var(--cap-accent);
  }
  .section-body strong {
    color: var(--cap-dark);
    font-weight: 600;
  }
  .inline-code {
    background: var(--cap-light);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85em;
    font-family: 'SF Mono', Monaco, monospace;
    color: var(--cap-blue);
  }
  .content-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 20px 0;
    font-size: 0.88rem;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .content-table th, .content-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--cap-border);
  }
  .content-table th {
    background: linear-gradient(135deg, var(--cap-dark), var(--cap-blue));
    color: #fff;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .content-table tr:last-child td { border-bottom: none; }
  .content-table tr:nth-child(even) td { background: var(--cap-light); }
  .content-table tr:hover td { background: rgba(0,112,173,0.04); }

  /* Diagrams */
  .diagram-container {
    margin: 24px 0;
    padding: 28px;
    background: linear-gradient(135deg, var(--cap-light) 0%, #E8F4FD 100%);
    border: 1px solid var(--cap-border);
    border-radius: 12px;
    text-align: center;
  }
  .diagram svg { max-width: 100%; height: auto; }
  .diagram-fallback {
    margin: 20px 0;
    padding: 20px;
    background: #FFFBEB;
    border: 1px solid #FDE68A;
    border-radius: 10px;
    font-size: 0.8rem;
    overflow-x: auto;
    font-family: monospace;
  }

  /* ===== FOOTER ===== */
  .footer {
    background: linear-gradient(135deg, #0F2440 0%, var(--cap-dark) 100%);
    color: rgba(255,255,255,0.5);
    text-align: center;
    padding: 48px 40px;
    margin-top: 40px;
  }
  .footer-brand {
    font-size: 1.1rem;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    margin-bottom: 8px;
  }
  .footer-brand span {
    color: var(--cap-accent);
  }
  .footer p {
    font-size: 0.8rem;
    line-height: 1.8;
  }
  .footer-divider {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, var(--cap-blue), var(--cap-accent));
    margin: 20px auto;
    border-radius: 1px;
  }

  /* ===== PRINT ===== */
  @media print {
    body { background: #fff; }
    .toc { display: none; }
    .stats-bar { display: none; }
    .layout { max-width: 100%; padding: 0; }
    .main { padding: 0; }
    .hero { padding: 40px; min-height: auto; }
    .hero h1 { font-size: 2rem; }
    .section-inner { box-shadow: none; border: 1px solid #ddd; page-break-inside: avoid; }
    .proposal-section { opacity: 1; transform: none; margin-bottom: 20px; }
    .shape, .hero::before, .hero::after { display: none; }
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 900px) {
    .toc { display: none; }
    .layout { padding: 0 20px; }
    .hero { padding: 60px 24px 50px; min-height: auto; }
    .hero h1 { font-size: 2rem; }
    .hero .subtitle { font-size: 1rem; }
    .section-inner { padding: 24px; }
    .section-title { font-size: 1.3rem; }
    .stats-bar { padding: 0 20px; }
    .stats-bar-inner { flex-direction: column; }
    .stat-card { border-radius: 0 !important; }
    .stat-card:first-child { border-radius: var(--radius) var(--radius) 0 0 !important; }
    .stat-card:last-child { border-radius: 0 0 var(--radius) var(--radius) !important; }
    .shape { display: none; }
  }
</style>
</head>
<body>

<!-- Hero -->
<header class="hero">
  <div class="shape shape-1"></div>
  <div class="shape shape-2"></div>
  <div class="shape shape-3"></div>
  <div class="hero-inner">
    <div class="hero-label">
      <span class="dot"></span>
      Capgemini Proposal
    </div>
    <h1>${escapeHtml(data.title)}</h1>
    <p class="subtitle">Prepared exclusively for ${escapeHtml(data.client_name)}</p>
    <div class="hero-meta">
      <span>${escapeHtml(data.date)}</span>
      <span>|</span>
      <span>Confidential</span>
      <span>|</span>
      <span>${data.sections.length} Sections</span>
    </div>
  </div>
</header>

<!-- Stats Bar -->
<div class="stats-bar">
  <div class="stats-bar-inner">
    <div class="stat-card">
      <div class="stat-value">${data.sections.length}</div>
      <div class="stat-label">Sections</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${escapeHtml(data.client_name.split(' ')[0] || 'Client')}</div>
      <div class="stat-label">Prepared For</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${escapeHtml(data.date.split(',')[0] || data.date)}</div>
      <div class="stat-label">Date</div>
    </div>
  </div>
</div>

<!-- Layout -->
<div class="layout">
  <nav class="toc">
    <div class="toc-label">Contents</div>
    ${tocHtml}
  </nav>

  <main class="main">
    ${sectionsHtml}
  </main>
</div>

<!-- Footer -->
<footer class="footer">
  <p class="footer-brand"><span>Capgemini</span> Proposal Generator</p>
  <div class="footer-divider"></div>
  <p>${escapeHtml(data.title)}</p>
  <p>Prepared for ${escapeHtml(data.client_name)} &middot; ${escapeHtml(data.date)}</p>
  <p style="margin-top: 16px; opacity: 0.4;">This document is confidential and intended solely for the intended recipient.</p>
</footer>

<!-- Scroll animations + Active TOC -->
<script>
(function() {
  // IntersectionObserver for scroll animations
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
    observer.observe(el);
  });

  // Active TOC highlighting
  var sections = document.querySelectorAll('.proposal-section');
  var tocItems = document.querySelectorAll('.toc-item');

  var tocObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        tocItems.forEach(function(item) {
          item.classList.toggle('active', item.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' });

  sections.forEach(function(section) {
    tocObserver.observe(section);
  });
})();
</script>

</body>
</html>`;
}
