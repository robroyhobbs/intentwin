/**
 * Intelligence Service client.
 *
 * Typed HTTP client for the IntentBid Intelligence microservice.
 * Every method returns T | null — never throws to callers.
 * Silent degradation: if service is down or unconfigured, returns null.
 */

import { createLogger } from "@/lib/utils/logger";
import type {
  AgencyProfileResponse,
  PricingLookupResponse,
  AwardsSearchResponse,
  ProposalIntelligence,
  WinProbabilityResponse,
  CompetitiveLandscapeResponse,
  OpportunityMatchesParams,
  OpportunityMatchesResponse,
} from "./types";
import type {
  IntelligenceService,
  PricingRatesParams,
  AwardsSearchParams,
  WinProbabilityParams,
  CompetitiveLandscapeParams,
  ProposalIntelligenceParams,
} from "./contracts";

const logger = createLogger({ module: "intelligence-client" });

// TTL cache: key -> { data, expiresAt }
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_MAX_ENTRIES = 250;
const CACHE_CLEANUP_INTERVAL = 25;
const REQUEST_SLOW_WARN_MS = 1500;
let cacheWritesSinceCleanup = 0;

function cleanupCache(now: number): void {
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  if (cache.size <= CACHE_MAX_ENTRIES) return;
  const overflow = cache.size - CACHE_MAX_ENTRIES;
  const oldestKeys = [...cache.entries()]
    .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
    .slice(0, overflow)
    .map(([key]) => key);
  oldestKeys.forEach((key) => cache.delete(key));
}

/**
 * Typed client for the IntentBid Intelligence Service.
 *
 * Design principles:
 * - Singleton (module-level instance exported)
 * - Every method returns T | null (never throws to callers)
 * - TTL cache per endpoint+params to reduce load
 * - Silent degradation: if service is down, returns null
 * - Env var gated: if INTELLIGENCE_API_URL is unset, all methods return null
 */
class IntelligenceClient implements IntelligenceService {
  private baseUrl: string | null;
  private apiKey: string | null;
  private timeoutMs: number;

  constructor() {
    const url = process.env.INTELLIGENCE_API_URL?.trim() || null;
    const key = process.env.INTELLIGENCE_SERVICE_KEY?.trim() || null;
    this.baseUrl = url || null;
    this.apiKey = key || null;
    this.timeoutMs = 5000;
  }

  /** True if the intelligence service is configured */
  get isConfigured(): boolean {
    return this.baseUrl !== null && this.apiKey !== null;
  }

  // ── Agency Intelligence ──────────────────────────────────────────────

  async getAgencyProfile(
    agencyName: string,
  ): Promise<AgencyProfileResponse | null> {
    return this.cachedGet<AgencyProfileResponse>(
      `/api/v1/agency/${encodeURIComponent(agencyName)}`,
      `agency:${agencyName}`,
    );
  }

  // ── Pricing Intelligence ─────────────────────────────────────────────

  async getPricingRates(params: PricingRatesParams): Promise<PricingLookupResponse | null> {
    const searchParams = new URLSearchParams();
    searchParams.set("categories", params.categories.join(","));
    if (params.businessSize)
      searchParams.set("business_size", params.businessSize);
    if (params.naicsCode) searchParams.set("naics_code", params.naicsCode);

    return this.cachedGet<PricingLookupResponse>(
      `/api/v1/pricing/rates?${searchParams.toString()}`,
      `pricing:${[...params.categories].sort().join(",")}:${params.businessSize ?? ""}:${params.naicsCode ?? ""}`,
    );
  }

  // ── Awards Search ────────────────────────────────────────────────────

  async searchAwards(params: AwardsSearchParams): Promise<AwardsSearchResponse | null> {
    const searchParams = new URLSearchParams();
    if (params.agency) searchParams.set("agency", params.agency);
    if (params.naicsCode) searchParams.set("naics_code", params.naicsCode);
    if (params.competitionType)
      searchParams.set("competition_type", params.competitionType);
    if (params.limit) searchParams.set("limit", String(params.limit));

    return this.cachedGet<AwardsSearchResponse>(
      `/api/v1/awards/search?${searchParams.toString()}`,
      `awards:${searchParams.toString()}`,
    );
  }

  // ── Opportunity Matching ───────────────────────────────────────────────

  async getOpportunityMatches(
    params: OpportunityMatchesParams,
  ): Promise<OpportunityMatchesResponse | null> {
    return this.postJson<OpportunityMatchesResponse>(
      "/api/v1/opportunities/matches",
      params,
    );
  }

  // ── Win Probability ───────────────────────────────────────────────────

  async getWinProbability(params: WinProbabilityParams): Promise<WinProbabilityResponse | null> {
    const searchParams = new URLSearchParams();
    if (params.agency) searchParams.set("agency", params.agency);
    if (params.naicsCode) searchParams.set("naics_code", params.naicsCode);
    if (params.awardAmount != null)
      searchParams.set("award_amount", String(params.awardAmount));
    if (params.competitionType)
      searchParams.set("competition_type", params.competitionType);
    if (params.setAsideType)
      searchParams.set("set_aside_type", params.setAsideType);
    if (params.businessSize)
      searchParams.set("business_size", params.businessSize);

    return this.cachedGet<WinProbabilityResponse>(
      `/api/v1/win-probability?${searchParams.toString()}`,
      `win-prob:${searchParams.toString()}`,
    );
  }

  // ── Competitive Landscape ──────────────────────────────────────────────

  async getCompetitiveLandscape(params: CompetitiveLandscapeParams): Promise<CompetitiveLandscapeResponse | null> {
    const searchParams = new URLSearchParams();
    if (params.agency) searchParams.set("agency", params.agency);
    if (params.naicsCode) searchParams.set("naics_code", params.naicsCode);

    return this.cachedGet<CompetitiveLandscapeResponse>(
      `/api/v1/competitive-landscape?${searchParams.toString()}`,
      `comp-landscape:${searchParams.toString()}`,
    );
  }

  // ── Composite: Proposal Intelligence Bundle ──────────────────────────
  //
  // Single method that fetches all intelligence needed for a proposal.
  // Called once in buildPipelineContext(). Runs sub-fetches in parallel.

  async getProposalIntelligence(params: ProposalIntelligenceParams): Promise<ProposalIntelligence | null> {
    if (!this.isConfigured) return null;

    const start = Date.now();
    try {
      // Run all lookups in parallel with individual timeouts
      const [agencyProfile, pricingRates, awardsResult, competitiveLandscape] = await Promise.all([
        params.agencyName
          ? this.getAgencyProfile(params.agencyName)
          : Promise.resolve(null),
        params.laborCategories && params.laborCategories.length > 0
          ? this.getPricingRates({
              categories: params.laborCategories,
              naicsCode: params.naicsCode ?? undefined,
            })
          : Promise.resolve(null),
        params.naicsCode
          ? this.searchAwards({
              agency: params.agencyName ?? undefined,
              naicsCode: params.naicsCode,
              limit: 10,
            })
          : Promise.resolve(null),
        params.agencyName || params.naicsCode
          ? this.getCompetitiveLandscape({
              agency: params.agencyName ?? undefined,
              naicsCode: params.naicsCode ?? undefined,
            })
          : Promise.resolve(null),
      ]);

      const intelligence: ProposalIntelligence = {
        agency: agencyProfile,
        pricing: pricingRates,
        recentAwards: awardsResult?.awards ?? [],
        totalMatchingAwards: awardsResult?.total ?? 0,
        competitiveLandscape,
        fetchedAt: new Date().toISOString(),
        fetchDurationMs: Date.now() - start,
      };

      logger.info("Proposal intelligence fetched", {
        agency: params.agencyName,
        naics: params.naicsCode,
        hasAgency: !!agencyProfile,
        hasPricing: !!pricingRates,
        hasCompetitiveLandscape: !!competitiveLandscape,
        awardCount: intelligence.totalMatchingAwards,
        durationMs: intelligence.fetchDurationMs,
      });

      return intelligence;
    } catch (err) {
      logger.warn("Failed to fetch proposal intelligence bundle", {
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      });
      return null;
    }
  }

  // ── Internal ─────────────────────────────────────────────────────────

  private async cachedGet<T>(
    path: string,
    cacheKey: string,
  ): Promise<T | null> {
    if (!this.isConfigured) return null;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug("Intelligence cache hit", { cacheKey });
      return cached.data as T;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      const requestStartedAt = Date.now();

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: {
          "X-Service-Key": this.apiKey!,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const requestDurationMs = Date.now() - requestStartedAt;
      if (requestDurationMs > REQUEST_SLOW_WARN_MS) {
        logger.warn("Intelligence API request exceeded SLO threshold", {
          path,
          durationMs: requestDurationMs,
          sloMs: REQUEST_SLOW_WARN_MS,
        });
      }

      if (!response.ok) {
        logger.warn("Intelligence API returned non-OK status", {
          status: response.status,
          path,
        });
        return null;
      }

      const data = (await response.json()) as T;

      // Guard: if the service returned an error object (200 OK with {error: "..."}),
      // treat it as a failure rather than caching a malformed response.
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        Object.keys(data).length <= 2
      ) {
        logger.warn("Intelligence API returned error payload", {
          path,
          error: (data as Record<string, unknown>).error,
        });
        return null;
      }

      // Cache the successful result
      cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      cacheWritesSinceCleanup++;
      if (cacheWritesSinceCleanup % CACHE_CLEANUP_INTERVAL === 0) {
        cleanupCache(Date.now());
      }

      return data;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        logger.warn("Intelligence API request timed out", { path });
      } else {
        logger.warn("Intelligence API request failed", {
          error: err instanceof Error ? err.message : String(err),
          path,
        });
      }
      return null;
    }
  }

  private async postJson<T>(path: string, body: unknown): Promise<T | null> {
    if (!this.isConfigured) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      const requestStartedAt = Date.now();

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "X-Service-Key": this.apiKey!,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const requestDurationMs = Date.now() - requestStartedAt;
      if (requestDurationMs > REQUEST_SLOW_WARN_MS) {
        logger.warn("Intelligence API request exceeded SLO threshold", {
          path,
          durationMs: requestDurationMs,
          sloMs: REQUEST_SLOW_WARN_MS,
        });
      }

      if (!response.ok) {
        logger.warn("Intelligence API returned non-OK status", {
          status: response.status,
          path,
        });
        return null;
      }

      const data = (await response.json()) as T;
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        Object.keys(data).length <= 2
      ) {
        logger.warn("Intelligence API returned error payload", {
          path,
          error: (data as Record<string, unknown>).error,
        });
        return null;
      }

      return data;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        logger.warn("Intelligence API request timed out", { path });
      } else {
        logger.warn("Intelligence API request failed", {
          error: err instanceof Error ? err.message : String(err),
          path,
        });
      }
      return null;
    }
  }
}

// Module-level singleton
export const intelligenceClient: IntelligenceService = new IntelligenceClient();

export function getIntelligenceClient(): IntelligenceService {
  return intelligenceClient;
}
