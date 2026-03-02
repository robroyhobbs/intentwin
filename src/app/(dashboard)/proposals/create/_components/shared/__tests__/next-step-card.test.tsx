// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { NextStepCard } from "../next-step-card";

describe("NextStepCard", () => {
  it("renders the step text", () => {
    render(<NextStepCard text="Upload your RFP document" />);
    expect(
      screen.getByText("Upload your RFP document"),
    ).toBeInTheDocument();
  });

  it("has accent left border", () => {
    const { container } = render(
      <NextStepCard text="Next action" />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("border-l-[var(--accent)]");
  });

  it("has accent subtle background", () => {
    const { container } = render(
      <NextStepCard text="Background check" />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("bg-[var(--accent-subtle)]");
  });

  it("renders an ArrowRight icon", () => {
    const { container } = render(
      <NextStepCard text="With icon" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
