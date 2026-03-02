// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ReadinessChecklist } from "../readiness-checklist";
import type { ReadinessItem } from "../readiness-checklist";

const items: ReadinessItem[] = [
  { id: "1", label: "RFP uploaded", checked: true },
  { id: "2", label: "Team assigned", checked: false, hint: "Add team members" },
  { id: "3", label: "Deadline set", checked: true },
  { id: "4", label: "Budget reviewed", checked: false },
];

describe("ReadinessChecklist", () => {
  it("renders all items by label text", () => {
    render(<ReadinessChecklist items={items} />);
    expect(screen.getByText("RFP uploaded")).toBeInTheDocument();
    expect(screen.getByText("Team assigned")).toBeInTheDocument();
    expect(screen.getByText("Deadline set")).toBeInTheDocument();
    expect(screen.getByText("Budget reviewed")).toBeInTheDocument();
  });

  it("shows hint text for unchecked items with hints", () => {
    render(<ReadinessChecklist items={items} />);
    expect(screen.getByText("Add team members")).toBeInTheDocument();
  });

  it("has data-checked=true count matching checked items", () => {
    const { container } = render(<ReadinessChecklist items={items} />);
    const checked = container.querySelectorAll('[data-checked="true"]');
    const checkedCount = items.filter((i) => i.checked).length;
    expect(checked).toHaveLength(checkedCount);
  });
});
