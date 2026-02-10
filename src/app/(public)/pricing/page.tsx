import type { Metadata } from "next";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing - IntentWin | AI Proposal Generator Plans",
  description:
    "Simple, transparent pricing for IntentWin. Start with a 14-day free trial. Plans from $29/mo for freelancers to unlimited enterprise solutions. No credit card required.",
  keywords: [
    "proposal software pricing",
    "AI proposal generator cost",
    "RFP software pricing",
    "proposal automation plans",
    "business proposal tool pricing",
  ],
  openGraph: {
    title: "IntentWin Pricing - Plans That Scale With You",
    description:
      "Start free, upgrade when ready. From $29/mo for freelancers to custom enterprise solutions. 14-day free trial, no credit card required.",
    type: "website",
    url: "https://intentwin.com/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentWin Pricing",
    description:
      "Simple, transparent pricing. Start your 14-day free trial today.",
  },
  alternates: {
    canonical: "https://intentwin.com/pricing",
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
