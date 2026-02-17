"use client";

export function LandingStyles() {
  return (
    <style jsx global>{`
      /* === Landing Page-Specific Styles === */

      /* Hero */
      .vf-hero {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 160px 48px 100px;
        position: relative;
        overflow: hidden;
      }
      .vf-hero-glow {
        position: absolute;
        top: -20%;
        left: 50%;
        transform: translateX(-50%);
        width: 700px;
        height: 700px;
        background: radial-gradient(
          circle,
          rgba(124, 58, 237, 0.1) 0%,
          rgba(99, 102, 241, 0.05) 40%,
          transparent 70%
        );
        pointer-events: none;
        animation: vf-glow-pulse 6s ease-in-out infinite;
      }
      @keyframes vf-glow-pulse {
        0%,
        100% {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
        50% {
          opacity: 0.7;
          transform: translateX(-50%) scale(1.05);
        }
      }
      .vf-hero-inner {
        max-width: 860px;
        position: relative;
        z-index: 2;
      }
      .vf-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #a78bfa;
        margin-bottom: 40px;
        border: 1px solid rgba(124, 58, 237, 0.3);
        background: rgba(124, 58, 237, 0.08);
        padding: 6px 18px;
        border-radius: 100px;
      }
      .vf-hero-headline {
        font-size: clamp(56px, 10vw, 120px);
        font-weight: 900;
        line-height: 0.95;
        color: #fafafa;
        letter-spacing: -0.04em;
        margin: 0 0 36px;
      }
      .vf-hero-sub {
        font-size: 18px;
        color: #71717a;
        line-height: 1.8;
        margin: 0 0 48px;
        font-weight: 300;
      }
      .vf-hero-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
      }
      .vf-hero-trust {
        margin-top: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .vf-trust-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #52525b;
        font-weight: 500;
      }
      .vf-trust-divider {
        color: #27272a;
        font-size: 14px;
      }

      /* Gov Button (page-specific) */
      .vf-btn-gov {
        display: inline-block;
        padding: 14px 36px;
        background: transparent;
        border: 1px solid rgba(124, 58, 237, 0.4);
        color: #a78bfa;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
        border-radius: 10px;
        transition: all 0.25s ease;
      }
      .vf-btn-gov:hover {
        background: rgba(124, 58, 237, 0.1);
        border-color: rgba(124, 58, 237, 0.6);
        transform: translateY(-2px);
      }

      /* Statement */
      .vf-statement {
        padding: 100px 48px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-statement-inner {
        max-width: 720px;
        margin: 0 auto;
        text-align: center;
      }
      .vf-statement-text {
        font-size: clamp(24px, 3.5vw, 36px);
        font-weight: 600;
        color: #e4e4e7;
        line-height: 1.4;
        letter-spacing: -0.02em;
        margin: 0;
      }

      /* Compare (Old vs New) */
      .vf-compare {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-compare-table {
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.01);
      }
      .vf-compare-header {
        display: grid;
        grid-template-columns: 160px 1fr 1fr;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-compare-header > div {
        padding: 16px 24px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .vf-compare-col-old {
        color: #71717a;
        background: rgba(239, 68, 68, 0.03);
      }
      .vf-compare-col-new {
        color: #a78bfa;
        background: rgba(124, 58, 237, 0.04);
      }
      .vf-compare-row {
        display: grid;
        grid-template-columns: 160px 1fr 1fr;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        transition: background 0.2s;
      }
      .vf-compare-row:last-child {
        border-bottom: none;
      }
      .vf-compare-row:hover {
        background: rgba(255, 255, 255, 0.02);
      }
      .vf-compare-row > div {
        padding: 18px 24px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .vf-compare-col-label {
        font-weight: 600;
        color: #e4e4e7;
      }
      .vf-compare-row .vf-compare-col-old {
        color: #71717a;
        background: rgba(239, 68, 68, 0.02);
        font-size: 14px;
        font-weight: 400;
        letter-spacing: 0;
        text-transform: none;
      }
      .vf-compare-row .vf-compare-col-new {
        color: #d4d4d8;
        background: rgba(124, 58, 237, 0.03);
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0;
        text-transform: none;
      }
      .vf-compare-x {
        color: #ef4444;
        font-size: 14px;
        opacity: 0.6;
      }
      .vf-compare-check {
        color: #a78bfa;
        font-size: 14px;
        font-weight: 700;
      }

      /* Human in the Loop */
      .vf-human {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-human-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 64px;
        align-items: start;
      }
      .vf-human-body {
        font-size: 16px;
        color: #71717a;
        line-height: 1.8;
        margin: 0 0 36px;
        font-weight: 300;
      }
      .vf-human-points {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .vf-human-point {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        font-size: 14px;
        color: #a1a1aa;
        line-height: 1.6;
      }
      .vf-human-icon {
        font-size: 11px;
        font-weight: 700;
        color: #7c3aed;
        min-width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: rgba(124, 58, 237, 0.1);
        flex-shrink: 0;
      }
      .vf-human-point strong {
        color: #e4e4e7;
      }
      .vf-human-visual {
        display: flex;
        justify-content: center;
      }
      .vf-human-flow {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 100%;
        max-width: 240px;
      }
      .vf-flow-step {
        width: 100%;
        padding: 16px 20px;
        border-radius: 12px;
        text-align: center;
        transition: transform 0.2s;
      }
      .vf-flow-step:hover {
        transform: scale(1.03);
      }
      .vf-flow-human {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .vf-flow-ai {
        background: rgba(124, 58, 237, 0.08);
        border: 1px solid rgba(124, 58, 237, 0.2);
      }
      .vf-flow-label {
        display: block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .vf-flow-human .vf-flow-label {
        color: #71717a;
      }
      .vf-flow-ai .vf-flow-label {
        color: #a78bfa;
      }
      .vf-flow-action {
        font-size: 14px;
        font-weight: 600;
        color: #e4e4e7;
      }
      .vf-flow-arrow {
        color: #3f3f46;
        font-size: 16px;
        line-height: 1;
      }

      /* Framework */
      .vf-framework {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-layers {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin-bottom: 48px;
      }
      .vf-layer {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 24px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        border-radius: 8px;
      }
      .vf-layer:first-child {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-layer:hover,
      .vf-layer-active {
        background: rgba(124, 58, 237, 0.04);
        border-color: rgba(124, 58, 237, 0.12);
      }
      .vf-layer-bar {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 0;
        background: linear-gradient(180deg, #7c3aed, #6366f1);
        border-radius: 3px;
        transition: height 0.3s ease;
      }
      .vf-layer:hover .vf-layer-bar,
      .vf-layer-active .vf-layer-bar {
        height: 60%;
      }
      .vf-layer-num {
        font-size: 13px;
        font-weight: 700;
        color: #52525b;
        min-width: 28px;
        font-variant-numeric: tabular-nums;
        transition: color 0.3s;
      }
      .vf-layer:hover .vf-layer-num,
      .vf-layer-active .vf-layer-num {
        color: #a78bfa;
      }
      .vf-layer-content {
        flex: 1;
      }
      .vf-layer-name {
        font-size: 17px;
        font-weight: 600;
        color: #e4e4e7;
        margin: 0 0 2px;
      }
      .vf-layer-desc {
        font-size: 14px;
        color: #71717a;
        margin: 0;
      }
      .vf-framework-note {
        font-size: 15px;
        color: #52525b;
        margin: 0;
        text-align: center;
        font-style: italic;
      }

      /* Benefits */
      .vf-benefits {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-benefit-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 48px;
        align-items: start;
        padding: 64px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-benefit-row:last-child {
        border-bottom: none;
      }
      .vf-benefit-headline {
        font-size: clamp(32px, 4vw, 48px);
        font-weight: 800;
        color: #fafafa;
        line-height: 1.05;
        letter-spacing: -0.03em;
        margin: 0;
      }
      .vf-benefit-body {
        font-size: 16px;
        color: #71717a;
        margin: 0;
        line-height: 1.8;
        font-weight: 300;
      }

      /* Calculator */
      .vf-calc {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-calc-container {
        margin-top: -16px;
      }
      .vf-calc-input {
        margin-bottom: 40px;
      }
      .vf-calc-label {
        display: block;
        font-size: 15px;
        color: #a1a1aa;
        margin-bottom: 16px;
        font-weight: 500;
      }
      .vf-calc-slider-row {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .vf-calc-range {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 4px;
        border-radius: 4px;
        background: #27272a;
        outline: none;
      }
      .vf-calc-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #6366f1);
        cursor: pointer;
        box-shadow: 0 0 16px rgba(124, 58, 237, 0.3);
      }
      .vf-calc-value {
        font-size: 36px;
        font-weight: 900;
        color: #fafafa;
        min-width: 48px;
        text-align: right;
        letter-spacing: -0.03em;
      }
      .vf-calc-results {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 24px;
      }
      .vf-calc-card {
        padding: 28px 24px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-calc-old {
        background: rgba(255, 255, 255, 0.02);
      }
      .vf-calc-new {
        background: rgba(124, 58, 237, 0.05);
        border-color: rgba(124, 58, 237, 0.15);
      }
      .vf-calc-card-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 20px;
      }
      .vf-calc-old .vf-calc-card-label {
        color: #52525b;
      }
      .vf-calc-new .vf-calc-card-label {
        color: #a78bfa;
      }
      .vf-calc-stat {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 12px;
      }
      .vf-calc-num {
        font-size: 28px;
        font-weight: 800;
        color: #fafafa;
        letter-spacing: -0.03em;
        line-height: 1;
      }
      .vf-calc-unit {
        font-size: 13px;
        color: #71717a;
      }
      .vf-calc-revenue .vf-calc-num {
        font-size: 32px;
      }
      .vf-calc-new .vf-calc-revenue .vf-calc-num {
        background: linear-gradient(135deg, #a78bfa, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .vf-calc-delta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 28px;
        border-radius: 12px;
        background: rgba(124, 58, 237, 0.06);
        border: 1px solid rgba(124, 58, 237, 0.12);
      }
      .vf-calc-delta-label {
        font-size: 14px;
        color: #a1a1aa;
        font-weight: 500;
      }
      .vf-calc-delta-value {
        font-size: 36px;
        font-weight: 900;
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, #a78bfa, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* Social Proof */
      .vf-proof {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-proof-stats {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 40px;
        margin-bottom: 80px;
        flex-wrap: wrap;
      }
      .vf-proof-stat {
        text-align: center;
      }
      .vf-proof-num {
        display: block;
        font-size: 48px;
        font-weight: 900;
        letter-spacing: -0.04em;
        background: linear-gradient(135deg, #a78bfa, #818cf8, #6366f1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
        margin-bottom: 8px;
      }
      .vf-proof-desc {
        font-size: 13px;
        color: #71717a;
        line-height: 1.4;
      }
      .vf-proof-divider {
        width: 1px;
        height: 48px;
        background: rgba(255, 255, 255, 0.08);
      }
      .vf-proof-quotes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      .vf-proof-quote {
        padding: 32px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition: border-color 0.3s;
      }
      .vf-proof-quote:hover {
        border-color: rgba(124, 58, 237, 0.15);
      }
      .vf-proof-text {
        font-size: 15px;
        color: #d4d4d8;
        line-height: 1.7;
        margin: 0 0 24px;
        font-weight: 300;
        font-style: italic;
      }
      .vf-proof-author {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .vf-proof-avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(
          135deg,
          rgba(124, 58, 237, 0.2),
          rgba(99, 102, 241, 0.2)
        );
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: #a78bfa;
        flex-shrink: 0;
      }
      .vf-proof-name {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #e4e4e7;
      }
      .vf-proof-role {
        display: block;
        font-size: 12px;
        color: #52525b;
        margin-top: 2px;
      }

      /* IntentWin Gov */
      .vf-gov {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        position: relative;
        overflow: hidden;
      }
      .vf-gov-glow {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 800px;
        height: 400px;
        background: radial-gradient(
          ellipse,
          rgba(124, 58, 237, 0.05) 0%,
          transparent 70%
        );
        pointer-events: none;
      }
      .vf-gov-inner {
        position: relative;
        z-index: 2;
        text-align: center;
      }
      .vf-gov-badge-row {
        margin-bottom: 20px;
      }
      .vf-gov-badge {
        display: inline-block;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a78bfa;
        border: 1px solid rgba(124, 58, 237, 0.35);
        background: rgba(124, 58, 237, 0.1);
        padding: 8px 24px;
        border-radius: 100px;
      }
      .vf-gov-headline {
        font-size: clamp(32px, 5vw, 52px);
        font-weight: 900;
        line-height: 1.1;
        color: #fafafa;
        letter-spacing: -0.03em;
        margin: 0 0 20px;
      }
      .vf-gov-sub {
        font-size: 17px;
        color: #71717a;
        max-width: 560px;
        margin: 0 auto 56px;
        line-height: 1.7;
        font-weight: 300;
      }
      .vf-gov-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        text-align: left;
        margin-bottom: 56px;
      }
      .vf-gov-card {
        padding: 28px 24px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition: all 0.3s ease;
      }
      .vf-gov-card:hover {
        border-color: rgba(124, 58, 237, 0.2);
        background: rgba(124, 58, 237, 0.03);
        transform: translateY(-4px);
      }
      .vf-gov-card-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(124, 58, 237, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #a78bfa;
        margin-bottom: 20px;
      }
      .vf-gov-card-title {
        font-size: 16px;
        font-weight: 700;
        color: #e4e4e7;
        margin: 0 0 8px;
      }
      .vf-gov-card-desc {
        font-size: 13px;
        color: #71717a;
        margin: 0;
        line-height: 1.6;
      }
      .vf-gov-cta {
        text-align: center;
      }
      .vf-gov-cta-text {
        font-size: 15px;
        color: #71717a;
        margin: 0 0 20px;
      }

      /* Pricing */
      .vf-pricing {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        text-align: center;
      }
      .vf-price-card {
        max-width: 560px;
        margin: 0 auto;
        border-radius: 20px;
        padding: 48px 40px;
        border: 1px solid rgba(124, 58, 237, 0.15);
        background: rgba(255, 255, 255, 0.02);
        backdrop-filter: blur(12px);
      }
      .vf-price-amount {
        margin: 8px 0 0;
      }
      .vf-price-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        text-align: left;
        margin-bottom: 36px;
      }

      /* Competitor Comparison */
      .vf-competitor {
        padding: 120px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-comp-categories {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 56px;
      }
      .vf-comp-card {
        padding: 28px 24px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition: border-color 0.3s ease;
      }
      .vf-comp-card:hover {
        border-color: rgba(239, 68, 68, 0.15);
      }
      .vf-comp-card-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 8px;
      }
      .vf-comp-card-name {
        font-size: 16px;
        font-weight: 700;
        color: #e4e4e7;
      }
      .vf-comp-card-price {
        font-size: 12px;
        color: #71717a;
        font-weight: 500;
      }
      .vf-comp-card-examples {
        font-size: 12px;
        color: #a1a1aa;
        margin: 0 0 12px;
        font-style: italic;
      }
      .vf-comp-card-approach {
        font-size: 13px;
        color: #71717a;
        margin: 0 0 8px;
      }
      .vf-comp-card-weakness {
        font-size: 13px;
        color: #ef4444;
        margin: 0;
        font-weight: 500;
      }
      .vf-comp-table {
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 14px;
        overflow: hidden;
      }
      .vf-comp-table-header {
        display: grid;
        grid-template-columns: 160px 1fr 1fr;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-comp-table-header > div {
        padding: 14px 20px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #a1a1aa;
      }
      .vf-comp-table-header .vf-comp-table-us {
        color: #a78bfa;
      }
      .vf-comp-table-row {
        display: grid;
        grid-template-columns: 160px 1fr 1fr;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        transition: background 0.2s ease;
      }
      .vf-comp-table-row:last-child {
        border-bottom: none;
      }
      .vf-comp-table-row:hover {
        background: rgba(255, 255, 255, 0.015);
      }
      .vf-comp-table-row > div {
        padding: 16px 20px;
        font-size: 14px;
        line-height: 1.5;
      }
      .vf-comp-table-row .vf-comp-table-label {
        font-weight: 600;
        color: #e4e4e7;
        font-size: 13px;
      }
      .vf-comp-table-row .vf-comp-table-them {
        color: #71717a;
      }
      .vf-comp-table-row .vf-comp-table-us {
        color: #d4d4d8;
      }
      .vf-comp-table-row .vf-compare-x {
        color: #ef4444;
        margin-right: 8px;
        font-weight: 700;
      }
      .vf-comp-table-row .vf-compare-check {
        color: #22c55e;
        margin-right: 8px;
        font-weight: 700;
      }

      /* Footer */
      .vf-footer {
        padding: 160px 0 80px;
        text-align: center;
        position: relative;
        overflow: hidden;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vf-footer-glow {
        position: absolute;
        bottom: -30%;
        left: 50%;
        transform: translateX(-50%);
        width: 500px;
        height: 500px;
        background: radial-gradient(
          circle,
          rgba(124, 58, 237, 0.06) 0%,
          transparent 70%
        );
        pointer-events: none;
      }
      .vf-footer-inner {
        position: relative;
        z-index: 2;
      }
      .vf-footer-headline {
        font-size: clamp(36px, 6vw, 64px);
        font-weight: 900;
        color: #fafafa;
        line-height: 1.08;
        letter-spacing: -0.04em;
        margin: 0 0 40px;
      }
      .vf-footer-tag {
        margin-top: 28px;
        font-size: 13px;
        color: #3f3f46;
        letter-spacing: 0.05em;
      }

      /* Responsive */
      @media (max-width: 900px) {
        .vf-gov-grid {
          grid-template-columns: 1fr 1fr;
        }
        .vf-compare-header,
        .vf-compare-row {
          grid-template-columns: 100px 1fr 1fr;
        }
        .vf-comp-categories {
          grid-template-columns: 1fr;
        }
        .vf-comp-table-header,
        .vf-comp-table-row {
          grid-template-columns: 1fr;
          gap: 0;
        }
        .vf-comp-table-header .vf-comp-table-label,
        .vf-comp-table-row .vf-comp-table-label {
          padding-bottom: 4px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .vf-comp-table-row .vf-comp-table-them,
        .vf-comp-table-row .vf-comp-table-us {
          padding-top: 4px;
          padding-bottom: 8px;
        }
      }
      @media (max-width: 768px) {
        .vf-hero {
          padding: 140px 24px 100px;
        }
        .vf-statement {
          padding: 80px 24px;
        }
        .vf-benefit-row {
          grid-template-columns: 1fr;
          gap: 24px;
          padding: 48px 0;
        }
        .vf-price-grid,
        .vf-calc-results {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .vf-price-card {
          padding: 36px 24px;
        }
        .vf-proof-quotes {
          grid-template-columns: 1fr;
        }
        .vf-proof-stats {
          gap: 24px;
        }
        .vf-proof-divider {
          display: none;
        }
        .vf-gov-grid {
          grid-template-columns: 1fr;
        }
        .vf-human-grid {
          grid-template-columns: 1fr;
          gap: 40px;
        }
        .vf-compare-header,
        .vf-compare-row {
          grid-template-columns: 1fr;
          gap: 0;
        }
        .vf-compare-col-label {
          padding-bottom: 4px !important;
        }
        .vf-compare-col-old,
        .vf-compare-col-new {
          padding-top: 8px !important;
          padding-bottom: 8px !important;
        }
        .vf-calc-delta {
          flex-direction: column;
          text-align: center;
          gap: 8px;
        }
      }
    `}</style>
  );
}
