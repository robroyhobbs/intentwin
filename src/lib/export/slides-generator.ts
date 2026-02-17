/**
 * Cinematic Executive Presentation Generator
 *
 * Design: Luxury editorial meets high-stakes consulting
 * Think McKinsey deck meets Apple keynote - dark, confident, sophisticated
 *
 * This is the main entry point. Sub-modules handle:
 *   - slides/types.ts        — Shared interfaces
 *   - slides/constants.ts    — Brand palette & narrative mapping
 *   - slides/icons.ts        — SVG icon constants
 *   - slides/styles.ts       — Full CSS stylesheet
 *   - slides/templates.ts    — Slide HTML template functions
 *   - slides/slide-builder.ts — Proposal → SlideContent[] conversion
 */

import { escapeHtml } from "@/lib/email/escape-html";

import type { ProposalData } from "./slides/types";
import { buildSlides } from "./slides/slide-builder";
import { renderSlide } from "./slides/templates";
import { getSlideStyles } from "./slides/styles";

/**
 * Returns the navigation JavaScript for the slide deck (IIFE).
 */
function getNavigationScript(): string {
  return `
(function() {
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  let idx = 0;

  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  const current = document.getElementById('current');
  const fill = document.getElementById('fill');
  const fsBtn = document.getElementById('fsBtn');

  function update() {
    slides.forEach((s, i) => {
      s.classList.remove('active');
      if (i === idx) s.classList.add('active');
    });
    current.textContent = idx + 1;
    fill.style.width = ((idx + 1) / total * 100) + '%';
    prev.disabled = idx === 0;
    next.disabled = idx === total - 1;
    history.replaceState(null, null, '#' + (idx + 1));
  }

  function goNext() { if (idx < total - 1) { idx++; update(); } }
  function goPrev() { if (idx > 0) { idx--; update(); } }
  function goTo(i) { if (i >= 0 && i < total) { idx = i; update(); } }

  next.onclick = goNext;
  prev.onclick = goPrev;

  document.onkeydown = function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(total - 1); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFs(); }
  };

  let tx = 0;
  document.ontouchstart = e => tx = e.changedTouches[0].screenX;
  document.ontouchend = e => {
    const d = tx - e.changedTouches[0].screenX;
    if (Math.abs(d) > 50) d > 0 ? goNext() : goPrev();
  };

  function toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
  fsBtn.onclick = toggleFs;

  const hash = window.location.hash.match(/^#(\\d+)$/);
  if (hash) goTo(parseInt(hash[1], 10) - 1);
  update();
})();`;
}

/**
 * Generates a complete, self-contained HTML slide deck from proposal data.
 *
 * This is the primary public API for the slides generator.
 */
export async function generateSlides(data: ProposalData): Promise<string> {
  const companyName = data.company_name || "IntentWin";
  const slides = buildSlides(data, companyName);
  const totalSlides = slides.length;
  const slidesHtml = slides
    .map((slide, idx) => renderSlide(slide, idx, companyName))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.title)} | ${escapeHtml(companyName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${getSlideStyles()}
</style>
</head>
<body>

<div class="slides" id="slides">
  ${slidesHtml}
</div>

<nav class="nav">
  <button class="nav__btn" id="prevBtn" aria-label="Previous">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
  </button>
  <div class="nav__info">
    <span class="nav__text"><span id="current">1</span> / <span id="total">${totalSlides}</span></span>
    <div class="nav__bar"><div class="nav__fill" id="fill"></div></div>
  </div>
  <button class="nav__btn" id="nextBtn" aria-label="Next">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  </button>
</nav>

<button class="fullscreen-btn" id="fsBtn" aria-label="Fullscreen">⛶</button>

<script>
${getNavigationScript()}
</script>

</body>
</html>`;
}

// Re-export types for consumers
export type { ProposalData, ProposalSection, SlideContent } from "./slides/types";
