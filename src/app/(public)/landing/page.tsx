import { redirect } from "next/navigation";

// Redirect /landing to / for canonical URL structure
// The landing content is now served at the root URL
export default function LandingPage() {
  redirect("/");
}
