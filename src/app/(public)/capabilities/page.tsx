import type { Metadata } from "next";
import CapabilitiesContent from "./CapabilitiesContent";

export const metadata: Metadata = {
  title: "How IntentWin Works | AI Proposal Generation Platform",
  description:
    "See how IntentWin's Intent-Driven methodology, multi-model AI, and quality oversight create proposals that win.",
  openGraph: {
    title: "IntentWin Capabilities — Proposals Engineered, Not Prompted",
    description:
      "A multi-model AI system with built-in quality oversight, evidence-based generation, and a methodology that turns every proposal into a competitive weapon.",
    type: "website",
    url: "https://intentwin.com/capabilities",
    siteName: "IntentWin",
  },
  twitter: {
    card: "summary_large_image",
    title: "How IntentWin Works | AI Proposal Generation Platform",
    description:
      "Multi-model AI, quality oversight, evidence-based generation. Proposals engineered to win.",
  },
  alternates: {
    canonical: "https://intentwin.com/capabilities",
  },
};

export default function CapabilitiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "IntentWin Capabilities",
            description:
              "How IntentWin's AI proposal generation platform works — IDD methodology, multi-model architecture, and quality oversight.",
            url: "https://intentwin.com/capabilities",
            isPartOf: {
              "@type": "WebSite",
              name: "IntentWin",
              url: "https://intentwin.com",
            },
          }),
        }}
      />
      <CapabilitiesContent />
    </>
  );
}
