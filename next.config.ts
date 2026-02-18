import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer"],

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // API routes: no caching
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

// Bundle analyzer: run `ANALYZE=true npm run build` to see bundle composition
// Install: npm install --save-dev @next/bundle-analyzer
// Note: Dynamic import wrapped in an async IIFE to avoid top-level await,
// which breaks Node 24 + Next.js config loading (ERR_REQUIRE_ASYNC_MODULE).
let config: NextConfig = nextConfig;

if (process.env.ANALYZE === "true") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const withBundleAnalyzer = require("@next/bundle-analyzer")({
      enabled: true,
    });
    config = withBundleAnalyzer(nextConfig);
  } catch {
    // @next/bundle-analyzer not installed — skip
    console.warn("@next/bundle-analyzer not installed. Run: npm install --save-dev @next/bundle-analyzer");
  }
}

export default config;
