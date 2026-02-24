import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LandingContent from "./(public)/landing/LandingContent";
import { getJsonLd } from "./(public)/landing/json-ld";
import "@/styles/public.css";


export const metadata: Metadata = {
  title: "IntentBid - AI Proposal Intelligence Platform | Win More Deals",
  description:
    "The proposal engine built to win. IntentBid applies the Intent Framework — 6 layers of persuasion science — to every section of your proposal. Invite-only access for serious teams.",
  keywords: [
    "AI proposal intelligence",
    "proposal automation",
    "RFP response software",
    "Intent Framework",
    "proposal persuasion engine",
    "AI business proposals",
    "enterprise proposal platform",
  ],
  openGraph: {
    title: "IntentBid - The Proposal Engine Built to Win",
    description:
      "6 layers of persuasion science applied to every proposal section. Not just AI — a proven framework that turns good proposals into winning ones.",
    type: "website",
    url: "https://intentbid.com",
    siteName: "IntentBid",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentBid - AI Proposal Intelligence Platform",
    description:
      "6 layers of persuasion science. Every section engineered to win. Invite-only access.",
  },
  alternates: {
    canonical: "https://intentbid.com",
  },
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated users go to dashboard
  if (user) {
    redirect("/proposals");
  }

  // Unauthenticated users see the landing page (better for SEO than redirect)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getJsonLd()) }}
      />
      <LandingContent />
    </>
  );
}
