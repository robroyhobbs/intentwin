// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ScoreBar } from "../score-bar";

describe("ScoreBar", () => {
  it("renders the label and score", () => {
    render(<ScoreBar label="Technical Fit" score={80} />);
    expect(screen.getByText("Technical Fit")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("sets fill width as percentage of maxScore", () => {
    render(<ScoreBar label="Fit" score={75} maxScore={100} />);
    const fill = screen.getByTestId("score-fill");
    expect(fill.style.width).toBe("75%");
  });

  it("uses maxScore=100 by default", () => {
    render(<ScoreBar label="Score" score={50} />);
    const fill = screen.getByTestId("score-fill");
    expect(fill.style.width).toBe("50%");
  });

  it("supports custom maxScore", () => {
    render(<ScoreBar label="Points" score={30} maxScore={60} />);
    const fill = screen.getByTestId("score-fill");
    expect(fill.style.width).toBe("50%");
  });

  it("clamps width to 100%", () => {
    render(<ScoreBar label="Over" score={150} maxScore={100} />);
    const fill = screen.getByTestId("score-fill");
    expect(fill.style.width).toBe("100%");
  });

  it("clamps width to 0%", () => {
    render(<ScoreBar label="Neg" score={-10} maxScore={100} />);
    const fill = screen.getByTestId("score-fill");
    expect(fill.style.width).toBe("0%");
  });

  it("applies green color for score >= 70", () => {
    render(<ScoreBar label="High" score={85} />);
    const fill = screen.getByTestId("score-fill");
    expect(fill.className).toContain("bg-emerald-500");
  });

  it("applies amber color for score 40-69", () => {
    render(<ScoreBar label="Mid" score={55} />);
    const fill = screen.getByTestId("score-fill");
    expect(fill.className).toContain("bg-amber-500");
  });

  it("applies red color for score < 40", () => {
    render(<ScoreBar label="Low" score={20} />);
    const fill = screen.getByTestId("score-fill");
    expect(fill.className).toContain("bg-red-500");
  });
});
