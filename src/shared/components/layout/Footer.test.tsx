import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the footer with correct role", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeDefined();
  });

  it("displays the brand name", () => {
    render(<Footer />);
    expect(screen.getByText("OneStopNews")).toBeDefined();
  });

  it("shows AI disclosure text", () => {
    render(<Footer />);
    expect(screen.getByText(/AI Disclosure/i)).toBeDefined();
  });

  it("shows the current year in copyright", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(year.toString()))).toBeDefined();
  });

  it("has all section headings", () => {
    render(<Footer />);
    expect(screen.getByText("Product")).toBeDefined();
    expect(screen.getByText("Company")).toBeDefined();
    expect(screen.getByText("Legal")).toBeDefined();
  });
});
