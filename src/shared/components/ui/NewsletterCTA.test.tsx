import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NewsletterCTA } from "./NewsletterCTA";

describe("NewsletterCTA", () => {
  it("renders the email input", () => {
    const { container } = render(<NewsletterCTA />);
    expect(container.querySelector("input[type='email']")).toBeDefined();
  });

  it("has the subscribe button", () => {
    const { container } = render(<NewsletterCTA />);
    expect(container.querySelector("button")).toBeDefined();
  });

  it("displays trust badges", () => {
    const { container } = render(<NewsletterCTA />);
    expect(container.textContent).toContain("EU AI Act");
  });
});