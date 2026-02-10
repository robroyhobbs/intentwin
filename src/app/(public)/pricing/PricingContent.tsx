"use client";

import { useState } from "react";
import Link from "next/link";

const PRICING_TIERS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for freelancers and solopreneurs",
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      "5 proposals per month",
      "50K AI tokens",
      "1 user",
      "10 knowledge base documents",
      "Export to DOCX, PDF, PPTX",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing sales teams",
    monthlyPrice: 79,
    annualPrice: 790,
    features: [
      "20 proposals per month",
      "250K AI tokens",
      "5 users",
      "50 knowledge base documents",
      "Export to all formats",
      "Priority support",
      "Version history",
      "Team collaboration",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For established companies",
    monthlyPrice: 199,
    annualPrice: 1990,
    features: [
      "Unlimited proposals",
      "1M AI tokens",
      "15 users",
      "Unlimited documents",
      "Export to all formats",
      "Dedicated support",
      "Advanced analytics",
      "Custom templates",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

export default function PricingContent() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              Proposal<span className="text-cyan-400">AI</span>
            </Link>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required. Cancel
            anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span
              className={`text-sm ${!isAnnual ? "text-white" : "text-slate-400"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? "bg-cyan-500" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  isAnnual ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${isAnnual ? "text-white" : "text-slate-400"}`}
            >
              Annual{" "}
              <span className="text-cyan-400 font-medium">(Save 17%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-8 ${
                tier.popular
                  ? "bg-gradient-to-b from-cyan-900/50 to-slate-800 border-2 border-cyan-500"
                  : "bg-slate-800/50 border border-slate-700"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-cyan-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-slate-400 text-sm">{tier.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  $
                  {isAnnual
                    ? Math.round(tier.annualPrice / 12)
                    : tier.monthlyPrice}
                </span>
                <span className="text-slate-400">/month</span>
                {isAnnual && (
                  <p className="text-sm text-cyan-400 mt-1">
                    Billed ${tier.annualPrice}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/signup?tier=${tier.id}&interval=${isAnnual ? "annual" : "monthly"}`}
                className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                  tier.popular
                    ? "bg-cyan-500 text-white hover:bg-cyan-600"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Need Enterprise Features?
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-6">
            Get unlimited everything, SSO/SAML, dedicated support, custom
            integrations, and SLA guarantees.
          </p>
          <Link
            href="mailto:sales@intentwin.com?subject=Enterprise%20Inquiry"
            className="inline-block bg-white text-slate-900 px-8 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            Contact Sales
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                How does the free trial work?
              </h3>
              <p className="text-slate-400">
                You get 14 days of full access to all features. Create up to 3
                proposals during your trial. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Can I change plans later?
              </h3>
              <p className="text-slate-400">
                Yes! You can upgrade or downgrade at any time. Changes take
                effect immediately, with prorated billing.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                What are AI tokens?
              </h3>
              <p className="text-slate-400">
                AI tokens measure the amount of text our AI processes. A typical
                proposal uses about 10-20K tokens. Pro plan easily handles 15-25
                proposals per month.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-slate-400">
                Yes, we offer a 30-day money-back guarantee. If you&apos;re not
                satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} IntentWin. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-slate-400 hover:text-white text-sm"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-slate-400 hover:text-white text-sm"
              >
                Privacy
              </Link>
              <Link
                href="mailto:support@intentwin.com"
                className="text-slate-400 hover:text-white text-sm"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
