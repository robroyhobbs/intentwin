"use client";

import { Bookmark } from "lucide-react";
import { IntelligenceLoading } from "../_components/intelligence-loading";

export default function SavedMatchesLoading() {
  return <IntelligenceLoading icon={Bookmark} label="saved matches" />;
}
