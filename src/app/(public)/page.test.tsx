import * as React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders without errors", () => {
    const { container } = render(<HomePage />);
    expect(container).toBeDefined();
  });

  it("has a <main> element with id='main-content' as the skip-link target", () => {
    // The skip link in layout.tsx points to #main-content; every page must
    // render a <main id="main-content"> for the skip link to work.
    const { container } = render(<HomePage />);
    const main = container.querySelector("main#main-content");
    expect(main).not.toBeNull();
  });
});
