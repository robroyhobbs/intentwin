"use client";
import { Sparkles } from "lucide-react";
import { IntelligenceLoading } from "../_components/intelligence-loading";

export default function OpportunityMatchesLoading() {
  return <IntelligenceLoading icon={Sparkles} label="opportunity matches" />;
}
