import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/**/*.test.ts",
      "services/**/*.test.ts",
      "apps/blog/**/*.test.ts",
      "apps/site/src/**/*.test.js",
      "apps/blog/test/**/*.test.ts",
      "scripts/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/dist/**"],
    passWithNoTests: true,
  },
});
