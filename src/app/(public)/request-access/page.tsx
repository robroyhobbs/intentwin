"use client";

import Link from "next/link";
import { useState, useEffect, FormEvent } from "react";
import { trackEvent } from "@/lib/analytics/track";

export default function RequestAccessPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Track form start on first interaction
  const [formStarted, setFormStarted] = useState(false);
  function handleFormInteraction() {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent("waitlist_form_start", { location: "request-access" });
    }
  }

  // Track email CTA clicks (from nurture emails with ?ref=email param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref === "email") {
      trackEvent("email_cta_click", { location: "request-access" });
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          company_size: companySize || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError("You're already on our list. We'll be in touch soon.");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      setIsSuccess(true);
      trackEvent("waitlist_form_submit", {
        location: "request-access",
        value: companySize || "not-specified",
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="ra-page">
        {/* Nav */}
        <nav className="ra-nav">
          <div className="ra-nav-inner">
            <Link href="/" className="ra-logo">
              IntentWin
            </Link>
            <Link href="/" className="ra-nav-back">
              &larr; Back to Home
            </Link>
          </div>
        </nav>

        {/* Glow effect */}
        <div className="ra-glow" aria-hidden="true" />

        {/* Main content */}
        <main className="ra-main">
          <div className="ra-container">
            {isSuccess ? (
              <div className="ra-success">
                <div className="ra-success-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle
                      cx="24"
                      cy="24"
                      r="22"
                      stroke="url(#successGrad)"
                      strokeWidth="2"
                    />
                    <path
                      d="M15 24L21 30L33 18"
                      stroke="url(#successGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <defs>
                      <linearGradient
                        id="successGrad"
                        x1="0"
                        y1="0"
                        x2="48"
                        y2="48"
                      >
                        <stop stopColor="#a78bfa" />
                        <stop offset="1" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h1 className="ra-success-heading">You&apos;re on the list.</h1>
                <p className="ra-success-sub">
                  Thanks for your interest in IntentWin. We review every request
                  personally and will be in touch soon.
                </p>
                <Link href="/" className="ra-btn-ghost">
                  Back to Home
                </Link>
              </div>
            ) : (
              <>
                <div className="ra-header">
                  <span className="ra-badge">Invite Only</span>
                  <h1 className="ra-heading">Request Access</h1>
                  <p className="ra-sub">
                    IntentWin is invite-only. Request access and we&apos;ll be
                    in touch.
                  </p>
                </div>

                <form className="ra-form" onSubmit={handleSubmit} onFocus={handleFormInteraction}>
                  {error && (
                    <div className="ra-error">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="7"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M8 5V8.5"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <circle cx="8" cy="11" r="0.75" fill="#ef4444" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="ra-field">
                    <label htmlFor="name" className="ra-label">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="Jane Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="ra-input"
                      autoComplete="name"
                    />
                  </div>

                  <div className="ra-field">
                    <label htmlFor="email" className="ra-label">
                      Work Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ra-input"
                      autoComplete="email"
                    />
                  </div>

                  <div className="ra-field">
                    <label htmlFor="company" className="ra-label">
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      required
                      placeholder="Acme Corp"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="ra-input"
                      autoComplete="organization"
                    />
                  </div>

                  <div className="ra-field">
                    <label htmlFor="companySize" className="ra-label">
                      Company Size
                      <span className="ra-optional">Optional</span>
                    </label>
                    <select
                      id="companySize"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="ra-select"
                    >
                      <option value="">Select size...</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ra-submit"
                  >
                    {isSubmitting ? (
                      <span className="ra-spinner-wrap">
                        <span className="ra-spinner" />
                        Submitting...
                      </span>
                    ) : (
                      "Request Access"
                    )}
                  </button>

                  <p className="ra-privacy">
                    We respect your privacy. No spam, ever.
                  </p>
                </form>
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="ra-footer">
          <p>IntentWin — Proposal intelligence, engineered to win.</p>
        </footer>
      </div>

      <style jsx global>{`
        .ra-page {
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
        .ra-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ra-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ra-logo {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.03em;
        }
        .ra-nav-back {
          color: #71717a;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }
        .ra-nav-back:hover {
          color: #fff;
        }

        /* Glow */
        .ra-glow {
          position: fixed;
          top: -10%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(
            circle,
            rgba(124, 58, 237, 0.08) 0%,
            rgba(99, 102, 241, 0.04) 40%,
            transparent 70%
          );
          pointer-events: none;
          animation: ra-glow-pulse 6s ease-in-out infinite;
        }
        @keyframes ra-glow-pulse {
          0%,
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translateX(-50%) scale(1.08);
          }
        }

        /* Main */
        .ra-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 80px;
          position: relative;
          z-index: 2;
        }
        .ra-container {
          width: 100%;
          max-width: 480px;
        }

        /* Header */
        .ra-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .ra-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #a78bfa;
          margin-bottom: 24px;
          border: 1px solid rgba(124, 58, 237, 0.3);
          background: rgba(124, 58, 237, 0.08);
          padding: 6px 18px;
          border-radius: 100px;
        }
        .ra-heading {
          font-size: clamp(32px, 6vw, 44px);
          font-weight: 900;
          line-height: 1.05;
          color: #fafafa;
          letter-spacing: -0.04em;
          margin: 0 0 16px;
        }
        .ra-sub {
          font-size: 16px;
          color: #71717a;
          margin: 0;
          font-weight: 300;
          line-height: 1.6;
        }

        /* Form */
        .ra-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .ra-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ra-label {
          font-size: 13px;
          font-weight: 600;
          color: #d4d4d8;
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ra-optional {
          font-size: 11px;
          font-weight: 400;
          color: #52525b;
        }
        .ra-input,
        .ra-select {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #fafafa;
          font-size: 15px;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }
        .ra-input::placeholder {
          color: #3f3f46;
        }
        .ra-input:focus,
        .ra-select:focus {
          border-color: rgba(124, 58, 237, 0.5);
          background: rgba(124, 58, 237, 0.04);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .ra-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2371717a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 44px;
          cursor: pointer;
        }
        .ra-select option {
          background: #18181b;
          color: #fafafa;
        }

        /* Error */
        .ra-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
        }
        .ra-error svg {
          flex-shrink: 0;
        }

        /* Submit button */
        .ra-submit {
          width: 100%;
          padding: 16px 36px;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 24px rgba(124, 58, 237, 0.25);
          margin-top: 4px;
        }
        .ra-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 32px rgba(124, 58, 237, 0.35);
        }
        .ra-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .ra-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .ra-spinner-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .ra-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ra-spin 0.6s linear infinite;
        }
        @keyframes ra-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Privacy note */
        .ra-privacy {
          text-align: center;
          font-size: 12px;
          color: #3f3f46;
          margin: 0;
        }

        /* Success state */
        .ra-success {
          text-align: center;
          padding: 20px 0;
        }
        .ra-success-icon {
          margin-bottom: 32px;
          animation: ra-checkIn 0.5s ease-out;
        }
        @keyframes ra-checkIn {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          60% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .ra-success-heading {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 900;
          color: #fafafa;
          letter-spacing: -0.04em;
          margin: 0 0 16px;
          line-height: 1.1;
        }
        .ra-success-sub {
          font-size: 16px;
          color: #71717a;
          margin: 0 0 36px;
          line-height: 1.7;
          font-weight: 300;
        }
        .ra-btn-ghost {
          display: inline-block;
          padding: 14px 36px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a1a1aa;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .ra-btn-ghost:hover {
          border-color: rgba(255, 255, 255, 0.25);
          color: #fff;
        }

        /* Footer */
        .ra-footer {
          text-align: center;
          padding: 32px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          z-index: 2;
        }
        .ra-footer p {
          margin: 0;
          font-size: 13px;
          color: #3f3f46;
          letter-spacing: 0.03em;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .ra-nav-inner {
            padding: 16px 20px;
          }
          .ra-main {
            padding: 100px 20px 60px;
          }
          .ra-heading {
            font-size: 32px;
          }
          .ra-input,
          .ra-select {
            padding: 12px 14px;
            font-size: 16px; /* Prevents iOS zoom */
          }
          .ra-submit {
            padding: 14px 28px;
          }
        }
      `}</style>
    </>
  );
}
