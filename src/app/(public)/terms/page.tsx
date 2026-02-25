import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — IntentBid",
  description:
    "IntentBid terms of service covering account terms, payment, intellectual property, AI-generated content, acceptable use, and liability.",
  openGraph: {
    title: "Terms of Service — IntentBid",
    description:
      "IntentBid terms of service — account terms, payment, intellectual property, AI content disclaimers, and acceptable use policy.",
  },
};

export default function TermsPage() {
  return (
    <>
      <div className="legal-page">
        <nav className="legal-nav">
          <div className="legal-nav-inner">
            <Link href="/" className="legal-logo">
              IntentBid
            </Link>
            <Link href="/" className="legal-back">
              &larr; Back to Home
            </Link>
          </div>
        </nav>

        <main className="legal-main">
          <div className="legal-content">
            <p className="legal-label">Legal</p>
            <h1 className="legal-title">Terms of Service</h1>
            <p className="legal-updated">Last updated: February 2026</p>

            <section className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using IntentBid (&ldquo;the Service&rdquo;),
                operated by IntentBid (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
                &ldquo;us&rdquo;), you agree to be bound by these Terms of
                Service. If you are using the Service on behalf of an
                organization, you represent that you have authority to bind that
                organization to these terms.
              </p>
              <p>If you do not agree to these terms, do not use the Service.</p>
            </section>

            <section className="legal-section">
              <h2>2. Service Description</h2>
              <p>
                IntentBid is an AI-powered proposal intelligence platform that
                helps businesses generate, refine, and manage professional
                proposals. The Service includes:
              </p>
              <ul>
                <li>
                  AI-powered proposal content generation using our Intent
                  Framework
                </li>
                <li>
                  Document ingestion and analysis (PDF, DOCX, PPTX, TXT, MD,
                  CSV)
                </li>
                <li>Brand voice calibration and win theme management</li>
                <li>Proposal outcome tracking and continuous learning</li>
                <li>Organizational knowledge base management</li>
                <li>Multi-format proposal export</li>
              </ul>
              <p>
                IntentBid is an invite-only platform. Access is granted at our
                sole discretion.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Account Terms</h2>
              <p>
                You must provide accurate and complete information when creating
                your account. You are responsible for maintaining the security
                of your account credentials and for all activity that occurs
                under your account.
              </p>
              <p>
                You must notify us immediately at{" "}
                <a href="mailto:legal@intentbid.com">legal@intentbid.com</a> if
                you become aware of any unauthorized use of your account.
              </p>
              <p>
                We reserve the right to suspend or terminate accounts that
                violate these terms or that have been inactive for an extended
                period.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Payment Terms</h2>
              <p>
                IntentBid is offered as a subscription service at{" "}
                <strong>$999 per month</strong>. All features are included in
                the subscription &mdash; there are no tiers or add-on charges.
              </p>
              <ul>
                <li>
                  Billing is processed monthly through Stripe. Your subscription
                  renews automatically unless cancelled.
                </li>
                <li>
                  You may cancel your subscription at any time. Cancellation
                  takes effect at the end of your current billing period. No
                  partial refunds are provided for unused time within a billing
                  cycle.
                </li>
                <li>
                  We reserve the right to change pricing with 30 days&apos;
                  written notice. Price changes will not apply until your next
                  billing cycle after the notice period.
                </li>
                <li>
                  All fees are exclusive of applicable taxes, which will be
                  added where required by law.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Intellectual Property</h2>
              <h3>Your Content</h3>
              <p>
                You retain full ownership of all content you upload to or create
                using IntentBid, including proposals, documents, brand voice
                configurations, and knowledge base materials. We do not claim
                any ownership rights over your content.
              </p>
              <h3>Our Platform</h3>
              <p>
                IntentBid, including its design, code, Intent Framework
                methodology, AI models, user interface, and documentation, is
                owned by IntentBid and protected by intellectual property laws.
                Your subscription grants you a limited, non-exclusive,
                non-transferable license to use the platform for your internal
                business purposes.
              </p>
              <h3>Feedback</h3>
              <p>
                If you provide suggestions, ideas, or feedback about the
                Service, we may use them without obligation to compensate you.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. AI-Generated Content</h2>
              <p>
                IntentBid uses artificial intelligence to generate proposal
                content. You acknowledge and agree that:
              </p>
              <ul>
                <li>
                  AI-generated content is a starting point and should be
                  reviewed, edited, and approved by qualified humans before use
                  in any proposal submission.
                </li>
                <li>
                  We do not guarantee the accuracy, completeness, or suitability
                  of AI-generated content for any particular purpose.
                </li>
                <li>
                  You are solely responsible for reviewing and verifying all
                  content before including it in proposals or other business
                  documents.
                </li>
                <li>
                  AI-generated content may occasionally contain errors,
                  inaccuracies, or statements that do not reflect your
                  organization&apos;s actual capabilities.
                </li>
              </ul>
              <p>
                IntentBid is designed as a human-in-the-loop system. The AI
                accelerates your work &mdash; it does not replace your
                professional judgment.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Acceptable Use</h2>
              <p>You agree not to use IntentBid to:</p>
              <ul>
                <li>
                  Generate fraudulent, misleading, or intentionally deceptive
                  proposal content
                </li>
                <li>
                  Violate any applicable law, regulation, or government
                  contracting rule
                </li>
                <li>Infringe on the intellectual property rights of others</li>
                <li>
                  Attempt to reverse-engineer, decompile, or extract the AI
                  models or algorithms
                </li>
                <li>Share your account credentials with unauthorized users</li>
                <li>
                  Use automated tools to scrape or extract data from the
                  platform
                </li>
                <li>
                  Interfere with or disrupt the Service or its infrastructure
                </li>
                <li>
                  Submit content that contains malware, viruses, or harmful code
                </li>
              </ul>
              <p>
                We reserve the right to suspend or terminate your access for any
                violation of these terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Confidentiality</h2>
              <p>
                We treat your proposal content, uploaded documents, and business
                information as confidential. We will not share, publish, or
                disclose your content to third parties except as necessary to
                provide the Service (e.g., sending content to AI processing
                services) or as required by law.
              </p>
              <p>
                We may use aggregated, de-identified data derived from your
                usage to improve the Service. Such data will not identify you or
                your organization.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Service Availability</h2>
              <p>
                We strive to maintain high availability of the Service but do
                not guarantee uninterrupted access. The Service may be
                temporarily unavailable due to maintenance, updates, or
                circumstances beyond our control.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any
                feature of the Service at any time with reasonable notice.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Termination</h2>
              <p>
                Either party may terminate this agreement at any time. You may
                cancel your subscription through the platform or by contacting
                us. We may terminate or suspend your access if you breach these
                terms.
              </p>
              <p>
                Upon termination, your right to use the Service ceases. We will
                retain your data for 90 days to allow for export or
                reactivation, after which it will be permanently deleted.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, IntentBid shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, including but not limited to loss of profits,
                revenue, contracts, data, or business opportunities, arising
                from your use of the Service.
              </p>
              <p>
                Our total liability for any claim arising from or related to the
                Service shall not exceed the amount you paid us in the 12 months
                preceding the claim.
              </p>
              <p>
                The Service is provided &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; without warranties of any kind, express or
                implied, including warranties of merchantability, fitness for a
                particular purpose, or non-infringement.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless IntentBid, its
                officers, employees, and agents from any claims, damages, or
                expenses arising from your use of the Service, your content, or
                your violation of these terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>13. Governing Law</h2>
              <p>
                These Terms of Service are governed by and construed in
                accordance with the laws of the State of Delaware, United
                States, without regard to its conflict of law provisions. Any
                disputes arising from these terms shall be resolved in the state
                or federal courts located in Delaware.
              </p>
            </section>

            <section className="legal-section">
              <h2>14. Changes to These Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will
                notify you of material changes by email or through a notice on
                the platform at least 30 days before they take effect. Continued
                use of IntentBid after changes become effective constitutes
                acceptance of the updated terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>15. Contact Us</h2>
              <p>
                If you have questions about these Terms of Service, contact us
                at:
              </p>
              <p className="legal-contact">
                IntentBid
                <br />
                Email:{" "}
                <a href="mailto:legal@intentbid.com">legal@intentbid.com</a>
              </p>
            </section>
          </div>
        </main>

        <footer className="legal-footer">
          <div className="legal-footer-inner">
            <span className="legal-footer-text">
              IntentBid &mdash; Proposal intelligence, engineered to win.
            </span>
            <div className="legal-footer-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* All styles provided by @/styles/public.css */}
    </>
  );
}
