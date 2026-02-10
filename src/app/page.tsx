import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LandingContent from "./(public)/landing/LandingContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IntentWin - AI Proposal Intelligence Platform | Win More Deals",
  description:
    "The proposal engine built to win. IntentWin applies the Intent Framework — 6 layers of persuasion science — to every section of your proposal. Invite-only access for serious teams.",
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
    title: "IntentWin - The Proposal Engine Built to Win",
    description:
      "6 layers of persuasion science applied to every proposal section. Not just AI — a proven framework that turns good proposals into winning ones.",
    type: "website",
    url: "https://intentwin.com",
    siteName: "IntentWin",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentWin - AI Proposal Intelligence Platform",
    description:
      "6 layers of persuasion science. Every section engineered to win. Invite-only access.",
  },
  alternates: {
    canonical: "https://intentwin.com",
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
  return <LandingContent />;
}
