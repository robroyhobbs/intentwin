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
} from "./types";

const logger = createLogger({ module: "intelligence-client" });

// TTL cache: key -> { data, expiresAt }
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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
class IntelligenceClient {
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

  async getPricingRates(params: {
    categories: string[];
    businessSize?: "small" | "large";
    naicsCode?: string;
  }): Promise<PricingLookupResponse | null> {
    const searchParams = new URLSearchParams();
    searchParams.set("categories", params.categories.join(","));
    if (params.businessSize)
      searchParams.set("business_size", params.businessSize);
    if (params.naicsCode) searchParams.set("naics_code", params.naicsCode);

    return this.cachedGet<PricingLookupResponse>(
      `/api/v1/pricing/rates?${searchParams.toString()}`,
      `pricing:${params.categories.sort().join(",")}:${params.businessSize ?? ""}:${params.naicsCode ?? ""}`,
    );
  }

  // ── Awards Search ────────────────────────────────────────────────────

  async searchAwards(params: {
    agency?: string;
    naicsCode?: string;
    competitionType?: string;
    limit?: number;
  }): Promise<AwardsSearchResponse | null> {
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

  // ── Win Probability ───────────────────────────────────────────────────

  async getWinProbability(params: {
    agency?: string;
    naicsCode?: string;
    awardAmount?: number;
    competitionType?: string;
    setAsideType?: string;
    businessSize?: "small" | "large";
  }): Promise<WinProbabilityResponse | null> {
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

  async getCompetitiveLandscape(params: {
    agency?: string;
    naicsCode?: string;
  }): Promise<CompetitiveLandscapeResponse | null> {
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

  async getProposalIntelligence(params: {
    agencyName: string | null;
    naicsCode: string | null;
    laborCategories?: string[];
  }): Promise<ProposalIntelligence | null> {
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
      return cached.data as T;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: {
          "X-Service-Key": this.apiKey!,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn("Intelligence API returned non-OK status", {
          status: response.status,
          path,
        });
        return null;
      }

      const data = (await response.json()) as T;

      // Cache the successful result
      cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

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
export const intelligenceClient = new IntelligenceClient();
