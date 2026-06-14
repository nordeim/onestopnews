import * as React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders without errors", () => {
    const { container } = render(<HomePage />);
    expect(container).toBeDefined();
  });
});
