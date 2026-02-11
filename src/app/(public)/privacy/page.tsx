import Link from "next/link";

export default function PrivacyPage() {
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
            <h1 className="legal-title">Privacy Policy</h1>
            <p className="legal-updated">Last updated: February 2026</p>

            <section className="legal-section">
              <h2>1. Introduction</h2>
              <p>
                IntentWin (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
                &ldquo;us&rdquo;) operates an AI-powered proposal intelligence
                platform at intentwin.com. This Privacy Policy explains how we
                collect, use, store, and protect your information when you use
                our service.
              </p>
              <p>
                By using IntentWin, you agree to the collection and use of
                information in accordance with this policy.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Information We Collect</h2>
              <h3>Account Information</h3>
              <p>
                When you create an account, we collect your name, email address,
                company name, and billing information. This is necessary to
                provide you access to the platform and process your
                subscription.
              </p>
              <h3>Proposal Content</h3>
              <p>
                You may upload documents (PDF, DOCX, PPTX, TXT, MD, CSV) and
                enter proposal content, RFP requirements, win themes, brand
                voice settings, and other business information. This content is
                used solely to generate and improve your proposals.
              </p>
              <h3>Usage Data</h3>
              <p>
                We automatically collect information about how you interact with
                the platform, including pages visited, features used, proposal
                outcomes you report (win/loss), and session duration. This helps
                us improve the service and your experience.
              </p>
              <h3>Device and Browser Information</h3>
              <p>
                We collect standard technical information such as your browser
                type, operating system, IP address, and device identifiers to
                ensure platform security and compatibility.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve the IntentWin platform</li>
                <li>
                  Generate AI-powered proposal content tailored to your needs
                </li>
                <li>Process your subscription payments</li>
                <li>
                  Send service-related communications (account updates, security
                  alerts)
                </li>
                <li>Analyze usage patterns to improve platform features</li>
                <li>
                  Train and improve our proposal generation models using
                  aggregated, de-identified data
                </li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>
                We do <strong>not</strong> sell your personal information to
                third parties.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Third-Party Services</h2>
              <p>
                IntentWin integrates with the following third-party services to
                deliver our platform:
              </p>
              <ul>
                <li>
                  <strong>Supabase</strong> &mdash; Database hosting and user
                  authentication. Your account data and proposal content are
                  stored securely in Supabase&apos;s infrastructure.
                </li>
                <li>
                  <strong>Google Gemini</strong> &mdash; AI processing for
                  proposal generation. Proposal content is sent to Google&apos;s
                  AI models for text generation. Google&apos;s data handling is
                  governed by their enterprise terms of service.
                </li>
                <li>
                  <strong>Vercel</strong> &mdash; Application hosting and
                  content delivery. Vercel processes web requests and serves the
                  IntentWin application.
                </li>
                <li>
                  <strong>Stripe</strong> &mdash; Payment processing. Stripe
                  handles all payment card data. We never store your full card
                  number on our servers.
                </li>
              </ul>
              <p>
                Each third-party provider operates under their own privacy
                policy and data handling practices. We select providers that
                maintain industry-standard security and privacy protections.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Data Storage and Security</h2>
              <p>
                Your data is stored on secure, encrypted infrastructure provided
                by Supabase and Vercel, with servers located in the United
                States. We implement industry-standard security measures
                including:
              </p>
              <ul>
                <li>Encryption in transit (TLS/SSL) and at rest</li>
                <li>Access controls and authentication requirements</li>
                <li>Regular security assessments</li>
                <li>Principle of least privilege for internal access</li>
              </ul>
              <p>
                While we take reasonable measures to protect your information,
                no method of electronic transmission or storage is 100% secure.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Cookies and Tracking</h2>
              <p>
                We use essential cookies to maintain your authenticated session
                and remember your preferences. We may also use analytics cookies
                to understand how users interact with our platform.
              </p>
              <p>
                You can control cookie settings through your browser. Disabling
                essential cookies may prevent you from using the platform.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Data Retention</h2>
              <p>
                We retain your account information and proposal content for as
                long as your account is active. If you cancel your subscription,
                we retain your data for 90 days to allow for reactivation, after
                which it is permanently deleted.
              </p>
              <p>
                You may request deletion of your data at any time by contacting
                us at{" "}
                <a href="mailto:privacy@intentwin.com">privacy@intentwin.com</a>
                .
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Your Rights</h2>
              <h3>All Users</h3>
              <p>Regardless of your location, you have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Export your proposal content</li>
              </ul>
              <h3>GDPR (European Economic Area)</h3>
              <p>
                If you are in the EEA, you have additional rights under the
                General Data Protection Regulation, including the right to data
                portability, the right to restrict processing, and the right to
                object to processing. Our legal basis for processing your data
                is the performance of our contract with you and our legitimate
                business interests.
              </p>
              <h3>CCPA (California)</h3>
              <p>
                If you are a California resident, you have the right to know
                what personal information we collect, request deletion of your
                data, and opt out of any sale of personal information. We do not
                sell personal information.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Children&apos;s Privacy</h2>
              <p>
                IntentWin is a business-to-business service and is not intended
                for use by individuals under the age of 18. We do not knowingly
                collect personal information from children.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of material changes by email or through a notice on
                the platform. Continued use of IntentWin after changes
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data
                practices, contact us at:
              </p>
              <p className="legal-contact">
                IntentWin
                <br />
                Email:{" "}
                <a href="mailto:privacy@intentwin.com">privacy@intentwin.com</a>
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

      {/* All styles provided by @/styles/public.css */}
    </>
  );
}
