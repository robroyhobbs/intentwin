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
    // Ignore logs, workspace, and generated files
    "logs/**",
    "workspace/**",
    "tasks/**",
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

      // ── Code size constraints ──────────────────────────────────────
      // Enforce maximum file length (300 lines). Warns at 300, errors would be too strict
      // for existing code. New code should target <300 lines per file.
      "max-lines": [
        "warn",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      // Enforce maximum function length (50 lines of logic)
      "max-lines-per-function": [
        "warn",
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      // Maximum depth of nested blocks (4 levels)
      "max-depth": ["warn", 4],
      // Maximum number of parameters per function
      "max-params": ["warn", 5],
    },
  },
  // Relax rules for test files
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/test-utils/**",
      "__tests__/**",
    ],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Playwright `use()` fixtures trigger false positives
      "react-hooks/rules-of-hooks": "off",
      // Tests often have long setup/assertion blocks
      "max-lines-per-function": "off",
      "max-lines": "off",
      "max-depth": "off",
      "max-params": "off",
    },
  },
  // Relax rules for scripts (seed data, migrations, utilities)
  {
    files: ["scripts/**"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Relax function length for page components (orchestrators that wire sub-components)
  // and CSS/style files that are inherently long
  {
    files: [
      "**/page.tsx",
      "**/layout.tsx",
      "**/styles.ts",
      "**/constants.ts",
      "**/types.ts",
      "**/templates.ts",
    ],
    rules: {
      // Page components are orchestrators — they can be longer but should still stay under 600
      "max-lines": [
        "warn",
        { max: 600, skipBlankLines: true, skipComments: true },
      ],
      // Page default exports wire state + JSX, naturally longer
      "max-lines-per-function": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  // Dynamic require() is needed for some Node.js libraries (docx, pptx generators)
  {
    files: ["src/lib/export/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
