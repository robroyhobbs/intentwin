// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StatBlock } from "../stat-block";

describe("StatBlock", () => {
  it("renders the label and value", () => {
    render(<StatBlock label="Win Rate" value="73%" />);
    expect(screen.getByText("73%")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
  });

  it("uses accent color by default", () => {
    render(<StatBlock label="Score" value="85" />);
    const valueEl = screen.getByText("85");
    expect(valueEl.className).toContain("text-[var(--accent)]");
  });

  it("applies success color class", () => {
    render(<StatBlock label="Wins" value="12" color="success" />);
    const valueEl = screen.getByText("12");
    expect(valueEl.className).toContain("text-emerald-400");
  });

  it("applies warning color class", () => {
    render(<StatBlock label="Pending" value="5" color="warning" />);
    const valueEl = screen.getByText("5");
    expect(valueEl.className).toContain("text-amber-400");
  });

  it("applies danger color class", () => {
    render(<StatBlock label="Losses" value="3" color="danger" />);
    const valueEl = screen.getByText("3");
    expect(valueEl.className).toContain("text-red-400");
  });

  it("applies muted color class", () => {
    render(<StatBlock label="Total" value="20" color="muted" />);
    const valueEl = screen.getByText("20");
    expect(valueEl.className).toContain("text-foreground");
  });

  it("renders the label with stat-label class", () => {
    render(<StatBlock label="Category" value="42" />);
    const labelEl = screen.getByText("Category");
    expect(labelEl.className).toContain("stat-label");
  });
});
