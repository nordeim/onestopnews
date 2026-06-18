import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // Exclude Playwright E2E tests from vitest (they use @playwright/test, not vitest)
    exclude: [
      "node_modules/",
      "dist/",
      "backup/",
      "plans/",
      "e2e/**",
      "playwright.config.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      exclude: [
        "node_modules/",
        "dist/",
        "*.config.*",
        "*.d.ts",
        "src/test/**",
        "e2e/**",
      ],
    },
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
