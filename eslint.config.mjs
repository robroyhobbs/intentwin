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
  // Custom rules for code consistency
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
    },
  },
]);

export default eslintConfig;
