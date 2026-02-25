import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product — IntentBid",
  description:
    "See how IntentBid turns an RFP into a winning proposal in 8 steps. Upload, extract, score, strategize, generate, and export — with real product screenshots.",
  openGraph: {
    title: "How IntentBid Builds a Winning Proposal",
    description:
      "From RFP upload to finished proposal. See every step of the IntentBid proposal engine.",
  },
};

const STEPS = [
  {
    step: "01",
    title: "Upload your RFP",
    desc: "Drop in a PDF, DOCX, or PPTX. IntentBid reads the document, parses the content, and begins extracting structured fields with AI. Typically 15\u201345 seconds.",
    image: "/images/product/step1-upload.jpeg",
    alt: "IntentBid new proposal upload screen showing file drop zone and AI extraction progress",
  },
  {
    step: "02",
    title: "Review extracted data",
    desc: "The AI identifies the client, agency, scope, budget, timeline, NAICS codes, and solicitation type. Procurement intelligence is fetched in the background. Review and edit before proceeding.",
    image: "/images/product/step2-extract.jpeg",
    alt: "IntentBid review extracted data screen showing auto-filled client, industry, scope, and budget fields",
  },
  {
    step: "03",
    title: "Bid / No-Bid scoring",
    desc: "Every opportunity is scored across five weighted factors: requirement match, past performance, capability alignment, timeline feasibility, and strategic value. Get a data-backed recommendation before committing resources.",
    image: "/images/product/step3-bid-scoring.jpeg",
    alt: "IntentBid bid evaluation screen showing 78.5/100 overall score with five scoring factors",
  },
  {
    step: "04",
    title: "Define context and outcomes",
    desc: "Describe the client\u2019s pain points and desired outcomes. These drive the proposal narrative \u2014 every section will argue toward solving these specific problems with measurable results.",
    image: "/images/product/step5-define-context.jpeg",
    alt: "IntentBid define context screen with client information, pain points, and desired outcomes",
  },
  {
    step: "05",
    title: "Set your win strategy",
    desc: "Add win themes that will run throughout the proposal. Prioritize target outcomes as High, Medium, or Low. The AI weights emphasis accordingly \u2014 high-priority outcomes get more dedicated space.",
    image: "/images/product/step6-win-strategy.jpeg",
    alt: "IntentBid win strategy screen showing win themes and prioritized target outcomes",
  },
  {
    step: "06",
    title: "Confirm intent and generate",
    desc: "Review the full intent: scope, pain points, outcomes, and win strategy. Check \u201CI approve this Intent\u201D and hit Create Proposal. The system generates every section with your strategy baked in.",
    image: "/images/product/step7-confirm-intent.jpeg",
    alt: "IntentBid intent confirmation screen with pain points, outcomes, win themes, and create proposal button",
  },
  {
    step: "07",
    title: "Generated proposal with 11 sections",
    desc: "IntentBid produces a complete, multi-section proposal: Cover Letter, Executive Summary, Understanding of Client, Proposed Approach, Methodology, Team & Qualifications, Past Performance, Timeline, Commercial Framework, Risk Mitigation, and Why Us. Edit or regenerate any section.",
    image: "/images/product/step9-generate.jpeg",
    alt: "IntentBid proposal generation screen showing 11 completed sections with cover letter preview",
  },
  {
    step: "08",
    title: "Export in any format",
    desc: "Export as Web Presentation (interactive slides), PowerPoint, Landing Page, Word Document, or PDF. Choose the format that fits the submission requirements or your sales workflow.",
    image: "/images/product/step10-export.jpeg",
    alt: "IntentBid export screen showing five format options: Web Presentation, PowerPoint, Landing Page, Word, PDF",
  },
];

export default function ProductPage() {
  return (
    <div className="vf-page">
      <nav className="vf-nav">
        <div className="vf-nav-inner">
          <Link href="/" className="vf-logo">
            IntentBid
          </Link>
          <div className="vf-nav-links">
            <Link href="/">Home</Link>
            <Link href="/intelligence-overview">Intelligence</Link>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/request-access" className="vf-nav-cta">
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="prod-hero">
          <p className="prod-label">Product</p>
          <h1 className="prod-title">
            From RFP to finished proposal
            <br />
            <span className="prod-gradient">in eight steps.</span>
          </h1>
          <p className="prod-subtitle">
            Upload a document. Define your strategy. IntentBid generates a
            complete, multi-section proposal with persuasion intelligence,
            evidence matching, and competitive positioning built into every
            paragraph.
          </p>
        </div>

        {/* Proposal flow steps */}
        <div className="prod-steps">
          {STEPS.map((s, i) => (
            <section
              key={s.step}
              className={`prod-step ${i % 2 === 1 ? "prod-step--reverse" : ""}`}
            >
              <div className="prod-step-text">
                <span className="prod-step-num">Step {s.step}</span>
                <h2 className="prod-step-title">{s.title}</h2>
                <p className="prod-step-desc">{s.desc}</p>
              </div>
              <div className="prod-step-img">
                <Image
                  src={s.image}
                  alt={s.alt}
                  width={720}
                  height={480}
                  className="prod-screenshot"
                />
              </div>
            </section>
          ))}
        </div>

        {/* Evidence + Analytics callout */}
        <section className="prod-extras">
          <h2 className="prod-extras-heading">
            The knowledge that powers every proposal
          </h2>
          <div className="prod-extras-grid">
            <div className="prod-extra-card">
              <Image
                src="/images/product/knowledge-evidence.jpeg"
                alt="IntentBid Evidence Library showing case studies, metrics, and certifications"
                width={560}
                height={400}
                className="prod-screenshot"
              />
              <h3>Evidence Library</h3>
              <p>
                Case studies, metrics, testimonials, and certifications
                &mdash; verified and tagged. The AI automatically matches
                your most relevant evidence to each proposal section.
              </p>
            </div>
            <div className="prod-extra-card">
              <Image
                src="/images/product/analytics.jpeg"
                alt="IntentBid Win/Loss Analytics dashboard showing win rate trend and pipeline funnel"
                width={560}
                height={400}
                className="prod-screenshot"
              />
              <h3>Win/Loss Analytics</h3>
              <p>
                Track outcomes across every proposal. See win rate trends,
                pipeline funnels, and loss reasons. The system learns from
                your results and gets sharper over time.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="prod-cta-section">
          <h2>Ready to see it in action?</h2>
          <p>
            IntentBid is currently invite-only. Request access and
            we&rsquo;ll walk you through a live demo.
          </p>
          <Link href="/request-access" className="prod-cta">
            Request Access
          </Link>
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
