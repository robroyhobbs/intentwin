// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { RadarChart } from "../radar-chart";

const sampleScores = [
  { label: "Technical Fit", score: 80 },
  { label: "Team Strength", score: 65 },
  { label: "Price Competitiveness", score: 90 },
  { label: "Past Performance", score: 70 },
  { label: "Innovation", score: 55 },
];

describe("RadarChart", () => {
  it("renders an SVG element", () => {
    const { container } = render(<RadarChart scores={sampleScores} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders a polygon for the filled area", () => {
    const { container } = render(<RadarChart scores={sampleScores} />);
    const polygons = container.querySelectorAll("polygon");
    // Ring polygons (4) + 1 data polygon
    const dataPolygon = Array.from(polygons).find(
      (p) => p.getAttribute("fill") === "var(--accent)",
    );
    expect(dataPolygon).toBeInTheDocument();
  });

  it("renders axis labels", () => {
    render(<RadarChart scores={sampleScores} />);
    expect(screen.getByText("Technical Fit")).toBeInTheDocument();
    expect(screen.getByText("Innovation")).toBeInTheDocument();
  });

  it("renders 5 vertex dots", () => {
    const { container } = render(<RadarChart scores={sampleScores} />);
    const dots = container.querySelectorAll('[data-testid="vertex-dot"]');
    expect(dots).toHaveLength(5);
  });

  it("returns null when scores is empty", () => {
    const { container } = render(<RadarChart scores={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
