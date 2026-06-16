import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the footer with correct role", () => {
    render(<Footer currentYear={2026} />);
    expect(screen.getByRole("contentinfo")).toBeDefined();
  });

  it("displays the brand name", () => {
    render(<Footer currentYear={2026} />);
    expect(screen.getByText("OneStopNews")).toBeDefined();
  });

  it("shows AI disclosure text", () => {
    render(<Footer currentYear={2026} />);
    expect(screen.getByText(/AI Disclosure/i)).toBeDefined();
  });

  // Fix A: Verify year is derived from prop, not new Date()
  it("displays the correct year from prop", () => {
    render(<Footer currentYear={2026} />);
    expect(screen.getByText(/2026/)).toBeDefined();
  });

  it("has all section headings", () => {
    render(<Footer currentYear={2026} />);
    expect(screen.getByText("Product")).toBeDefined();
    expect(screen.getByText("Company")).toBeDefined();
    expect(screen.getByText("Legal")).toBeDefined();
  });
});
