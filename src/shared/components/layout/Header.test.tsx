import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header, CATEGORIES } from "./Header";

describe("Header", () => {
  it("renders the OneStopNews wordmark", () => {
    render(<Header />);
    expect(screen.getByText("OneStopNews")).toBeDefined();
  });

  it("renders all category links in desktop nav", () => {
    render(<Header />);
    for (const cat of CATEGORIES) {
      expect(screen.getAllByText(cat.name)).toBeDefined();
    }
  });

  it("highlights the active category", () => {
    render(<Header activeCategory="tech" />);
    const techLinks = screen.getAllByText("Tech");
    expect(techLinks.length).toBeGreaterThan(0);
    const firstTechLink = techLinks[0];
    if (!firstTechLink) throw new Error("Tech link not found");
    expect(firstTechLink.className).toContain("border-dispatch-slate");
  });

  it("renders a search link", () => {
    render(<Header />);
    const searchLinks = screen.getAllByLabelText("Search news");
    expect(searchLinks.length).toBeGreaterThan(0);
  });

  it("has a mobile menu button", () => {
    render(<Header />);
    expect(screen.getByLabelText("Open menu")).toBeDefined();
  });
});
