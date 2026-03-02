// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PhaseIcon } from "../phase-icon";

describe("PhaseIcon", () => {
  it("renders the correct icon for each phase", () => {
    const { rerender } = render(<PhaseIcon phase="intake" state="active" />);
    expect(screen.getByTestId("phase-icon")).toBeInTheDocument();

    rerender(<PhaseIcon phase="strategy" state="active" />);
    expect(screen.getByTestId("phase-icon")).toBeInTheDocument();
  });

  it("applies active glow classes", () => {
    render(<PhaseIcon phase="intake" state="active" />);
    const el = screen.getByTestId("phase-icon");
    expect(el.className).toContain("shadow-");
  });

  it("applies muted classes for inactive state", () => {
    render(<PhaseIcon phase="intake" state="inactive" />);
    const el = screen.getByTestId("phase-icon");
    expect(el.className).toContain("bg-muted");
  });

  it("applies emerald bg for completed state", () => {
    render(<PhaseIcon phase="intake" state="completed" />);
    const el = screen.getByTestId("phase-icon");
    expect(el.className).toContain("bg-emerald");
  });
});
