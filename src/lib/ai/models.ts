/**
 * Centralized AI model configuration.
 * All model references should use these constants to prevent model drift.
 *
 * Model decisions:
 * - primary: gemini-3.1-flash-lite-preview — fast, supports thinking mode for generation
 * - scoring: gemini-2.5-flash — bid-eval needs reliable structured JSON output
 * - review: gemini-3.1-flash-lite-preview — quality review with thinking
 * - image: gemini-3.1-flash-image-preview — diagram/image generation
 * - fallback: gemini-2.0-flash — stable, high-quota fallback for rate limit recovery
 */
export const MODEL_DEFAULTS = {
  primary: "gemini-3.1-flash-lite-preview",
  scoring: "gemini-2.5-flash",
  review: "gemini-3.1-flash-lite-preview",
  image: "gemini-3.1-flash-image-preview",
  fallback: "gemini-2.0-flash",
} as const;

/** Strip literal escape sequences (e.g. trailing \n) that env var UIs sometimes inject. */
function cleanEnvModel(value: string | undefined): string {
  return value?.replace(/\\n/g, "").trim() || "";
}

/** Runtime model resolution — reads env vars at call time for testability. */
export function getModel(key: keyof typeof MODEL_DEFAULTS): string {
  switch (key) {
    case "primary":
      return cleanEnvModel(process.env.GEMINI_MODEL) || MODEL_DEFAULTS.primary;
    case "review":
      return (
        cleanEnvModel(process.env.GEMINI_REVIEW_MODEL) ||
        cleanEnvModel(process.env.GEMINI_MODEL) ||
        MODEL_DEFAULTS.review
      );
    case "scoring":
      return (
        cleanEnvModel(process.env.GEMINI_SCORING_MODEL) ||
        MODEL_DEFAULTS.scoring
      );
    case "image":
      return (
        cleanEnvModel(process.env.GEMINI_IMAGE_MODEL) || MODEL_DEFAULTS.image
      );
    default:
      return MODEL_DEFAULTS[key];
  }
}

/** Static config for imports that don't need runtime env var resolution. */
export const MODELS = MODEL_DEFAULTS;
