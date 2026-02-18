import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/lib/test-utils/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules",
        "src/lib/test-utils/**/*",
        "**/*.d.ts",
        "**/*.config.*",
        "**/generated/**/*",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    // Test file patterns
    include: [
      "src/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "cypress",
      "**/*.e2e.{test,spec}.{js,ts}",
      "__tests__/e2e/**",
    ],
  },
});
