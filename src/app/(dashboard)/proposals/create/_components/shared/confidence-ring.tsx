"use client";

interface ConfidenceRingProps {
  score: number;
  size?: number;
}

function getColor(score: number): string {
  if (score === 0) return "#a1a1aa"; // zinc-400 (neutral)
  if (score < 40) return "#f59e0b"; // amber-500 (building)
  if (score < 70) return "#f59e0b"; // amber-500
  return "#10b981"; // emerald-500
}

function getLabel(score: number): string {
  if (score === 0) return "Not started";
  if (score < 50) return "In progress";
  if (score < 100) return "Almost done";
  return "Complete";
}

function CenterValue({ value, color }: { value: number; color: string }) {
  if (value === 0) {
    return (
      <span className="text-sm font-medium text-muted-foreground">--</span>
    );
  }
  return (
    <span className="text-lg font-bold" style={{ color }}>
      {value}
    </span>
  );
}

export function ConfidenceRing({ score, size = 80 }: ConfidenceRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = getColor(clamped);
  const label = getLabel(clamped);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-muted/30"
          />
          {clamped > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease-out 0.3s" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <CenterValue value={clamped} color={color} />
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
