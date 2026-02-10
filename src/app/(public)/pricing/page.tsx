import type { Metadata } from "next";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing - IntentWin | AI Proposal Intelligence Platform",
  description:
    "IntentWin is an invite-only AI proposal intelligence platform. $999/month for unlimited proposals, the Intent Framework persuasion engine, white-glove onboarding, and dedicated support.",
  keywords: [
    "proposal intelligence platform",
    "AI proposal generator",
    "RFP automation software",
    "proposal persuasion engine",
    "enterprise proposal tool",
    "Intent Framework",
  ],
  openGraph: {
    title: "IntentWin Pricing - One Plan, Everything Included",
    description:
      "$999/month for unlimited proposals, 6-layer persuasion engine, white-glove onboarding, and dedicated support. Invite-only.",
    type: "website",
    url: "https://intentwin.com/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentWin Pricing - $999/mo, Everything Included",
    description:
      "Unlimited proposals. Intent Framework persuasion engine. White-glove onboarding. Invite-only.",
  },
  alternates: {
    canonical: "https://intentwin.com/pricing",
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
