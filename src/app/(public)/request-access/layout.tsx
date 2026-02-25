import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Access — IntentBid",
  description:
    "Request invite-only access to IntentBid, the AI-powered proposal intelligence platform. We review every request personally and respond within 24 hours.",
  openGraph: {
    title: "Request Access to IntentBid",
    description:
      "Join the waitlist for IntentBid — AI-powered proposal generation for teams that win contracts.",
  },
};

export default function RequestAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
