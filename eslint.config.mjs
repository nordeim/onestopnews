import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // "e2e/**" has been removed from this array
    ignores: [
      ".next/**", 
      "node_modules/**", 
      "drizzle/**", 
      "dist/**", 
      "playwright.config.ts", 
      "skills/**", 
      "coverage/**"
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
