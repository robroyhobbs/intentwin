import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "../_components/public-nav";

export const metadata: Metadata = {
  title: "Government Contractors — IntentBid",
  description:
    "IntentBid for federal, state, and local government contractors. NAICS classification, compliance matrix generation, GSA rate benchmarks, FOIA automation, and color team review gates.",
  openGraph: {
    title: "IntentBid for Government Contractors",
    description:
      "Purpose-built for government procurement. Compliance, classification, cost realism, and structured review gates.",
  },
};

const CAPABILITIES = [
  {
    icon: "shield",
    title: "Classification & Compliance",
    desc: "Automatic NAICS code analysis, set-aside identification (8(a), HUBZone, WOSB, SDVOSB), and compliance matrix generation. Section L/M requirements mapped point-by-point.",
  },
  {
    icon: "grid",
    title: "Evaluation Requirements Mapping",
    desc: "Map every Section L/M requirement to your capabilities. Compliance checklists, required certifications, and evaluation criteria alignment for RFP response planning.",
  },
  {
    icon: "dollar",
    title: "Cost Realism Compliance",
    desc: "Validate your rates against GSA CALC+ benchmarks. See where you fall relative to government-approved rates and avoid TINA triggers or cost realism flags.",
  },
  {
    icon: "briefcase",
    title: "Past Performance Matching",
    desc: "Centralized evidence library with past performance narratives and project references. The system matches your most relevant work to each opportunity's evaluation criteria.",
  },
  {
    icon: "file",
    title: "FOIA & Public Records",
    desc: "Generate state-specific Sunshine Law and FOIA requests in one click. AI-drafted letters cite the correct statute, include fee waiver language, and are ready to send.",
  },
  {
    icon: "flag",
    title: "Color Team Review Gates",
    desc: "Built-in Pink, Red, Gold, and White team review stages. Structured bid/no-bid decisions and quality checkpoints at every stage of the proposal lifecycle.",
  },
];

const PAIN_POINTS = [
  {
    problem: "Your best capture managers are buried in boilerplate",
    solution:
      "IntentBid generates compliant proposal sections so your team focuses on strategy, not formatting.",
  },
  {
    problem: "You pass on RFPs because you can't staff the response",
    solution:
      "Respond to more opportunities with the same team. IntentBid handles the heavy writing lift.",
  },
  {
    problem: "Compliance gaps cost you wins",
    solution:
      "Every Section L/M requirement is extracted, mapped, and tracked. Nothing falls through the cracks.",
  },
];

function IconShield() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}
function IconDollar() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

const ICONS: Record<string, () => React.JSX.Element> = {
  shield: IconShield,
  grid: IconGrid,
  dollar: IconDollar,
  briefcase: IconBriefcase,
  file: IconFile,
  flag: IconFlag,
};

export default function GovernmentPage() {
  return (
    <div className="vf-page">
      <PublicNav />

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        {/* Hero */}
        <div className="prod-hero">
          <p className="intel-label">IntentBid for Government</p>
          <h1 className="prod-title">
            Purpose-built for
            <br />
            <span className="intel-gradient">
              government contractors.
            </span>
          </h1>
          <p className="prod-subtitle">
            Your best capture managers shouldn&rsquo;t spend 80% of their
            time on compliance formatting. IntentBid handles the heavy
            lift &mdash; compliance mapping, cost realism checks, FOIA
            automation, and structured review gates &mdash; so your team
            focuses on winning strategy.
          </p>
        </div>

        {/* Pain points → solutions */}
        <section className="gov-pain-section">
          <h2 className="gov-pain-heading">
            Sound familiar?
          </h2>
          <div className="gov-pain-grid">
            {PAIN_POINTS.map((p) => (
              <div key={p.problem} className="gov-pain-card">
                <p className="gov-pain-problem">{p.problem}</p>
                <p className="gov-pain-solution">{p.solution}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section className="gov-cap-section">
          <h2 className="gov-cap-heading">
            What IntentBid adds for government
          </h2>
          <div className="gov-cap-grid">
            {CAPABILITIES.map((cap) => {
              const Icon = ICONS[cap.icon];
              return (
                <div key={cap.title} className="gov-cap-card">
                  <div className="gov-cap-icon">
                    <Icon />
                  </div>
                  <h3 className="gov-cap-title">{cap.title}</h3>
                  <p className="gov-cap-desc">{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="gov-security-section">
          <h2 className="gov-cap-heading">
            Security &amp; Compliance
          </h2>
          <p className="gov-security-intro">
            We take data protection seriously. IntentBid is built on
            enterprise-grade infrastructure with security controls
            designed for organizations handling sensitive proposal data.
          </p>
          <div className="gov-security-grid">
            <div className="gov-security-card">
              <h3>Infrastructure</h3>
              <ul>
                <li>Hosted on Vercel (SOC 2 Type II certified)</li>
                <li>Database on Supabase (SOC 2 Type II, encrypted at rest and in transit)</li>
                <li>US-based data centers</li>
                <li>TLS 1.3 encryption for all connections</li>
              </ul>
            </div>
            <div className="gov-security-card">
              <h3>Data Handling</h3>
              <ul>
                <li>Multi-tenant isolation with row-level security (RLS)</li>
                <li>Organization-scoped data — no cross-tenant access</li>
                <li>AI processing via Google Gemini enterprise terms</li>
                <li>No customer data used for model training</li>
              </ul>
            </div>
            <div className="gov-security-card">
              <h3>Access Controls</h3>
              <ul>
                <li>Role-based access within organizations</li>
                <li>Authenticated API routes with session verification</li>
                <li>Rate limiting on all endpoints</li>
                <li>Audit logging for proposal operations</li>
              </ul>
            </div>
            <div className="gov-security-card">
              <h3>Compliance Roadmap</h3>
              <ul>
                <li>SOC 2 Type II — in progress</li>
                <li>FedRAMP authorization — planned</li>
                <li>ITAR-compatible data handling — planned</li>
                <li>Contact <a href="mailto:gov@intentbid.com" style={{ color: "#a78bfa" }}>gov@intentbid.com</a> for our security questionnaire</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="prod-cta-section">
          <h2>Built for how government buys</h2>
          <p>
            IntentBid Gov is available to qualified government
            contractors. Contact us to discuss your procurement needs.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/request-access" className="prod-cta">
              Schedule a Gov Demo
            </Link>
            <a
              href="mailto:gov@intentbid.com"
              className="prod-cta"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Email Gov Sales
            </a>
          </div>
          <p className="prod-cta-micro">
            We respond to government inquiries within one business day.
          </p>
        </section>
      </main>

      <footer className="about-footer">
        <p>IntentBid &mdash; Proposal intelligence, engineered to win.</p>
        <div className="about-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/">Home</Link>
        </div>
      </footer>
    </div>
  );
}
