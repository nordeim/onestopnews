import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { PageTransition } from "./PageTransition";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

describe("PageTransition", () => {
  it("renders children without errors", () => {
    const { getByText } = render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    expect(getByText("Test content")).toBeDefined();
  });

  it("does not crash when startViewTransition is not available", () => {
    // @ts-expect-error startViewTransition not in all browsers
    delete document.startViewTransition;

    const { getByText } = render(
      <PageTransition>
        <div>No crash</div>
      </PageTransition>
    );
    expect(getByText("No crash")).toBeDefined();
  });
});
