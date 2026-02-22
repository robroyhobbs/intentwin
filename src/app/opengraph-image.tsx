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
            color: "#C084FC",
            border: "1px solid rgba(192, 132, 252, 0.3)",
            background: "rgba(192, 132, 252, 0.08)",
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
              background: "linear-gradient(135deg, #818CF8, #C084FC, #F472B6)",
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
          
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', marginRight: '8px', background: '#09090b', borderRadius: '8px', boxShadow: '0 0 10px rgba(192,132,252,0.4)' }}>
             {/* Monogram IB */}
             <svg width="24" height="24" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="176" y="144" width="32" height="224" rx="16" fill="#818CF8"/>
                <path d="M232 144H320C355.346 144 384 172.654 384 208C384 233.167 369.458 254.918 348.65 265.558C374.881 275.64 394 300.911 394 330C394 369.764 361.764 402 322 402H232V144Z" stroke="#C084FC" strokeWidth="28" strokeLinejoin="round" strokeLinecap="round"/>
                <path d="M232 268H320" stroke="#C084FC" strokeWidth="28" strokeLinecap="round"/>
                <circle cx="192" cy="112" r="16" fill="#818CF8"/>
                <circle cx="232" cy="112" r="16" fill="#C084FC"/>
              </svg>
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#fafafa",
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
