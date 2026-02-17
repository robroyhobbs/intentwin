export function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "IntentWin",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered proposal intelligence platform with 6-layer Intent Framework",
    offers: {
      "@type": "Offer",
      price: "999",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
    },
    // Note: aggregateRating removed — no verified reviews yet.
    // Add back when real customer reviews are collected.
  };
}
