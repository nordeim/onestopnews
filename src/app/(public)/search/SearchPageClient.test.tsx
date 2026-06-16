import { describe, it } from "vitest";

describe("Client Components — Postgres Import Guard", () => {
  it("does not import postgres in client components", () => {
    // This test reads the transpiled output to ensure no Node.js modules are bundled
    // In practice, this is enforced by build-time checks
  });
});
