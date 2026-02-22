"use client";

import { useState } from "react";

const AVG_CONTRACT_VALUE = 150000;
const OLD_WIN_RATE = 0.15;
const NEW_WIN_RATE = 0.3;

export function CalculatorSection() {
  const [proposals, setProposals] = useState(4);

  const proposalsWithIntent = proposals * 10;
  const oldRevenue = proposals * OLD_WIN_RATE * AVG_CONTRACT_VALUE;
  const newRevenue = proposalsWithIntent * NEW_WIN_RATE * AVG_CONTRACT_VALUE;

  return (
    <section className="vf-calc">
      <div className="vf-section-inner">
        <span className="vf-label">Productivity Impact</span>
        <h2 className="vf-section-heading">
          What happens when you can
          <br />
          respond to{" "}
          <span className="vf-gradient-text">10x more proposals?</span>
        </h2>
        <div className="vf-calc-container">
          <div className="vf-calc-input">
            <label className="vf-calc-label">
              Proposals your team submits per month today:
            </label>
            <div className="vf-calc-slider-row">
              <input
                type="range"
                min={1}
                max={20}
                value={proposals}
                onChange={(e) => setProposals(Number(e.target.value))}
                className="vf-calc-range"
              />
              <span className="vf-calc-value">{proposals}</span>
            </div>
          </div>
          <div className="vf-calc-results">
            <div className="vf-calc-card vf-calc-old">
              <span className="vf-calc-card-label">Without IntentBid</span>
              <div className="vf-calc-stat">
                <span className="vf-calc-num">{proposals}</span>
                <span className="vf-calc-unit">proposals/mo</span>
              </div>
              <div className="vf-calc-stat">
                <span className="vf-calc-num">
                  {Math.round(proposals * OLD_WIN_RATE)}
                </span>
                <span className="vf-calc-unit">wins at 15% win rate</span>
              </div>
              <div className="vf-calc-stat vf-calc-revenue">
                <span className="vf-calc-num">
                  ${(oldRevenue / 1000).toFixed(0)}K
                </span>
                <span className="vf-calc-unit">monthly pipeline</span>
              </div>
            </div>
            <div className="vf-calc-card vf-calc-new">
              <span className="vf-calc-card-label">With IntentBid</span>
              <div className="vf-calc-stat">
                <span className="vf-calc-num">{proposalsWithIntent}</span>
                <span className="vf-calc-unit">proposals/mo</span>
              </div>
              <div className="vf-calc-stat">
                <span className="vf-calc-num">
                  {Math.round(proposalsWithIntent * NEW_WIN_RATE)}
                </span>
                <span className="vf-calc-unit">wins at 30% win rate</span>
              </div>
              <div className="vf-calc-stat vf-calc-revenue">
                <span className="vf-calc-num">
                  ${(newRevenue / 1000).toFixed(0)}K
                </span>
                <span className="vf-calc-unit">monthly pipeline</span>
              </div>
            </div>
          </div>
          <div className="vf-calc-delta">
            <span className="vf-calc-delta-label">
              Additional annual revenue potential
            </span>
            <span className="vf-calc-delta-value">
              +${(((newRevenue - oldRevenue) * 12) / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
