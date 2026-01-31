import type { Metadata } from "next";
import BlogContent from "./BlogContent";

export const metadata: Metadata = {
  title: "Blog - ProposalAI | AI Proposal Writing Tips & Guides",
  description:
    "Expert insights on proposal writing, RFP strategy, and AI-powered sales enablement. Learn best practices for winning more deals with AI proposal tools.",
  keywords: [
    "proposal writing tips",
    "RFP response guide",
    "AI proposal writing",
    "sales proposal best practices",
    "bid management",
    "proposal automation blog",
  ],
  openGraph: {
    title: "ProposalAI Blog - Proposal Writing Tips & AI Insights",
    description:
      "Expert insights on proposal writing, RFP strategy, and AI-powered sales enablement. Learn how to win more deals.",
    type: "website",
    url: "https://proposalai.com/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProposalAI Blog",
    description:
      "Expert insights on proposal writing and AI-powered sales enablement.",
  },
  alternates: {
    canonical: "https://proposalai.com/blog",
  },
};

export default function BlogPage() {
  return <BlogContent />;
}
