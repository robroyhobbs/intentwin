/**
 * Rate Limiting — Public API
 *
 * @example
 * // Wrap entire route handler:
 * import { withRateLimit } from "@/lib/rate-limit";
 * export const POST = withRateLimit(async (request) => { ... });
 *
 * @example
 * // Check inline:
 * import { rateLimitCheck, AI_GENERATION_LIMIT } from "@/lib/rate-limit";
 * const blocked = rateLimitCheck(request, AI_GENERATION_LIMIT);
 * if (blocked) return blocked;
 */

export { withRateLimit, rateLimitCheck } from "./middleware";
export {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  type RateLimitConfig,
  type RateLimitResult,
} from "./limiter";
export {
  AUTH_LIMIT,
  API_LIMIT,
  AI_GENERATION_LIMIT,
  UPLOAD_LIMIT,
  EXPORT_LIMIT,
  PUBLIC_LIMIT,
  HEALTH_LIMIT,
  getRouteLimit,
} from "./config";
