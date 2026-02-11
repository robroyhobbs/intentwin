"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <>
      <div className="legal-page">
        <nav className="legal-nav">
          <div className="legal-nav-inner">
            <Link href="/" className="legal-logo">
              IntentWin
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
                By accessing or using IntentWin (&ldquo;the Service&rdquo;), operated by
                IntentWin (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), you
                agree to be bound by these Terms of Service. If you are using the Service on
                behalf of an organization, you represent that you have authority to bind that
                organization to these terms.
              </p>
              <p>
                If you do not agree to these terms, do not use the Service.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Service Description</h2>
              <p>
                IntentWin is an AI-powered proposal intelligence platform that helps businesses
                generate, refine, and manage professional proposals. The Service includes:
              </p>
              <ul>
                <li>AI-powered proposal content generation using our Intent Framework</li>
                <li>Document ingestion and analysis (PDF, DOCX, PPTX, TXT, MD, CSV)</li>
                <li>Brand voice calibration and win theme management</li>
                <li>Proposal outcome tracking and continuous learning</li>
                <li>Organizational knowledge base management</li>
                <li>Multi-format proposal export</li>
              </ul>
              <p>
                IntentWin is an invite-only platform. Access is granted at our sole discretion.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Account Terms</h2>
              <p>
                You must provide accurate and complete information when creating your account.
                You are responsible for maintaining the security of your account credentials
                and for all activity that occurs under your account.
              </p>
              <p>
                You must notify us immediately at{" "}
                <a href="mailto:legal@intentwin.com">legal@intentwin.com</a> if you become aware
                of any unauthorized use of your account.
              </p>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms
                or that have been inactive for an extended period.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Payment Terms</h2>
              <p>
                IntentWin is offered as a subscription service at <strong>$999 per month</strong>.
                All features are included in the subscription &mdash; there are no tiers or
                add-on charges.
              </p>
              <ul>
                <li>
                  Billing is processed monthly through Stripe. Your subscription renews
                  automatically unless cancelled.
                </li>
                <li>
                  You may cancel your subscription at any time. Cancellation takes effect at the
                  end of your current billing period. No partial refunds are provided for unused
                  time within a billing cycle.
                </li>
                <li>
                  We reserve the right to change pricing with 30 days&apos; written notice.
                  Price changes will not apply until your next billing cycle after the notice
                  period.
                </li>
                <li>
                  All fees are exclusive of applicable taxes, which will be added where required
                  by law.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Intellectual Property</h2>
              <h3>Your Content</h3>
              <p>
                You retain full ownership of all content you upload to or create using
                IntentWin, including proposals, documents, brand voice configurations, and
                knowledge base materials. We do not claim any ownership rights over your
                content.
              </p>
              <h3>Our Platform</h3>
              <p>
                IntentWin, including its design, code, Intent Framework methodology, AI models,
                user interface, and documentation, is owned by IntentWin and protected by
                intellectual property laws. Your subscription grants you a limited,
                non-exclusive, non-transferable license to use the platform for your internal
                business purposes.
              </p>
              <h3>Feedback</h3>
              <p>
                If you provide suggestions, ideas, or feedback about the Service, we may use
                them without obligation to compensate you.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. AI-Generated Content</h2>
              <p>
                IntentWin uses artificial intelligence to generate proposal content. You
                acknowledge and agree that:
              </p>
              <ul>
                <li>
                  AI-generated content is a starting point and should be reviewed, edited, and
                  approved by qualified humans before use in any proposal submission.
                </li>
                <li>
                  We do not guarantee the accuracy, completeness, or suitability of
                  AI-generated content for any particular purpose.
                </li>
                <li>
                  You are solely responsible for reviewing and verifying all content before
                  including it in proposals or other business documents.
                </li>
                <li>
                  AI-generated content may occasionally contain errors, inaccuracies, or
                  statements that do not reflect your organization&apos;s actual capabilities.
                </li>
              </ul>
              <p>
                IntentWin is designed as a human-in-the-loop system. The AI accelerates your
                work &mdash; it does not replace your professional judgment.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Acceptable Use</h2>
              <p>You agree not to use IntentWin to:</p>
              <ul>
                <li>Generate fraudulent, misleading, or intentionally deceptive proposal content</li>
                <li>Violate any applicable law, regulation, or government contracting rule</li>
                <li>Infringe on the intellectual property rights of others</li>
                <li>Attempt to reverse-engineer, decompile, or extract the AI models or algorithms</li>
                <li>Share your account credentials with unauthorized users</li>
                <li>Use automated tools to scrape or extract data from the platform</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Submit content that contains malware, viruses, or harmful code</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate your access for any violation of
                these terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Confidentiality</h2>
              <p>
                We treat your proposal content, uploaded documents, and business information as
                confidential. We will not share, publish, or disclose your content to third
                parties except as necessary to provide the Service (e.g., sending content to AI
                processing services) or as required by law.
              </p>
              <p>
                We may use aggregated, de-identified data derived from your usage to improve the
                Service. Such data will not identify you or your organization.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Service Availability</h2>
              <p>
                We strive to maintain high availability of the Service but do not guarantee
                uninterrupted access. The Service may be temporarily unavailable due to
                maintenance, updates, or circumstances beyond our control.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any feature of the
                Service at any time with reasonable notice.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Termination</h2>
              <p>
                Either party may terminate this agreement at any time. You may cancel your
                subscription through the platform or by contacting us. We may terminate or
                suspend your access if you breach these terms.
              </p>
              <p>
                Upon termination, your right to use the Service ceases. We will retain your
                data for 90 days to allow for export or reactivation, after which it will be
                permanently deleted.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, IntentWin shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including but
                not limited to loss of profits, revenue, contracts, data, or business
                opportunities, arising from your use of the Service.
              </p>
              <p>
                Our total liability for any claim arising from or related to the Service shall
                not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
              <p>
                The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
                without warranties of any kind, express or implied, including warranties of
                merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless IntentWin, its officers, employees,
                and agents from any claims, damages, or expenses arising from your use of the
                Service, your content, or your violation of these terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>13. Governing Law</h2>
              <p>
                These Terms of Service are governed by and construed in accordance with the laws
                of the State of Delaware, United States, without regard to its conflict of law
                provisions. Any disputes arising from these terms shall be resolved in the state
                or federal courts located in Delaware.
              </p>
            </section>

            <section className="legal-section">
              <h2>14. Changes to These Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of
                material changes by email or through a notice on the platform at least 30 days
                before they take effect. Continued use of IntentWin after changes become
                effective constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>15. Contact Us</h2>
              <p>
                If you have questions about these Terms of Service, contact us at:
              </p>
              <p className="legal-contact">
                IntentWin<br />
                Email: <a href="mailto:legal@intentwin.com">legal@intentwin.com</a>
              </p>
            </section>
          </div>
        </main>

        <footer className="legal-footer">
          <div className="legal-footer-inner">
            <span className="legal-footer-text">
              IntentWin &mdash; Proposal intelligence, engineered to win.
            </span>
            <div className="legal-footer-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .legal-page {
          background: #09090b;
          color: #a1a1aa;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
          font-weight: 400;
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Nav */
        .legal-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .legal-nav-inner {
          max-width: 800px;
          margin: 0 auto;
          padding: 18px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .legal-logo {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.03em;
        }
        .legal-back {
          color: #71717a;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }
        .legal-back:hover {
          color: #a78bfa;
        }

        /* Main */
        .legal-main {
          flex: 1;
          padding: 80px 32px 120px;
        }
        .legal-content {
          max-width: 800px;
          margin: 0 auto;
        }
        .legal-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: linear-gradient(90deg, #a78bfa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 16px;
        }
        .legal-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          line-height: 1.1;
          color: #fafafa;
          letter-spacing: -0.03em;
          margin: 0 0 12px;
        }
        .legal-updated {
          font-size: 14px;
          color: #71717a;
          margin: 0 0 56px;
        }

        /* Sections */
        .legal-section {
          margin-bottom: 48px;
        }
        .legal-section h2 {
          font-size: 22px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 16px;
          letter-spacing: -0.02em;
        }
        .legal-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #e4e4e7;
          margin: 24px 0 8px;
        }
        .legal-section p {
          font-size: 15px;
          color: #a1a1aa;
          line-height: 1.8;
          margin: 0 0 16px;
        }
        .legal-section ul {
          list-style: none;
          padding: 0;
          margin: 0 0 16px;
        }
        .legal-section ul li {
          font-size: 15px;
          color: #a1a1aa;
          line-height: 1.8;
          padding: 4px 0 4px 24px;
          position: relative;
        }
        .legal-section ul li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 14px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
        }
        .legal-section a {
          color: #a78bfa;
          text-decoration: none;
          transition: color 0.2s;
        }
        .legal-section a:hover {
          color: #c4b5fd;
        }
        .legal-section strong {
          color: #e4e4e7;
          font-weight: 600;
        }
        .legal-contact {
          padding: 20px 24px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        /* Footer */
        .legal-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 32px;
        }
        .legal-footer-inner {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .legal-footer-text {
          font-size: 13px;
          color: #3f3f46;
        }
        .legal-footer-links {
          display: flex;
          gap: 24px;
        }
        .legal-footer-links a {
          font-size: 13px;
          color: #71717a;
          text-decoration: none;
          transition: color 0.2s;
        }
        .legal-footer-links a:hover {
          color: #a78bfa;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .legal-main {
            padding: 60px 20px 80px;
          }
          .legal-nav-inner {
            padding: 16px 20px;
          }
          .legal-footer {
            padding: 24px 20px;
          }
          .legal-footer-inner {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
