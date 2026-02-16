import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore logs and generated files
    "logs/**",
    "*.log",
  ]),
  // Custom rules for code consistency and quality
  {
    rules: {
      // Allow unused vars that start with underscore (common pattern for ignored params)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Prefer const over let when variable is never reassigned
      "prefer-const": "warn",
      // Consistent spacing
      "no-multiple-empty-lines": ["warn", { max: 2, maxEOF: 1 }],
      // Enforce structured logger instead of console.log
      // Warn on console usage — use logger from @/lib/utils/logger instead.
      // console.error is allowed in catch blocks but logger.error is preferred.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Prevent debugger statements in production code
      "no-debugger": "error",
      // Enforce strict equality checks
      eqeqeq: ["warn", "always", { null: "ignore" }],
      // Prevent accidental variable shadowing
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "warn",
    },
  },
  // Relax rules for test files
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/test-utils/**"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
