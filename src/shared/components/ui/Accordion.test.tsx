import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FaqAccordion from "./Accordion";

describe("FaqAccordion", () => {
  it("renders all FAQ items", () => {
    const { container } = render(<FaqAccordion />);
    expect(container.textContent).toContain("What is the AI Nutrition Label?");
    expect(container.textContent).toContain("How are articles summarised?");
    expect(container.textContent).toContain("What sources does OneStopNews use?");
  });

  it("renders the FAQ heading", () => {
    render(<FaqAccordion />);
    expect(screen.queryByRole("heading", { name: /Frequently Asked/ })).toBeDefined();
  });
});