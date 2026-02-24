"use client";

import { DealOutcome } from "@/lib/constants/statuses";
import type { RechartsTooltipProps, RechartsTooltipPayloadEntry } from "@/types/charts";

// Theme-matched hex colors
export const COLORS = {
  accent: "#00FF88",
  accentDim: "#00cc6a",
  success: "#00FF88",
  danger: "#FF4466",
  warning: "#FFAA00",
  info: "#0066FF",
  purple: "#8b5cf6",
  cyan: "#12ABDB",
  foreground: "#ffffff",
  foregroundMuted: "#a0a0a0",
  foregroundSubtle: "#666666",
  background: "#0a0a0a",
  backgroundSecondary: "#111111",
  backgroundTertiary: "#1a1a1a",
  border: "#2a2a2a",
  cardBg: "#111111",
};

export const PIPELINE_COLORS = [
  COLORS.foregroundMuted,
  COLORS.info,
  COLORS.purple,
  COLORS.warning,
  COLORS.cyan,
  COLORS.accent,
];

export const LOSS_COLORS = [
  COLORS.danger,
  "#cc3355",
  "#ff6688",
  "#ff8899",
  "#ee5577",
  "#dd4466",
  "#bb2244",
  "#ff7799",
];

export const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: COLORS.backgroundSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      <p
        style={{
          color: COLORS.foreground,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      {payload.map(
        (
          entry: RechartsTooltipPayloadEntry,
          index: number
        ) => (
          <p key={index} style={{ color: entry.color, fontSize: 12, margin: "2px 0" }}>
            {entry.name}: {entry.value}
            {entry.name === "Win Rate" ? "%" : ""}
          </p>
        )
      )}
    </div>
  );
};

export const PipelineTooltip = ({ active, payload }: RechartsTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: COLORS.backgroundSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      <p style={{ color: COLORS.foreground, fontSize: 12, fontWeight: 600 }}>
        {item.payload.stage as string}
      </p>
      <p style={{ color: item.color || COLORS.accent, fontSize: 12, marginTop: 4 }}>
        Count: {item.value}
      </p>
    </div>
  );
};

export const LossTooltip = ({ active, payload }: RechartsTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: COLORS.backgroundSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      <p style={{ color: COLORS.foreground, fontSize: 12, fontWeight: 600 }}>
        {item.payload.reason as string}
      </p>
      <p style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>
        Count: {item.value}
      </p>
    </div>
  );
};

export const ScatterTooltip = ({ active, payload }: RechartsTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload as
    | { title: string; qualityScore: number; dealValue: number | null; outcome: string }
    | undefined;
  if (!item) return null;
  return (
    <div
      style={{
        background: COLORS.backgroundSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 14px",
        maxWidth: 250,
      }}
    >
      <p
        style={{
          color: COLORS.foreground,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.title}
      </p>
      <p style={{ color: COLORS.foregroundMuted, fontSize: 12 }}>
        Quality: {item.qualityScore}
      </p>
      <p style={{ color: COLORS.foregroundMuted, fontSize: 12 }}>
        Value: {item.dealValue != null ? `$${item.dealValue.toLocaleString()}` : "N/A"}
      </p>
      <p
        style={{
          color:
            item.outcome === DealOutcome.WON
              ? COLORS.success
              : item.outcome === DealOutcome.LOST
              ? COLORS.danger
              : COLORS.foregroundMuted,
          fontSize: 12,
          fontWeight: 600,
          textTransform: "capitalize",
        }}
      >
        {item.outcome}
      </p>
    </div>
  );
};
