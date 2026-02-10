"use client";

import Link from "next/link";

const FEATURES = {
  "Proposal Generation": [
    "Unlimited proposals",
    "Intent Framework (6-layer persuasion engine)",
    "RFP Intelligence (auto-extract requirements)",
    "10 specialized section types with targeted frameworks",
  ],
  "Knowledge & Evidence": [
    "Unlimited knowledge base documents",
    "RAG-powered evidence retrieval",
    "Case study, methodology & certification library",
    "Win theme integration",
  ],
  "Export & Delivery": [
    "Word (DOCX) export with branding",
    "PowerPoint (PPTX) slide generation",
    "PDF export",
    "HTML export",
  ],
  "Support & Success": [
    "White-glove onboarding",
    "Dedicated support",
    "Quarterly strategy reviews",
    "Priority feature requests",
  ],
};

const FAQS = [
  {
    question: "Why $999/month?",
    answer:
      "IntentWin isn\u2019t a template tool or a ChatGPT wrapper. It\u2019s a complete proposal intelligence platform with proprietary persuasion methodology, white-glove support, and unlimited usage. Teams using IntentWin typically see ROI within their first winning proposal.",
  },
  {
    question: "Why is it invite-only?",
    answer:
      "We provide white-glove onboarding and dedicated support to every customer. To maintain quality, we limit new accounts to referrals and approved applicants.",
  },
  {
    question: "What\u2019s included in white-glove onboarding?",
    answer:
      "A dedicated success manager helps you set up your knowledge base, configure your brand voice, and optimize your first proposals. We\u2019re hands-on until you\u2019re winning.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No long-term contracts. Cancel anytime with 30 days notice.",
  },
  {
    question: "What makes this different from using ChatGPT?",
    answer:
      "ChatGPT gives you generic text. IntentWin applies the Intent Framework \u2014 6 layers of persuasion science calibrated per proposal section. Executive summaries use AIDA, case studies use STAR, pricing uses value framing. Every section is engineered to persuade evaluators.",
  },
];

function CheckIcon() {
  return (
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
  );
}

export default function PricingContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              Intent<span className="text-cyan-400">Win</span>
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
                Request Access
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            One plan. Everything included.
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            IntentWin is built for teams serious about winning. $999/month gets
            you unlimited access to our complete proposal intelligence platform.
          </p>
        </div>

        {/* Single Plan Card */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="relative rounded-2xl p-8 md:p-10 bg-gradient-to-b from-cyan-900/50 to-slate-800 border-2 border-cyan-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">IntentWin</h2>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">$999</span>
                <span className="text-slate-400 text-lg">/month</span>
              </div>
              <p className="text-cyan-400 font-medium">
                Unlimited proposals. Unlimited intelligence.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-8">
              {Object.entries(FEATURES).map(([category, features]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <ul className="space-y-2.5">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-slate-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="block w-full text-center py-4 rounded-lg font-medium text-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
            >
              Request Access
            </Link>
          </div>

          <p className="text-center text-slate-400 mt-6 text-sm">
            IntentWin is invite-only. Request access and we&apos;ll be in touch
            within 24 hours.
          </p>
        </div>

        {/* ROI Calculator Section */}
        <div className="mb-20">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
              The math is simple.
            </h2>
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-cyan-400 font-bold text-lg">1</span>
                </div>
                <p className="text-lg text-slate-200">
                  If your average deal is worth{" "}
                  <span className="text-white font-semibold">$50,000</span>...
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-cyan-400 font-bold text-lg">2</span>
                </div>
                <p className="text-lg text-slate-200">
                  And IntentWin helps you win just{" "}
                  <span className="text-white font-semibold">
                    ONE more deal per quarter
                  </span>
                  ...
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center">
                  <span className="text-cyan-400 font-bold text-lg">3</span>
                </div>
                <p className="text-lg text-white font-semibold">
                  That&apos;s a{" "}
                  <span className="text-cyan-400 text-2xl">12x</span> return on
                  your investment.
                </p>
              </div>
            </div>
            <div className="text-center mt-10">
              <p className="text-slate-400 text-sm">
                $999/mo x 3 months = $2,997 invested. One $50,000 deal won =
                16.7x ROI.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            {FAQS.map((faq, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-medium text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-slate-400">{faq.answer}</p>
              </div>
            ))}
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
