import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LandingContent from "./(public)/landing/LandingContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IntentWin - AI-Powered Proposal Generation | Win More Deals",
  description:
    "Generate winning proposals in hours, not weeks. IntentWin uses Intent-Driven Development to create professional, client-specific proposals that close deals. Start your free trial.",
  keywords: [
    "AI proposal generator",
    "proposal automation",
    "RFP response software",
    "proposal writing tool",
    "AI business proposals",
    "sales proposal software",
    "automated proposal generation",
  ],
  openGraph: {
    title: "IntentWin - Generate Winning Proposals with AI",
    description:
      "Transform your proposal process. Create professional proposals in hours using AI that learns your company's voice and expertise.",
    type: "website",
    url: "https://intentwin.com",
    siteName: "IntentWin",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentWin - AI-Powered Proposal Generation",
    description:
      "Generate winning proposals in hours, not weeks. Start your free trial.",
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
