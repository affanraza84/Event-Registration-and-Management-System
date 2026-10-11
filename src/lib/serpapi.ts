import { buildDiscoveryQuery, DiscoveryQueryInput } from "@/utils/discoveryQuery";
import { IDiscoveredEvent, DiscoveryResponse } from "@/types/discovery";
import {
  normalizeUrl,
  classifyEvent,
  calculateRelevance,
  RelevanceCriteria,
} from "@/utils/eventIntelligence";

const SERPAPI_ENDPOINT = "https://serpapi.com/search.json";
const DEFAULT_TIMEOUT_MS = 12000;
const MAX_RESULTS_LIMIT = 20;

export class SerpApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SerpApiConfigError";
  }
}

export class SerpApiTimeoutError extends Error {
  constructor(message: string = "Search discovery request timed out.") {
    super(message);
    this.name = "SerpApiTimeoutError";
  }
}

export class SerpApiError extends Error {
  public statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "SerpApiError";
    this.statusCode = statusCode;
  }
}

/**
 * Validates that a string is a well-formed HTTP or HTTPS URL.
 * Strictly prevents javascript:, data:, file:, and other unsafe schemes.
 */
export function isValidHttpUrl(urlString: unknown): boolean {
  if (typeof urlString !== "string" || !urlString.trim()) {
    return false;
  }
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extracts a clean domain or displayed link from a URL.
 */
export function extractDomain(urlString: string, fallback?: string): string {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return fallback || "";
  }
}

/**
 * Strips HTML tags, control characters, and excess whitespace from untrusted strings.
 */
export function sanitizeText(text: unknown, maxLength: number = 300): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Strip control characters
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Normalizes raw SerpApi search results into standard IDiscoveredEvent objects.
 * Deduplicates via normalized URLs, classifies evidence-based categories,
 * scores deterministic relevance, and explicitly distinguishes confirmed dates/locations.
 */
export function normalizeSerpApiResponse(
  rawData: unknown,
  searchQuery: string,
  limit: number = 10,
  criteria: RelevanceCriteria = {}
): DiscoveryResponse {
  if (!rawData || typeof rawData !== "object") {
    return {
      success: true,
      searchQuery,
      totalResults: 0,
      events: [],
      disclaimer:
        "Google Search results are web discovery results, not verified event records. Please verify event details on the source website.",
    };
  }

  const data = rawData as Record<string, unknown>;

  // Check for error payload from SerpApi
  if (typeof data.error === "string") {
    throw new SerpApiError(`SerpApi service error: ${sanitizeText(data.error)}`);
  }

  const events: IDiscoveredEvent[] = [];
  const seenUrls = new Set<string>();

  // 1. Process Google Events carousel/rich results if present
  if (Array.isArray(data.events_results)) {
    for (const item of data.events_results) {
      if (!item || typeof item !== "object") continue;
      const eventObj = item as Record<string, unknown>;

      const link = typeof eventObj.link === "string" ? eventObj.link : "";
      if (!isValidHttpUrl(link)) continue;

      const cleanUrl = normalizeUrl(link);
      if (seenUrls.has(cleanUrl)) continue;

      const title = sanitizeText(eventObj.title, 150);
      if (!title) continue;

      const description = sanitizeText(
        eventObj.description || (Array.isArray(eventObj.info) ? eventObj.info.join(" - ") : ""),
        300
      );

      // Extract explicit date if supported
      let dateInfo: string | undefined;
      if (eventObj.date && typeof eventObj.date === "object") {
        const dObj = eventObj.date as Record<string, unknown>;
        if (typeof dObj.when === "string") {
          dateInfo = sanitizeText(dObj.when, 80);
        } else if (typeof dObj.start_date === "string") {
          dateInfo = sanitizeText(dObj.start_date, 80);
        }
      }

      // Extract explicit location if supported
      let locationInfo: string | undefined;
      if (Array.isArray(eventObj.address)) {
        locationInfo = sanitizeText(eventObj.address.join(", "), 100);
      } else if (typeof eventObj.address === "string") {
        locationInfo = sanitizeText(eventObj.address, 100);
      } else if (eventObj.venue && typeof eventObj.venue === "object") {
        const vObj = eventObj.venue as Record<string, unknown>;
        if (typeof vObj.name === "string") {
          locationInfo = sanitizeText(vObj.name, 100);
        }
      }

      const hasConfirmedDate = Boolean(dateInfo && dateInfo.trim().length > 0);
      const dateDisplay = hasConfirmedDate ? dateInfo! : "Date not confirmed";
      const hasConfirmedLocation = Boolean(locationInfo && locationInfo.trim().length > 0);
      const locationDisplay = hasConfirmedLocation ? locationInfo! : "Location unverified";

      const snippet = description || "Explore event information and ticket registration on the official website.";
      const category = classifyEvent(title, snippet);

      const { score: relevanceScore, signals: relevanceSignals } = calculateRelevance(
        {
          title,
          snippet,
          dateInfo,
          locationInfo,
          originalUrl: link,
          category,
        },
        criteria
      );

      seenUrls.add(cleanUrl);
      events.push({
        id: `disc-ev-${events.length + 1}`,
        title,
        snippet,
        originalUrl: link,
        normalizedUrl: cleanUrl,
        displayedSource: extractDomain(link),
        category,
        dateInfo,
        hasConfirmedDate,
        dateDisplay,
        locationInfo,
        hasConfirmedLocation,
        locationDisplay,
        relevanceScore,
        relevanceSignals,
        isExternal: true,
      });
    }
  }

  // 2. Process organic Google search results
  if (Array.isArray(data.organic_results)) {
    for (const item of data.organic_results) {
      if (!item || typeof item !== "object") continue;
      const res = item as Record<string, unknown>;

      const link = typeof res.link === "string" ? res.link : "";
      if (!isValidHttpUrl(link)) continue;

      const cleanUrl = normalizeUrl(link);
      if (seenUrls.has(cleanUrl)) continue;

      const title = sanitizeText(res.title, 150);
      if (!title) continue;

      const snippet = sanitizeText(res.snippet, 300) || "Visit original source for comprehensive event details and registration.";

      // Displayed link or domain
      const displayedSource =
        typeof res.displayed_link === "string"
          ? sanitizeText(res.displayed_link, 60)
          : extractDomain(link);

      // Extract explicit date string if Google provided it in snippet metadata
      let dateInfo: string | undefined;
      if (typeof res.date === "string") {
        dateInfo = sanitizeText(res.date, 60);
      }

      // Check if location can be explicitly found from snippet or extensions
      let locationInfo: string | undefined;
      if (typeof res.rich_snippet === "object" && res.rich_snippet !== null) {
        const rich = res.rich_snippet as Record<string, unknown>;
        if (typeof rich.top === "object" && rich.top !== null) {
          const top = rich.top as Record<string, unknown>;
          if (Array.isArray(top.extensions)) {
            const locExt = top.extensions.find((ext) => typeof ext === "string" && ext.length < 50);
            if (locExt) {
              locationInfo = sanitizeText(locExt, 80);
            }
          }
        }
      }

      const hasConfirmedDate = Boolean(dateInfo && dateInfo.trim().length > 0);
      const dateDisplay = hasConfirmedDate ? dateInfo! : "Date not confirmed";
      const hasConfirmedLocation = Boolean(locationInfo && locationInfo.trim().length > 0);
      const locationDisplay = hasConfirmedLocation ? locationInfo! : "Location unverified";

      const category = classifyEvent(title, snippet);

      const { score: relevanceScore, signals: relevanceSignals } = calculateRelevance(
        {
          title,
          snippet,
          dateInfo,
          locationInfo,
          originalUrl: link,
          category,
        },
        criteria
      );

      seenUrls.add(cleanUrl);
      events.push({
        id: `disc-org-${events.length + 1}`,
        title,
        snippet,
        originalUrl: link,
        normalizedUrl: cleanUrl,
        displayedSource,
        category,
        dateInfo,
        hasConfirmedDate,
        dateDisplay,
        locationInfo,
        hasConfirmedLocation,
        locationDisplay,
        relevanceScore,
        relevanceSignals,
        isExternal: true,
      });
    }
  }

  // 3. Rank results using transparent, deterministic relevance signals
  events.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 4. Return top results capped by the requested limit
  const finalEvents = events.slice(0, limit);

  return {
    success: true,
    searchQuery,
    totalResults: finalEvents.length,
    events: finalEvents,
    disclaimer:
      "Google Search results are web discovery results, not verified event records. Please verify event dates, locations, and registration details on the source website.",
  };
}

/**
 * Searches for live web events using the official SerpApi Google Search API.
 */
export async function searchLiveEvents(
  input: DiscoveryQueryInput & { limit?: number; country?: string }
): Promise<DiscoveryResponse> {
  // 1. Read API key exclusively from server-side environment variable
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_serpapi_api_key_here") {
    throw new SerpApiConfigError(
      "Search discovery service is not configured. SERPAPI_API_KEY is missing from environment variables."
    );
  }

  // 2. Build the optimized Google Search query
  const query = buildDiscoveryQuery(input);
  const effectiveLimit = Math.min(Math.max(input.limit || 10, 1), MAX_RESULTS_LIMIT);
  const country = input.country || "in"; // Default to India for SerpApi India Hackathon 2026

  // 3. Assemble request parameters for official endpoint: https://serpapi.com/search.json
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    google_domain: "google.com",
    hl: "en",
    gl: country,
    num: String(effectiveLimit),
    api_key: apiKey,
  });

  const url = `${SERPAPI_ENDPOINT}?${params.toString()}`;

  // 4. Set reasonable timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new SerpApiError("SerpApi authentication error: Invalid API key.", response.status);
      }
      if (response.status === 429) {
        throw new SerpApiError("SerpApi rate limit reached. Please try again shortly.", response.status);
      }
      throw new SerpApiError(`SerpApi search request failed with status: ${response.status}`, response.status);
    }

    const json = await response.json();
    return normalizeSerpApiResponse(json, query, effectiveLimit, {
      query: input.query,
      location: input.location,
      category: input.category,
      date: input.date,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new SerpApiTimeoutError("SerpApi search request timed out after 12 seconds.");
    }
    if (error instanceof SerpApiConfigError || error instanceof SerpApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown network error";
    throw new SerpApiError(`Network failure while connecting to SerpApi: ${message}`);
  }
}
