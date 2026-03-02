// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AlertCard } from "../alert-card";

describe("AlertCard", () => {
  it("renders the alert text", () => {
    render(<AlertCard severity="high" text="Critical issue found" />);
    expect(screen.getByText("Critical issue found")).toBeInTheDocument();
  });

  it("applies red left border for high severity", () => {
    const { container } = render(
      <AlertCard severity="high" text="High alert" />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("border-l-red-500");
  });

  it("applies amber left border for medium severity", () => {
    const { container } = render(
      <AlertCard severity="medium" text="Medium alert" />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("border-l-amber-500");
  });

  it("applies blue left border for low severity", () => {
    const { container } = render(
      <AlertCard severity="low" text="Low alert" />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("border-l-blue-500");
  });

  it("renders an icon for each severity", () => {
    const { container: highContainer } = render(
      <AlertCard severity="high" text="h" />,
    );
    expect(highContainer.querySelector("svg")).toBeInTheDocument();

    const { container: medContainer } = render(
      <AlertCard severity="medium" text="m" />,
    );
    expect(medContainer.querySelector("svg")).toBeInTheDocument();

    const { container: lowContainer } = render(
      <AlertCard severity="low" text="l" />,
    );
    expect(lowContainer.querySelector("svg")).toBeInTheDocument();
  });
});
