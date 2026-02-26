import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "../_components/public-nav";
import { PRICING_TIERS } from "@/lib/stripe/client";

export const metadata: Metadata = {
  title: "Pricing — IntentBid",
  description:
    "IntentBid pricing for AI-powered proposal generation. Free to Enterprise. Start for free, scale to unlimited proposals with full intelligence suite.",
  openGraph: {
    title: "IntentBid Pricing — Start Free, Win More",
    description:
      "4 tiers from free to enterprise. Unlimited proposals, full intelligence suite, and win probability engine. Invite-only early access.",
  },
};

// ─── Static tier display config ────────────────────────────────────────────
// Mirrors PRICING_TIERS but adds display-layer config the stripe client
// doesn't need to know about.
const TIER_KEYS = ["free", "starter", "pro", "enterprise"] as const;
type TierKey = (typeof TIER_KEYS)[number];

const TIER_DISPLAY: Record<
  TierKey,
  {
    recommended: boolean;
    ctaLabel: string;
    highlightColor: string;
    borderClass: string;
    badgeClass: string;
  }
> = {
  free: {
    recommended: false,
    ctaLabel: "Get Started Free",
    highlightColor: "rgba(255,255,255,0.04)",
    borderClass: "border border-white/8",
    badgeClass: "",
  },
  starter: {
    recommended: false,
    ctaLabel: "Request Access",
    highlightColor: "rgba(255,255,255,0.04)",
    borderClass: "border border-white/8",
    badgeClass: "",
  },
  pro: {
    recommended: true,
    ctaLabel: "Request Access",
    highlightColor: "rgba(124,58,237,0.06)",
    borderClass: "border-2 border-violet-500/60",
    badgeClass: "badge-pro",
  },
  enterprise: {
    recommended: false,
    ctaLabel: "Contact Sales",
    highlightColor: "rgba(255,255,255,0.04)",
    borderClass: "border border-white/8",
    badgeClass: "",
  },
};

// ─── Feature comparison table ───────────────────────────────────────────────
type FeatureRow = {
  label: string;
  free: string | boolean;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
};

const COMPARISON_FEATURES: FeatureRow[] = [
  {
    label: "Proposals / month",
    free: "2",
    starter: "10",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    label: "Team members",
    free: "1",
    starter: "3",
    pro: "10",
    enterprise: "Unlimited",
  },
  {
    label: "AI proposal generation",
    free: false,
    starter: "5 sections",
    pro: "10 sections",
    enterprise: "10 sections + priority queue",
  },
  {
    label: "Document upload & extraction",
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    label: "Export formats",
    free: "DOCX",
    starter: "DOCX, PDF",
    pro: "DOCX, PDF, PPTX, HTML, Web",
    enterprise: "All + white-label",
  },
  {
    label: "Knowledge base documents",
    free: "5",
    starter: "25",
    pro: "100",
    enterprise: "Unlimited",
  },
  {
    label: "Semantic search",
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    label: "GSA rate benchmarks",
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    label: "Full intelligence suite",
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    label: "AI bid/no-bid scoring",
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    label: "Quality review council",
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    label: "Compliance matrix",
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    label: "Win/loss analytics",
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    label: "Win probability engine",
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
  {
    label: "Competitive landscape analysis",
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
  {
    label: "Audit trail",
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
  {
    label: "Custom data source integration",
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
  {
    label: "Priority support",
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
];

const FAQ = [
  {
    q: "Is there really a free plan?",
    a: "Yes. The Free plan gives you 2 proposals per month with our rich text editor and DOCX export — no credit card required. It's genuinely useful for teams just starting out with structured proposals.",
  },
  {
    q: "What does \"unlimited proposals\" mean?",
    a: "Generate as many proposals as you need on Pro and Enterprise. No per-proposal fees, no token limits, no throttling. Your monthly subscription covers all usage.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the next billing cycle.",
  },
  {
    q: "How does the annual pricing work?",
    a: "Annual billing gives you roughly 2 months free compared to monthly pricing. For Starter that's $470/yr vs $588/yr monthly. For Pro it's $1,910/yr vs $2,388/yr monthly.",
  },
  {
    q: "Is there a free trial on paid plans?",
    a: "We offer a guided demo with your own RFP so you can see real output before committing. Request access and we'll set it up — usually within 24 hours.",
  },
  {
    q: "What about government pricing or volume discounts?",
    a: "We work with government contractors of all sizes. Contact us at gov@intentbid.com for government-specific pricing and procurement vehicle options.",
  },
  {
    q: "What is the intelligence suite?",
    a: "The intelligence suite (Pro and above) includes: federal award search (9,500+ awards), agency profiles and evaluation criteria, FOIA & public records engine (50 states), market intelligence dashboard, and client research tools. It's the data layer that makes bid decisions defensible, not just fast.",
  },
  {
    q: "When will self-serve checkout be available?",
    a: "We're in invite-only early access. All plan requests go through /request-access right now. Self-serve checkout is coming soon. Early access users lock in founding member pricing.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function CheckIcon({ color = "#a78bfa" }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <path
        d="M3 8L6.5 11.5L13 5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3L11 11M11 3L3 11"
        stroke="#3f3f46"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <CheckIcon />;
  if (value === false) return <XIcon />;
  return <span style={{ fontSize: 13, color: "#a1a1aa" }}>{value}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  return (
    <div className="vf-page">
      <PublicNav />

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="pricing-hero">
          <p className="prod-label">Pricing</p>
          <h1 className="prod-title">
            Start free.
            <br />
            <span className="prod-gradient">Scale when you win.</span>
          </h1>
          <p className="prod-subtitle">
            From manual proposals to a full intelligence-driven pipeline. Pick
            the tier that fits where you are — upgrade when you&rsquo;re ready.
          </p>

          {/* Annual/Monthly toggle — purely visual, static page */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginTop: 28,
              padding: "6px 8px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
            }}
          >
            <a
              href="#monthly"
              id="toggle-monthly"
              style={{
                padding: "6px 18px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "rgba(124,58,237,0.5)",
                textDecoration: "none",
              }}
            >
              Monthly
            </a>
            <a
              href="#annual"
              id="toggle-annual"
              style={{
                padding: "6px 18px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                color: "#71717a",
                textDecoration: "none",
              }}
            >
              Annual
              <span
                style={{
                  marginLeft: 8,
                  padding: "2px 7px",
                  background: "rgba(167,139,250,0.15)",
                  color: "#a78bfa",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                Save 20%
              </span>
            </a>
          </div>
        </div>

        {/* ── Tier Cards ───────────────────────────────────────────────── */}
        <section
          id="monthly"
          style={{
            maxWidth: 1100,
            margin: "0 auto 80px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
              alignItems: "start",
            }}
            className="pricing-tier-grid"
          >
            {TIER_KEYS.map((key) => {
              const tier = PRICING_TIERS[key];
              const display = TIER_DISPLAY[key];
              const ctaHref = `/request-access?plan=${key}`;

              const monthlyPrice = tier.monthlyPrice;
              const annualMonthly =
                key === "free" ? 0 : Math.round((tier.annualPrice / 12) * 10) / 10;

              return (
                <div
                  key={key}
                  style={{
                    background: display.recommended
                      ? display.highlightColor
                      : "rgba(255,255,255,0.02)",
                    borderRadius: 20,
                    padding: "32px 24px",
                    position: "relative",
                    boxShadow: display.recommended
                      ? "0 0 0 2px rgba(124,58,237,0.6), 0 8px 40px rgba(124,58,237,0.15)"
                      : "none",
                  }}
                  className={display.recommended ? "" : display.borderClass}
                >
                  {/* Most Popular badge */}
                  {display.recommended && (
                    <div
                      style={{
                        position: "absolute",
                        top: -14,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "4px 14px",
                        borderRadius: 20,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  {/* Tier name */}
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: display.recommended ? "#a78bfa" : "#71717a",
                      margin: "0 0 10px",
                    }}
                  >
                    {tier.name}
                  </p>

                  {/* Price */}
                  <div style={{ marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 44,
                        fontWeight: 900,
                        color: "#fafafa",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                      }}
                    >
                      {monthlyPrice === 0 ? "Free" : `$${monthlyPrice}`}
                    </span>
                    {monthlyPrice > 0 && (
                      <span
                        style={{
                          fontSize: 16,
                          color: "#52525b",
                          fontWeight: 400,
                          marginLeft: 4,
                        }}
                      >
                        /mo
                      </span>
                    )}
                  </div>

                  {/* Annual note */}
                  {monthlyPrice > 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#52525b",
                        margin: "0 0 12px",
                      }}
                    >
                      ${annualMonthly}/mo billed annually
                    </p>
                  )}

                  {/* Description */}
                  <p
                    style={{
                      fontSize: 13,
                      color: "#a1a1aa",
                      lineHeight: 1.55,
                      margin: "0 0 24px",
                      minHeight: 40,
                    }}
                  >
                    {tier.description}
                  </p>

                  {/* CTA */}
                  <Link
                    href={ctaHref}
                    style={{
                      display: "block",
                      padding: "12px 20px",
                      background: display.recommended
                        ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                        : "rgba(255,255,255,0.06)",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      borderRadius: 10,
                      textDecoration: "none",
                      textAlign: "center",
                      border: display.recommended
                        ? "none"
                        : "1px solid rgba(255,255,255,0.1)",
                      marginBottom: 24,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {display.ctaLabel}
                  </Link>

                  {/* Feature list */}
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 9,
                          fontSize: 13,
                          color: "#a1a1aa",
                          lineHeight: 1.5,
                        }}
                      >
                        <CheckIcon
                          color={display.recommended ? "#a78bfa" : "#52525b"}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Invite-only note */}
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "#52525b",
              marginTop: 24,
            }}
          >
            Invite-only early access &mdash; all requests are reviewed within
            24 hours. Founding members lock in current pricing permanently.
          </p>
        </section>

        {/* ── ROI Callout ──────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 960,
            margin: "0 auto 96px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(99,102,241,0.04))",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: 20,
              padding: "48px 40px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#a78bfa",
                marginBottom: 16,
              }}
            >
              Return on Investment
            </p>
            <h2
              style={{
                fontSize: "clamp(22px, 3.5vw, 32px)",
                fontWeight: 800,
                color: "#fafafa",
                letterSpacing: "-0.03em",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              A single proposal saves 60+ hours.
              <br />
              IntentBid pays for itself.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "#a1a1aa",
                lineHeight: 1.7,
                maxWidth: 580,
                margin: "0 auto 40px",
              }}
            >
              A typical government proposal costs $20,000&ndash;$75,000 in
              labor when you factor in capture manager time, SME hours, review
              cycles, and opportunity cost. Here&rsquo;s how IntentBid changes
              the math:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 20,
                maxWidth: 600,
                margin: "0 auto 32px",
              }}
              className="pricing-roi-grid"
            >
              <div className="pricing-roi-card">
                <span className="pricing-roi-label">Without IntentBid</span>
                <span className="pricing-roi-num">80&ndash;120 hrs</span>
                <span className="pricing-roi-desc">
                  Per proposal: research, writing, compliance, review cycles,
                  formatting, and export
                </span>
              </div>
              <div className="pricing-roi-card pricing-roi-card--highlight">
                <span className="pricing-roi-label">With IntentBid</span>
                <span className="pricing-roi-num">15&ndash;30 hrs</span>
                <span className="pricing-roi-desc">
                  AI handles first drafts, compliance mapping, and formatting.
                  Your team focuses on strategy and review.
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: 15,
                color: "#a1a1aa",
                lineHeight: 1.65,
                maxWidth: 560,
                margin: "0 auto",
              }}
            >
              At a blended rate of $150/hr, saving 60+ hours means IntentBid
              pays for itself with{" "}
              <strong style={{ color: "#fff" }}>
                a single proposal each month
              </strong>
              . Most teams submit 4&ndash;8.
            </p>
          </div>
        </section>

        {/* ── Feature Comparison Table ──────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1060,
            margin: "0 auto 96px",
            padding: "0 24px",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(22px, 3.5vw, 32px)",
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: "-0.03em",
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            Full feature comparison
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "17.5%" }} />
                <col style={{ width: "17.5%" }} />
                <col style={{ width: "17.5%" }} />
                <col style={{ width: "17.5%" }} />
              </colgroup>

              {/* Table header */}
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px 20px 0",
                      color: "#52525b",
                      fontWeight: 600,
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  {TIER_KEYS.map((key) => {
                    const tier = PRICING_TIERS[key];
                    const display = TIER_DISPLAY[key];
                    return (
                      <th
                        key={key}
                        style={{
                          textAlign: "center",
                          padding: "12px 8px 20px",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: display.recommended ? "#a78bfa" : "#71717a",
                            marginBottom: 4,
                          }}
                        >
                          {tier.name}
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#fafafa",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {tier.monthlyPrice === 0
                            ? "Free"
                            : `$${tier.monthlyPrice}`}
                          {tier.monthlyPrice > 0 && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "#52525b",
                                fontWeight: 400,
                              }}
                            >
                              /mo
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table body */}
              <tbody>
                {COMPARISON_FEATURES.map((row, i) => (
                  <tr
                    key={row.label}
                    style={{
                      background:
                        i % 2 === 0
                          ? "transparent"
                          : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px 12px 0",
                        color: "#a1a1aa",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      {row.label}
                    </td>
                    {TIER_KEYS.map((key) => (
                      <td
                        key={key}
                        style={{
                          textAlign: "center",
                          padding: "12px 8px",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background:
                            key === "pro"
                              ? "rgba(124,58,237,0.04)"
                              : "transparent",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <CellValue value={row[key]} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {/* CTA row */}
              <tfoot>
                <tr>
                  <td style={{ padding: "24px 16px 0 0" }} />
                  {TIER_KEYS.map((key) => {
                    const display = TIER_DISPLAY[key];
                    return (
                      <td
                        key={key}
                        style={{
                          padding: "24px 8px 0",
                          textAlign: "center",
                          background:
                            key === "pro"
                              ? "rgba(124,58,237,0.04)"
                              : "transparent",
                        }}
                      >
                        <Link
                          href={`/request-access?plan=${key}`}
                          style={{
                            display: "inline-block",
                            padding: "9px 16px",
                            background: display.recommended
                              ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                              : "rgba(255,255,255,0.06)",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 12,
                            borderRadius: 8,
                            textDecoration: "none",
                            border: display.recommended
                              ? "none"
                              : "1px solid rgba(255,255,255,0.1)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {display.ctaLabel}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="pricing-faq" style={{ marginBottom: 96 }}>
          <h2 className="pricing-faq-heading">Frequently asked questions</h2>
          <div className="pricing-faq-list">
            {FAQ.map((f) => (
              <div key={f.q} className="pricing-faq-item">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────── */}
        <section className="prod-cta-section">
          <h2>Ready to win more contracts?</h2>
          <p>
            Request access and we&rsquo;ll walk you through a live demo with
            your own RFP. Founding members lock in current pricing permanently.
          </p>
          <Link href="/request-access" className="prod-cta">
            Request Early Access
          </Link>
          <p className="prod-cta-micro">
            We review every request personally. Expect a response within 24
            hours.
          </p>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="about-footer">
        <p>IntentBid &mdash; Proposal intelligence, engineered to win.</p>
        <div className="about-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/">Home</Link>
        </div>
      </footer>

      {/* ── Responsive grid override ──────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .pricing-tier-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 560px) {
          .pricing-tier-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
