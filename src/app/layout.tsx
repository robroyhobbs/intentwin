import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://intentbid.com"),
  title: {
    default: "IntentBid - AI Proposal Intelligence Platform",
    template: "%s | IntentBid",
  },
  description:
    "Generate winning proposals, RFPs, RFIs, and SOWs in hours. AI-powered persuasion intelligence with a 6-layer Intent Framework. Built for consulting firms, government contractors, and sales teams.",
  keywords: [
    "AI proposal generator",
    "RFP response software",
    "proposal automation",
    "RFI response tool",
    "SOW generator",
    "Intent Framework",
    "proposal intelligence",
    "AI persuasion engine",
    "government contractor proposals",
    "consulting proposal software",
    "sales proposal platform",
    "enterprise proposal automation",
    "winning proposals AI",
    "proposal writing software",
    "bid management tool",
  ],
  authors: [{ name: "IntentBid" }],
  creator: "IntentBid",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "IntentBid - AI Proposal Intelligence Platform",
    description:
      "Generate winning proposals, RFPs, RFIs, and SOWs in hours. AI-powered persuasion intelligence with a 6-layer Intent Framework. Built for consulting firms, government contractors, and sales teams.",
    url: "https://intentbid.com",
    siteName: "IntentBid",
    locale: "en_US",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentBid - AI Proposal Intelligence Platform",
    description:
      "Generate winning proposals, RFPs, RFIs, and SOWs in hours. AI-powered persuasion intelligence with a 6-layer Intent Framework.",
    creator: "@intentbid",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'system';
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme === 'dark' || (theme === 'system' && systemDark);
                if (isDark) document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--card-bg)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
