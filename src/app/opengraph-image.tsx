import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "IntentBid - AI Proposal Intelligence Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
            color: "#a78bfa",
            border: "1px solid rgba(124, 58, 237, 0.3)",
            background: "rgba(124, 58, 237, 0.08)",
            padding: "8px 24px",
            borderRadius: "100px",
            marginBottom: "32px",
          }}
        >
          Invite Only
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#fafafa",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            Proposals engineered to
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              background: "linear-gradient(135deg, #a78bfa, #818cf8, #6366f1)",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            win.
          </div>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: "20px",
            color: "#71717a",
            marginTop: "28px",
            textAlign: "center" as const,
            display: "flex",
          }}
        >
          6 layers of persuasion intelligence in every section.
        </div>

        {/* Logo */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#52525b",
              letterSpacing: "-0.02em",
            }}
          >
            IntentBid
          </div>
          <div style={{ color: "#3f3f46", fontSize: "14px" }}>|</div>
          <div style={{ color: "#3f3f46", fontSize: "14px" }}>
            intentbid.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
