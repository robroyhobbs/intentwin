/**
 * Slide layout template functions
 *
 * Each slide type has a render function that produces HTML markup.
 */

import { escapeHtml } from "@/lib/email/escape-html";
import { ICONS, ICONS_EXTENDED } from "./icons";
import type { SlideContent } from "./types";

/**
 * Renders a single slide to HTML based on its type.
 * footerText overrides the default "Confidential" text in the hero footer.
 */
export function renderSlide(
  slide: SlideContent,
  index: number,
  companyName: string = "IntentBid",
  footerText: string = "Confidential",
): string {
  switch (slide.type) {
    case "hero":
      return `
        <section class="slide slide--hero" data-index="${index}">
          <div class="hero__bg">
            <div class="hero__gradient"></div>
            <div class="hero__noise"></div>
            <div class="hero__orb hero__orb--1"></div>
            <div class="hero__orb hero__orb--2"></div>
            <div class="hero__grid"></div>
          </div>
          <div class="hero__content">
            <div class="hero__badge">
              <span class="hero__badge-dot"></span>
              <span>${escapeHtml(companyName)}</span>
            </div>
            <h1 class="hero__title">${escapeHtml(slide.title)}</h1>
            <div class="hero__divider"></div>
            <p class="hero__client">Prepared for <strong>${escapeHtml(slide.subtitle || "")}</strong></p>
          </div>
          <div class="hero__footer">
            <span>${escapeHtml(footerText)}</span>
            <span class="hero__footer-dot"></span>
            <span>${new Date().getFullYear()}</span>
          </div>
        </section>`;

    case "executive":
      return `
        <section class="slide slide--executive" data-index="${index}">
          <div class="executive__bg">
            <div class="executive__gradient"></div>
            <div class="executive__accent"></div>
          </div>
          <div class="executive__content">
            <div class="executive__header">
              <div class="executive__icon">${ICONS_EXTENDED.briefcase}</div>
              <div>
                <span class="executive__label">Overview</span>
                <h2 class="executive__title">${escapeHtml(slide.title)}</h2>
              </div>
            </div>
            <p class="executive__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            <div class="executive__points">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="executive__point" style="--delay: ${i * 0.1}s">
                  <div class="executive__point-marker">${String(i + 1).padStart(2, "0")}</div>
                  <p class="executive__point-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "understanding":
      return `
        <section class="slide slide--understanding" data-index="${index}">
          <div class="understanding__left">
            <div class="understanding__icon">${ICONS_EXTENDED.eye}</div>
            <span class="understanding__label">Client Focus</span>
            <h2 class="understanding__title">${escapeHtml(slide.title)}</h2>
            <p class="understanding__subtitle">${escapeHtml(slide.subtitle || "")}</p>
          </div>
          <div class="understanding__right">
            <div class="understanding__cards">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="understanding__card" style="--delay: ${i * 0.12}s">
                  <div class="understanding__card-icon">${ICONS.check}</div>
                  <p class="understanding__card-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "methodology":
      return `
        <section class="slide slide--methodology" data-index="${index}">
          <div class="methodology__header">
            <div class="methodology__icon">${ICONS_EXTENDED.settings}</div>
            <div>
              <span class="methodology__label">Framework</span>
              <h2 class="methodology__title">${escapeHtml(slide.title)}</h2>
            </div>
          </div>
          <p class="methodology__subtitle">${escapeHtml(slide.subtitle || "")}</p>
          <div class="methodology__grid">
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="methodology__item" style="--delay: ${i * 0.1}s">
                <div class="methodology__item-number">${i + 1}</div>
                <p class="methodology__item-text">${escapeHtml(item)}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "team":
      return `
        <section class="slide slide--team" data-index="${index}">
          <div class="team__bg">
            <div class="team__gradient"></div>
          </div>
          <div class="team__content">
            <div class="team__header">
              <div class="team__icon">${ICONS_EXTENDED.users}</div>
              <div>
                <span class="team__label">Your Team</span>
                <h2 class="team__title">${escapeHtml(slide.title)}</h2>
              </div>
            </div>
            <p class="team__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            <div class="team__grid">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="team__card" style="--delay: ${i * 0.1}s">
                  <div class="team__card-avatar">${ICONS_EXTENDED.users}</div>
                  <p class="team__card-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "case_study":
      return `
        <section class="slide slide--case-study" data-index="${index}">
          <div class="case-study__left">
            <div class="case-study__badge">Case Study ${slide.caseStudyNumber || 1}</div>
            <div class="case-study__icon">${ICONS_EXTENDED.star}</div>
            <h2 class="case-study__title">${escapeHtml(slide.title)}</h2>
            <p class="case-study__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            ${
              slide.metrics && slide.metrics.length > 0
                ? `
              <div class="case-study__metrics">
                ${slide.metrics
                  .map(
                    (m, i) => `
                  <div class="case-study__metric" style="--delay: ${0.3 + i * 0.1}s">
                    <span class="case-study__metric-value">${escapeHtml(m.value)}</span>
                    <span class="case-study__metric-label">${escapeHtml(m.label)}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
          <div class="case-study__right">
            <div class="case-study__outcomes">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="case-study__outcome" style="--delay: ${i * 0.12}s">
                  <div class="case-study__outcome-icon">${ICONS.arrow}</div>
                  <p class="case-study__outcome-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "timeline":
      return `
        <section class="slide slide--timeline" data-index="${index}">
          <div class="timeline-slide__header">
            <div class="timeline-slide__icon">${ICONS_EXTENDED.calendar}</div>
            <div>
              <span class="timeline-slide__label">Roadmap</span>
              <h2 class="timeline-slide__title">${escapeHtml(slide.title)}</h2>
            </div>
          </div>
          <p class="timeline-slide__subtitle">${escapeHtml(slide.subtitle || "")}</p>
          <div class="timeline-slide__track">
            <div class="timeline-slide__line"></div>
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="timeline-slide__milestone" style="--delay: ${i * 0.15}s">
                <div class="timeline-slide__dot">${i + 1}</div>
                <p class="timeline-slide__milestone-text">${escapeHtml(item)}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "investment":
      return `
        <section class="slide slide--investment" data-index="${index}">
          <div class="investment__bg">
            <div class="investment__gradient"></div>
            <div class="investment__pattern"></div>
          </div>
          <div class="investment__content">
            <div class="investment__header">
              <div class="investment__icon">${ICONS_EXTENDED.dollar}</div>
              <div>
                <span class="investment__label">Commercial</span>
                <h2 class="investment__title">${escapeHtml(slide.title)}</h2>
              </div>
            </div>
            <p class="investment__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            <div class="investment__points">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="investment__point" style="--delay: ${i * 0.1}s">
                  <div class="investment__point-icon">${ICONS.check}</div>
                  <p class="investment__point-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "risk":
      return `
        <section class="slide slide--risk" data-index="${index}">
          <div class="risk__header">
            <div class="risk__icon">${ICONS_EXTENDED.shield}</div>
            <div>
              <span class="risk__label">Governance</span>
              <h2 class="risk__title">${escapeHtml(slide.title)}</h2>
            </div>
          </div>
          <p class="risk__subtitle">${escapeHtml(slide.subtitle || "")}</p>
          <div class="risk__grid">
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="risk__card" style="--delay: ${i * 0.1}s">
                <div class="risk__card-number">${String(i + 1).padStart(2, "0")}</div>
                <p class="risk__card-text">${escapeHtml(item)}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "challenge":
      return `
        <section class="slide slide--split" data-index="${index}">
          <div class="split__left">
            <div class="split__icon split__icon--warning">
              ${ICONS.lightning}
            </div>
            <span class="split__label">The Challenge</span>
            <h2 class="split__title">${escapeHtml(slide.subtitle || slide.title)}</h2>
          </div>
          <div class="split__right">
            <div class="cards">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="card card--challenge" style="--delay: ${i * 0.1}s">
                  <div class="card__number">${String(i + 1).padStart(2, "0")}</div>
                  <p class="card__text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "solution":
      return `
        <section class="slide slide--split slide--split-reverse" data-index="${index}">
          <div class="split__right split__right--dark">
            <div class="cards cards--solution">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="card card--solution" style="--delay: ${i * 0.1}s">
                  <div class="card__icon">${ICONS.check}</div>
                  <p class="card__text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          <div class="split__left split__left--accent">
            <div class="split__icon split__icon--glow">
              ${ICONS.lightbulb}
            </div>
            <span class="split__label split__label--light">Our Solution</span>
            <h2 class="split__title split__title--light">${escapeHtml(slide.subtitle || slide.title)}</h2>
          </div>
        </section>`;

    case "approach":
      return `
        <section class="slide slide--approach" data-index="${index}">
          <div class="approach__header">
            <div class="approach__icon">${ICONS.target}</div>
            <div>
              <span class="approach__label">Our Approach</span>
              <h2 class="approach__title">${escapeHtml(slide.subtitle || slide.title)}</h2>
            </div>
          </div>
          <div class="approach__timeline">
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="timeline__item" style="--delay: ${i * 0.15}s">
                <div class="timeline__marker">
                  <span class="timeline__number">${i + 1}</span>
                  ${i < (slide.items?.length || 0) - 1 ? '<div class="timeline__line"></div>' : ""}
                </div>
                <div class="timeline__content">
                  <p class="timeline__text">${escapeHtml(item)}</p>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "metrics":
      return `
        <section class="slide slide--metrics" data-index="${index}">
          <div class="metrics__bg">
            <div class="metrics__gradient"></div>
            <div class="metrics__noise"></div>
          </div>
          <div class="metrics__content">
            <div class="metrics__header">
              <div class="metrics__icon">${ICONS.chart}</div>
              <span class="metrics__label">${escapeHtml(slide.title)}</span>
            </div>
            <div class="metrics__grid">
              ${(slide.metrics || [])
                .map(
                  (m, i) => `
                <div class="metric" style="--delay: ${i * 0.1}s">
                  <span class="metric__value">${escapeHtml(m.value)}</span>
                  <span class="metric__label">${escapeHtml(m.label)}</span>
                </div>
              `,
                )
                .join("")}
            </div>
            ${
              slide.items && slide.items.length > 0
                ? `
              <div class="metrics__details">
                ${slide.items
                  .map(
                    (item, i) => `
                  <div class="metrics__detail" style="--delay: ${0.4 + i * 0.1}s">
                    <span class="metrics__detail-icon">${ICONS.arrow}</span>
                    <span>${escapeHtml(item)}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
        </section>`;

    case "differentiator":
      return `
        <section class="slide slide--diff" data-index="${index}">
          <div class="diff__header">
            <div class="diff__icon">${ICONS.trophy}</div>
            <div>
              <span class="diff__label">Why ${escapeHtml(companyName)}</span>
              <h2 class="diff__title">${escapeHtml(slide.subtitle || `The ${companyName} Advantage`)}</h2>
            </div>
          </div>
          <div class="diff__grid">
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="diff__card" style="--delay: ${i * 0.1}s">
                <div class="diff__card-icon">${ICONS.check}</div>
                <p class="diff__card-text">${escapeHtml(item)}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "closing":
      return `
        <section class="slide slide--closing" data-index="${index}">
          <div class="closing__bg">
            <div class="closing__gradient"></div>
            <div class="closing__noise"></div>
            <div class="closing__orb"></div>
          </div>
          <div class="closing__content">
            <div class="closing__icon">${ICONS.rocket}</div>
            <h2 class="closing__title">${escapeHtml(slide.title)}</h2>
            <p class="closing__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            <div class="closing__steps">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="closing__step" style="--delay: ${i * 0.1}s">
                  <span class="closing__step-num">${String(i + 1).padStart(2, "0")}</span>
                  <span class="closing__step-text">${escapeHtml(item)}</span>
                </div>
              `,
                )
                .join("")}
            </div>
            <div class="closing__cta">
              <span>Let's begin the conversation</span>
              <span class="closing__cta-arrow">${ICONS.arrow}</span>
            </div>
          </div>
        </section>`;

    default:
      return "";
  }
}
