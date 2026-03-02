"use client";

interface RadarScore {
  label: string;
  score: number;
}

interface RadarChartProps {
  scores: RadarScore[];
  size?: number;
}

const CX = 150;
const CY = 140;
const R = 100;
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];

function polarToXY(angleDeg: number, radius: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(angleRad),
    y: CY + radius * Math.sin(angleRad),
  };
}

function buildPolygonPoints(scores: RadarScore[]): string {
  const step = 360 / scores.length;
  return scores
    .map((s, i) => {
      const r = (Math.max(0, Math.min(100, s.score)) / 100) * R;
      const { x, y } = polarToXY(i * step, r);
      return `${x},${y}`;
    })
    .join(" ");
}

function RingLines({ count }: { count: number }) {
  return (
    <>
      {RING_FRACTIONS.map((frac) => {
        const step = 360 / count;
        const pts = Array.from({ length: count }, (_, i) => {
          const { x, y } = polarToXY(i * step, R * frac);
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={frac}
            points={pts}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-muted-foreground/20"
          />
        );
      })}
    </>
  );
}

function AxisLines({ count }: { count: number }) {
  const step = 360 / count;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const { x, y } = polarToXY(i * step, R);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-muted-foreground/20"
          />
        );
      })}
    </>
  );
}

function labelAnchor(x: number): "end" | "start" | "middle" {
  if (x < CX - 5) return "end";
  if (x > CX + 5) return "start";
  return "middle";
}

function AxisLabels({ scores }: { scores: RadarScore[] }) {
  const step = 360 / scores.length;
  return (
    <>
      {scores.map((s, i) => {
        const { x, y } = polarToXY(i * step, R + 16);
        return (
          <text
            key={s.label}
            x={x}
            y={y}
            textAnchor={labelAnchor(x)}
            dominantBaseline="central"
            className="fill-muted-foreground text-[10px]"
          >
            {s.label}
          </text>
        );
      })}
    </>
  );
}

function VertexDots({ scores }: { scores: RadarScore[] }) {
  const step = 360 / scores.length;
  return (
    <>
      {scores.map((s, i) => {
        const r = (Math.max(0, Math.min(100, s.score)) / 100) * R;
        const { x, y } = polarToXY(i * step, r);
        return (
          <circle
            key={s.label}
            data-testid="vertex-dot"
            cx={x}
            cy={y}
            r={3}
            fill="var(--accent)"
          />
        );
      })}
    </>
  );
}

export type { RadarScore, RadarChartProps };

export function RadarChart({ scores, size = 300 }: RadarChartProps) {
  if (scores.length === 0) return null;

  const scale = size / 300;

  return (
    <svg
      width={size}
      height={Math.round(280 * scale)}
      viewBox="0 0 300 280"
      role="img"
    >
      <RingLines count={scores.length} />
      <AxisLines count={scores.length} />
      <polygon
        points={buildPolygonPoints(scores)}
        fill="var(--accent)"
        fillOpacity={0.2}
        stroke="var(--accent)"
        strokeWidth={2}
        style={{ filter: "drop-shadow(0 0 6px var(--accent-muted))" }}
      />
      <VertexDots scores={scores} />
      <AxisLabels scores={scores} />
    </svg>
  );
}
