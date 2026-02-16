import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
    // Use forks for better isolation with Supabase
    pool: "forks",
    singleFork: true,
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
    ],
  },
});
