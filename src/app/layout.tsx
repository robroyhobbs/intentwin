import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  metadataBase: new URL("https://intentwin.com"),
  title: {
    default: "IntentWin - AI Proposal Intelligence Platform",
    template: "%s | IntentWin",
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
  authors: [{ name: "IntentWin" }],
  creator: "IntentWin",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "IntentWin - AI Proposal Intelligence Platform",
    description:
      "Generate winning proposals, RFPs, RFIs, and SOWs in hours. AI-powered persuasion intelligence with a 6-layer Intent Framework. Built for consulting firms, government contractors, and sales teams.",
    url: "https://intentwin.com",
    siteName: "IntentWin",
    locale: "en_US",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentWin - AI Proposal Intelligence Platform",
    description:
      "Generate winning proposals, RFPs, RFIs, and SOWs in hours. AI-powered persuasion intelligence with a 6-layer Intent Framework.",
    creator: "@intentwin",
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
      </body>
    </html>
  );
}
