/**
 * Lightweight conversion event tracking.
 * Uses Vercel Analytics `track()` for custom events.
 * Falls back to no-op in non-browser or when analytics isn't loaded.
 */

type ConversionEvent =
  | "cta_click"           // Any CTA button click
  | "waitlist_form_start" // Started filling out the request access form
  | "waitlist_form_submit"// Submitted the request access form
  | "section_view"        // Scrolled to a key landing page section
  | "nav_click"           // Clicked a nav link
  | "calculator_interact" // Used the ROI calculator
  | "email_cta_click";    // Clicked CTA in a nurture email (tracked via URL param)

interface TrackProperties {
  /** Where on the page the event happened */
  location?: string;
  /** Which CTA or element was interacted with */
  label?: string;
  /** Additional context */
  value?: string | number;
}

export function trackEvent(event: ConversionEvent, properties?: TrackProperties) {
  if (typeof window === "undefined") return;

  try {
    // Vercel Analytics track() is injected by the <Analytics /> component
    // It's available on window.va if the script has loaded
    const va = (window as Record<string, unknown>).va as
      | ((cmd: string, event: string, props?: Record<string, unknown>) => void)
      | undefined;

    if (typeof va === "function") {
      va("event", event, properties);
    }
  } catch {
    // Silent fail — analytics should never break the app
  }
}
