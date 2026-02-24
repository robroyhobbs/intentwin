/**
 * CSS styles for the cinematic executive presentation
 *
 * Design: Luxury editorial meets high-stakes consulting
 * Think McKinsey deck meets Apple keynote - dark, confident, sophisticated
 */

import { COLORS, buildColors } from "./constants";
import type { BrandingSettings } from "./types";

/**
 * Returns the full CSS stylesheet for the slide presentation.
 * When branding is provided, colors and fonts are overridden via CSS custom properties.
 */
export function getSlideStyles(branding?: BrandingSettings): string {
  const colors = buildColors(branding);
  const fontDisplay = branding?.font_family || "Outfit";
  const fontBody = branding?.font_family || "Sora";

  return `
:root {
  --navy: ${colors.navy};
  --navy-light: ${colors.navyLight};
  --blue: ${colors.blue};
  --cyan: ${colors.cyan};
  --cyan-glow: ${colors.cyanGlow};
  --white: ${colors.white};
  --off-white: ${colors.offWhite};
  --gray: ${colors.gray};
  --gray-light: ${colors.grayLight};
  --gray-dark: ${colors.grayDark};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  font-family: '${fontBody}', sans-serif;
  background: var(--navy);
  color: var(--white);
  -webkit-font-smoothing: antialiased;
}

/* ═══════════════════════════════════════════════════════════════
   SLIDES CONTAINER
   ═══════════════════════════════════════════════════════════════ */
.slides { width: 100%; height: 100%; position: relative; }

.slide {
  position: absolute;
  inset: 0;
  display: flex;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.98) translateY(20px);
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.slide.active {
  opacity: 1;
  visibility: visible;
  transform: scale(1) translateY(0);
}

/* ═══════════════════════════════════════════════════════════════
   HERO SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--hero {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.hero__bg {
  position: absolute;
  inset: 0;
}

.hero__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 100% 80% at 50% 100%, var(--cyan-glow), transparent 60%),
    radial-gradient(ellipse 80% 50% at 80% 20%, rgba(0, 112, 173, 0.2), transparent),
    linear-gradient(180deg, var(--navy) 0%, #0D1F35 100%);
}

.hero__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: overlay;
}

.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 8s ease-in-out infinite;
}

.hero__orb--1 {
  width: 600px; height: 600px;
  top: -200px; right: -100px;
  background: radial-gradient(circle, var(--cyan-glow), transparent 70%);
}

.hero__orb--2 {
  width: 400px; height: 400px;
  bottom: -100px; left: -50px;
  background: radial-gradient(circle, rgba(0, 112, 173, 0.3), transparent 70%);
  animation-delay: -4s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -30px) scale(1.05); }
}

.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent);
}

.hero__content {
  position: relative;
  z-index: 2;
  max-width: 1000px;
  padding: 0 40px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px;
  padding: 10px 24px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 48px;
  backdrop-filter: blur(12px);
}

.hero__badge-dot {
  width: 8px; height: 8px;
  background: var(--cyan);
  border-radius: 50%;
  box-shadow: 0 0 20px var(--cyan), 0 0 40px var(--cyan);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.hero__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 32px;
  background: linear-gradient(135deg, var(--white) 0%, var(--gray-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__divider {
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, var(--cyan), var(--blue));
  border-radius: 2px;
  margin: 0 auto 32px;
}

.hero__client {
  font-size: 1.25rem;
  font-weight: 300;
  color: var(--gray-light);
}

.hero__client strong {
  color: var(--white);
  font-weight: 600;
}

.hero__footer {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.hero__footer-dot {
  width: 4px; height: 4px;
  background: var(--gray);
  border-radius: 50%;
}

/* ═══════════════════════════════════════════════════════════════
   EXECUTIVE SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--executive {
  flex-direction: column;
  position: relative;
  padding: 80px 100px;
}

.executive__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--navy) 0%, #0D1F35 100%);
}

.executive__gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 40% at 80% 20%, rgba(18, 171, 219, 0.15), transparent);
}

.executive__accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, var(--cyan), var(--blue));
}

.executive__content {
  position: relative;
  z-index: 2;
  max-width: 1000px;
}

.executive__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
}

.executive__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: var(--cyan);
}

.executive__icon svg { width: 28px; height: 28px; }

.executive__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
  margin-bottom: 4px;
  display: block;
}

.executive__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.executive__subtitle {
  font-size: 1.1rem;
  color: var(--gray-light);
  margin-bottom: 48px;
  max-width: 700px;
}

.executive__points {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.executive__point {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px 28px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .executive__point {
  opacity: 1;
  transform: translateX(0);
}

.executive__point-marker {
  font-family: '${fontDisplay}', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--cyan);
  background: rgba(18, 171, 219, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
  flex-shrink: 0;
}

.executive__point-text {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   UNDERSTANDING SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--understanding {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.understanding__left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
  background: linear-gradient(135deg, var(--blue) 0%, var(--navy-light) 100%);
  color: var(--white);
}

.understanding__icon {
  width: 64px; height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border-radius: 16px;
  color: var(--cyan);
  margin-bottom: 32px;
}

.understanding__icon svg { width: 32px; height: 32px; }

.understanding__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
  margin-bottom: 12px;
}

.understanding__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.understanding__subtitle {
  font-size: 1rem;
  color: rgba(255,255,255,0.7);
}

.understanding__right {
  display: flex;
  align-items: center;
  padding: 60px;
  background: var(--navy);
}

.understanding__cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.understanding__card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .understanding__card {
  opacity: 1;
  transform: translateY(0);
}

.understanding__card-icon {
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cyan);
  border-radius: 50%;
  flex-shrink: 0;
}

.understanding__card-icon svg {
  width: 14px; height: 14px;
  color: var(--navy);
}

.understanding__card-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   METHODOLOGY SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--methodology {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--white);
  color: var(--navy);
}

.methodology__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.methodology__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  border-radius: 14px;
}

.methodology__icon svg { width: 28px; height: 28px; }

.methodology__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 4px;
  display: block;
}

.methodology__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.methodology__subtitle {
  font-size: 1.1rem;
  color: var(--gray);
  margin-bottom: 48px;
}

.methodology__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.methodology__item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: var(--off-white);
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.04);
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .methodology__item {
  opacity: 1;
  transform: translateY(0);
}

.methodology__item-number {
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  font-family: '${fontDisplay}', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.methodology__item-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-dark);
}

/* ═══════════════════════════════════════════════════════════════
   TEAM SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--team {
  flex-direction: column;
  position: relative;
}

.team__bg {
  position: absolute;
  inset: 0;
}

.team__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 50% at 20% 80%, rgba(18, 171, 219, 0.1), transparent),
    linear-gradient(160deg, var(--navy) 0%, #0D1F35 100%);
}

.team__content {
  position: relative;
  z-index: 2;
  padding: 80px 100px;
}

.team__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.team__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: var(--cyan);
}

.team__icon svg { width: 28px; height: 28px; }

.team__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
  margin-bottom: 4px;
  display: block;
}

.team__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.team__subtitle {
  font-size: 1.1rem;
  color: var(--gray-light);
  margin-bottom: 48px;
}

.team__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.team__card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .team__card {
  opacity: 1;
  transform: translateY(0);
}

.team__card-avatar {
  width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  border-radius: 12px;
  flex-shrink: 0;
}

.team__card-avatar svg { width: 22px; height: 22px; }

.team__card-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   CASE STUDY SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--case-study {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.case-study__left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
  background: var(--off-white);
  color: var(--navy);
}

.case-study__badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--white);
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  padding: 6px 14px;
  border-radius: 100px;
  margin-bottom: 24px;
  align-self: flex-start;
}

.case-study__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy);
  color: #FFD700;
  border-radius: 14px;
  margin-bottom: 24px;
}

.case-study__icon svg { width: 28px; height: 28px; }

.case-study__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.case-study__subtitle {
  font-size: 1.1rem;
  color: var(--gray);
  margin-bottom: 32px;
}

.case-study__metrics {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.case-study__metric {
  opacity: 0;
  transform: scale(0.9);
  animation: scaleIn 0.4s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .case-study__metric {
  opacity: 1;
  transform: scale(1);
}

.case-study__metric-value {
  display: block;
  font-family: '${fontDisplay}', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--blue);
  letter-spacing: -0.02em;
}

.case-study__metric-label {
  font-size: 0.75rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.case-study__right {
  display: flex;
  align-items: center;
  padding: 60px;
  background: var(--navy);
}

.case-study__outcomes {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.case-study__outcome {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  opacity: 0;
  transform: translateX(20px);
  animation: slideIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .case-study__outcome {
  opacity: 1;
  transform: translateX(0);
}

.case-study__outcome-icon {
  width: 24px; height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cyan);
  flex-shrink: 0;
}

.case-study__outcome-icon svg { width: 16px; height: 16px; }

.case-study__outcome-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   TIMELINE SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--timeline {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--white);
  color: var(--navy);
}

.timeline-slide__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.timeline-slide__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy);
  color: var(--cyan);
  border-radius: 14px;
}

.timeline-slide__icon svg { width: 28px; height: 28px; }

.timeline-slide__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 4px;
  display: block;
}

.timeline-slide__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.timeline-slide__subtitle {
  font-size: 1.1rem;
  color: var(--gray);
  margin-bottom: 48px;
}

.timeline-slide__track {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 40px;
}

.timeline-slide__line {
  position: absolute;
  top: 58px;
  left: 30px;
  right: 30px;
  height: 3px;
  background: linear-gradient(90deg, var(--cyan), var(--blue));
  border-radius: 2px;
}

.timeline-slide__milestone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1;
  max-width: 160px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .timeline-slide__milestone {
  opacity: 1;
  transform: translateY(0);
}

.timeline-slide__dot {
  width: 40px; height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  font-family: '${fontDisplay}', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 50%;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 20px rgba(18, 171, 219, 0.3);
}

.timeline-slide__milestone-text {
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--gray-dark);
  text-align: center;
}

/* ═══════════════════════════════════════════════════════════════
   INVESTMENT SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--investment {
  flex-direction: column;
  position: relative;
}

.investment__bg {
  position: absolute;
  inset: 0;
}

.investment__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 60% at 70% 30%, rgba(18, 171, 219, 0.12), transparent),
    linear-gradient(160deg, var(--navy) 0%, #0D1F35 100%);
}

.investment__pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 70% 50% at 50% 50%, black, transparent);
}

.investment__content {
  position: relative;
  z-index: 2;
  padding: 80px 100px;
}

.investment__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.investment__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10B981, #059669);
  color: var(--white);
  border-radius: 14px;
}

.investment__icon svg { width: 28px; height: 28px; }

.investment__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
  margin-bottom: 4px;
  display: block;
}

.investment__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.investment__subtitle {
  font-size: 1.1rem;
  color: var(--gray-light);
  margin-bottom: 48px;
}

.investment__points {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  max-width: 900px;
}

.investment__point {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .investment__point {
  opacity: 1;
  transform: translateY(0);
}

.investment__point-icon {
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10B981, #059669);
  color: var(--white);
  border-radius: 50%;
  flex-shrink: 0;
}

.investment__point-icon svg { width: 16px; height: 16px; }

.investment__point-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   RISK SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--risk {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--off-white);
  color: var(--navy);
}

.risk__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.risk__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  color: var(--white);
  border-radius: 14px;
}

.risk__icon svg { width: 28px; height: 28px; }

.risk__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #7C3AED;
  margin-bottom: 4px;
  display: block;
}

.risk__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.risk__subtitle {
  font-size: 1.1rem;
  color: var(--gray);
  margin-bottom: 48px;
}

.risk__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1000px;
}

.risk__card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: var(--white);
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .risk__card {
  opacity: 1;
  transform: translateY(0);
}

.risk__card-number {
  font-family: '${fontDisplay}', sans-serif;
  font-size: 0.7rem;
  font-weight: 800;
  color: #7C3AED;
  background: rgba(124, 58, 237, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  flex-shrink: 0;
}

.risk__card-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-dark);
}

/* ═══════════════════════════════════════════════════════════════
   SPLIT SLIDES
   ═══════════════════════════════════════════════════════════════ */
.slide--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.slide--split-reverse {
  direction: rtl;
}

.slide--split-reverse > * {
  direction: ltr;
}

.split__left, .split__right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
}

.split__left {
  background: var(--off-white);
  color: var(--navy);
}

.split__left--accent {
  background: linear-gradient(135deg, var(--blue) 0%, var(--navy-light) 100%);
  color: var(--white);
}

.split__right {
  background: var(--white);
  color: var(--navy);
}

.split__right--dark {
  background: var(--navy);
  color: var(--white);
}

.split__icon {
  width: 64px; height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  border-radius: 16px;
  background: var(--navy);
  color: var(--cyan);
}

.split__icon svg {
  width: 32px; height: 32px;
}

.split__icon--warning {
  background: linear-gradient(135deg, #FF6B6B, #EE5A24);
  color: var(--white);
}

.split__icon--glow {
  background: rgba(255,255,255,0.1);
  color: var(--cyan);
  box-shadow: 0 0 40px var(--cyan-glow);
}

.split__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 16px;
}

.split__label--light {
  color: var(--cyan);
}

.split__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.split__title--light {
  color: var(--white);
}

/* Cards */
.cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  padding: 24px 28px;
  border-radius: 16px;
  opacity: 0;
  transform: translateX(30px);
  animation: slideIn 0.6s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .card {
  opacity: 1;
  transform: translateX(0);
}

@keyframes slideIn {
  to { opacity: 1; transform: translateX(0); }
}

.card--challenge {
  background: var(--white);
  border: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
}

.card__number {
  font-family: '${fontDisplay}', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--cyan);
  background: rgba(18, 171, 219, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
  flex-shrink: 0;
}

.card__text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--gray-dark);
}

.card--solution {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.card__icon {
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cyan);
  border-radius: 50%;
  flex-shrink: 0;
}

.card__icon svg {
  width: 14px; height: 14px;
  color: var(--navy);
}

.card--solution .card__text {
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   APPROACH SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--approach {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--off-white);
  color: var(--navy);
}

.approach__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 60px;
}

.approach__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy);
  color: var(--cyan);
  border-radius: 14px;
}

.approach__icon svg {
  width: 28px; height: 28px;
}

.approach__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 4px;
  display: block;
}

.approach__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.approach__timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 800px;
}

.timeline__item {
  display: flex;
  gap: 24px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .timeline__item {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}

.timeline__marker {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline__number {
  width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  font-family: '${fontDisplay}', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.timeline__line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(to bottom, var(--cyan), transparent);
  margin: 8px 0;
}

.timeline__content {
  padding: 8px 0 40px;
}

.timeline__text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--gray-dark);
}

/* ═══════════════════════════════════════════════════════════════
   METRICS SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--metrics {
  align-items: center;
  justify-content: center;
  position: relative;
}

.metrics__bg {
  position: absolute;
  inset: 0;
}

.metrics__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 30% 20%, var(--cyan-glow), transparent 50%),
    radial-gradient(ellipse 50% 50% at 70% 80%, rgba(0, 112, 173, 0.2), transparent),
    linear-gradient(160deg, var(--navy) 0%, #0D1F35 100%);
}

.metrics__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.03;
}

.metrics__content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 1100px;
  padding: 0 40px;
}

.metrics__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 60px;
}

.metrics__icon {
  width: 48px; height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: var(--cyan);
}

.metrics__icon svg {
  width: 24px; height: 24px;
}

.metrics__label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
}

.metrics__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  margin-bottom: 48px;
}

.metric {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 40px 32px;
  opacity: 0;
  transform: scale(0.9);
  animation: scaleIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
  backdrop-filter: blur(12px);
}

.slide.active .metric {
  opacity: 1;
  transform: scale(1);
}

@keyframes scaleIn {
  to { opacity: 1; transform: scale(1); }
}

.metric__value {
  display: block;
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(3rem, 6vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--white) 0%, var(--cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.metric__label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.metrics__details {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px 32px;
}

.metrics__detail {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: var(--gray-light);
  opacity: 0;
  transform: translateY(10px);
  animation: fadeUp 0.4s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .metrics__detail {
  opacity: 1;
  transform: translateY(0);
}

.metrics__detail-icon {
  width: 20px; height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cyan);
}

.metrics__detail-icon svg {
  width: 14px; height: 14px;
}

/* ═══════════════════════════════════════════════════════════════
   DIFFERENTIATOR SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--diff {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--white);
  color: var(--navy);
}

.diff__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 60px;
}

.diff__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: var(--navy);
  border-radius: 14px;
}

.diff__icon svg {
  width: 28px; height: 28px;
}

.diff__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 4px;
  display: block;
}

.diff__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.diff__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  max-width: 1100px;
}

.diff__card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 28px 32px;
  background: var(--off-white);
  border-radius: 16px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
  border: 1px solid rgba(0,0,0,0.04);
}

.slide.active .diff__card {
  opacity: 1;
  transform: translateY(0);
}

.diff__card-icon {
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  border-radius: 50%;
  flex-shrink: 0;
}

.diff__card-icon svg {
  width: 16px; height: 16px;
}

.diff__card-text {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--gray-dark);
}

/* ═══════════════════════════════════════════════════════════════
   CLOSING SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--closing {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.closing__bg {
  position: absolute;
  inset: 0;
}

.closing__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 100%, var(--cyan-glow), transparent 50%),
    linear-gradient(160deg, var(--navy-light) 0%, var(--navy) 100%);
}

.closing__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.03;
}

.closing__orb {
  position: absolute;
  width: 500px; height: 500px;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(18, 171, 219, 0.15), transparent 70%);
  filter: blur(60px);
}

.closing__content {
  position: relative;
  z-index: 2;
  max-width: 700px;
  padding: 0 40px;
}

.closing__icon {
  width: 72px; height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  color: var(--cyan);
  margin: 0 auto 32px;
  backdrop-filter: blur(12px);
}

.closing__icon svg {
  width: 36px; height: 36px;
}

.closing__title {
  font-family: '${fontDisplay}', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 12px;
}

.closing__subtitle {
  font-size: 1.25rem;
  font-weight: 300;
  color: var(--gray-light);
  margin-bottom: 48px;
}

.closing__steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 48px;
  text-align: left;
}

.closing__step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .closing__step {
  opacity: 1;
  transform: translateX(0);
}

.closing__step-num {
  font-family: '${fontDisplay}', sans-serif;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--cyan);
}

.closing__step-text {
  font-size: 1rem;
  color: var(--gray-light);
}

.closing__cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 18px 36px;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  border-radius: 100px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(18, 171, 219, 0.3);
}

.closing__cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(18, 171, 219, 0.4);
}

.closing__cta-arrow {
  width: 20px; height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.closing__cta-arrow svg {
  width: 16px; height: 16px;
}

.closing__cta:hover .closing__cta-arrow {
  transform: translateX(4px);
}

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
.nav {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 24px;
  z-index: 100;
  background: rgba(10, 22, 40, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 100px;
  padding: 12px 28px;
}

.nav__btn {
  width: 48px; height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 50%;
  color: var(--white);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav__btn:hover:not(:disabled) {
  background: var(--cyan);
  color: var(--navy);
  transform: scale(1.08);
}

.nav__btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.nav__btn svg {
  width: 20px; height: 20px;
}

.nav__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 80px;
}

.nav__text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--white);
  letter-spacing: 0.05em;
}

.nav__bar {
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.nav__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan), var(--blue));
  border-radius: 2px;
  transition: width 0.4s ease;
}

.fullscreen-btn {
  position: fixed;
  top: 28px;
  right: 28px;
  width: 52px; height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 22, 40, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  color: var(--white);
  font-size: 1.25rem;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s ease;
}

.fullscreen-btn:hover {
  background: var(--cyan);
  color: var(--navy);
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 1024px) {
  .slide--split, .slide--understanding, .slide--case-study {
    grid-template-columns: 1fr;
  }

  .split__left, .split__right {
    padding: 60px 48px;
  }

  .slide--approach, .slide--diff, .slide--methodology, .slide--risk, .slide--timeline {
    padding: 60px 48px;
  }

  .slide--executive, .team__content, .investment__content {
    padding: 60px 48px;
  }

  .understanding__left, .understanding__right,
  .case-study__left, .case-study__right {
    padding: 60px 48px;
  }

  .timeline-slide__track {
    flex-wrap: wrap;
    gap: 24px;
    justify-content: center;
  }

  .timeline-slide__line {
    display: none;
  }

  .timeline-slide__milestone {
    max-width: 140px;
  }
}

@media (max-width: 768px) {
  .split__left, .split__right {
    padding: 48px 32px;
  }

  .slide--approach, .slide--diff, .slide--methodology, .slide--risk, .slide--timeline {
    padding: 48px 32px;
  }

  .slide--executive, .team__content, .investment__content {
    padding: 48px 32px;
  }

  .understanding__left, .understanding__right,
  .case-study__left, .case-study__right {
    padding: 48px 32px;
  }

  .metrics__grid {
    grid-template-columns: 1fr 1fr;
  }

  .diff__grid, .methodology__grid, .team__grid, .risk__grid, .investment__points {
    grid-template-columns: 1fr;
  }

  .case-study__metrics {
    flex-direction: column;
    gap: 16px;
  }

  .nav {
    padding: 10px 20px;
    gap: 16px;
  }

  .nav__btn {
    width: 40px; height: 40px;
  }
}

@media print {
  .slide {
    position: relative;
    page-break-after: always;
    opacity: 1;
    visibility: visible;
    transform: none;
  }
  .nav, .fullscreen-btn { display: none; }
}`;
}
