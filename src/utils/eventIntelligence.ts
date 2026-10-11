import { EventClassification } from "@/types/discovery";

// Recognized tracking parameters stripped during URL normalization
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "ref_src",
  "fbclid",
  "gclid",
  "trk",
  "share",
  "source",
  "source_id",
  "ocid",
  "from",
]);

// Well-known event hosting platforms that provide high-confidence event pages
const RECOGNIZED_EVENT_DOMAINS = new Set([
  "devfolio.co",
  "unstop.com",
  "meetup.com",
  "eventbrite.com",
  "eventbrite.in",
  "lu.ma",
  "luma.ma",
  "hackerearth.com",
  "mlh.io",
  "gdg.community.dev",
  "konfhub.com",
  "commudle.com",
  "townscript.com",
  "allevents.in",
]);

/**
 * Normalizes URLs to safely remove tracking tags, trailing slashes,
 * protocol inconsistencies, and query artifacts for robust deduplication.
 */
export function normalizeUrl(urlString: string): string {
  if (!urlString || typeof urlString !== "string") return "";

  try {
    const parsed = new URL(urlString.trim());

    // Only HTTP and HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return urlString.trim();
    }

    // Standardize protocol and hostname
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    // Strip default ports
    if (
      (parsed.protocol === "http:" && parsed.port === "80") ||
      (parsed.protocol === "https:" && parsed.port === "443")
    ) {
      parsed.port = "";
    }

    // Strip trailing slash on non-root paths
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // Strip tracking parameters
    const searchParams = new URLSearchParams(parsed.search);
    for (const param of Array.from(searchParams.keys())) {
      if (TRACKING_PARAMS.has(param.toLowerCase())) {
        searchParams.delete(param);
      }
    }

    // Reconstruct search string or clear if empty
    const cleanSearch = searchParams.toString();
    parsed.search = cleanSearch ? `?${cleanSearch}` : "";

    // Strip fragment/hash
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return urlString.trim();
  }
}

/**
 * Categorizes an event result into one of the designated categories
 * ONLY when explicit keyword evidence exists. Otherwise defaults strictly to "Unclassified".
 */
export function classifyEvent(title: string, snippet: string): EventClassification {
  const titleLower = (title || "").toLowerCase();
  const snippetLower = (snippet || "").toLowerCase();
  const fullText = `${titleLower} ${snippetLower}`;

  // 1. Hackathons and Competitions (Highest specificity)
  const isHackathon =
    /\b(hackathon|hackathons|hackday|ideathon|codefest|coding competition|datathon|capture the flag|\bctf\b)\b/i.test(
      fullText
    );
  if (isHackathon) {
    return "Hackathons and competitions";
  }

  // 2. Meetups and Networking
  const isMeetup =
    /\b(meetup|meetups|networking|mixer|user group|coffee & code|dev meetup|community gathering)\b/i.test(
      fullText
    );
  if (isMeetup) {
    return "Meetups and networking";
  }

  // 3. Conferences and Workshops
  const isConferenceOrWorkshop =
    /\b(conference|conferences|summit|summits|symposium|workshop|workshops|bootcamp|masterclass|hands-on lab|keynote)\b/i.test(
      fullText
    );
  if (isConferenceOrWorkshop) {
    return "Conferences and workshops";
  }

  // 4. Student and Campus Events
  const isStudentEvent =
    /\b(student|students|campus|college|university|freshers|inter-college|collegiate)\b/i.test(
      fullText
    );
  if (isStudentEvent) {
    return "Student and campus events";
  }

  // 5. Strict fallback: Do not guess or invent a category
  return "Unclassified";
}

export interface RelevanceCriteria {
  query?: string;
  location?: string;
  category?: string;
  date?: string;
}

/**
 * Calculates a transparent, deterministic relevance score and lists the exact
 * supporting signals for why an item was ranked.
 */
export function calculateRelevance(
  item: {
    title: string;
    snippet: string;
    dateInfo?: string;
    locationInfo?: string;
    originalUrl: string;
    category: EventClassification;
  },
  criteria: RelevanceCriteria
): { score: number; signals: string[] } {
  let score = 50; // Base baseline score
  const signals: string[] = [];

  const titleLower = item.title.toLowerCase();
  const snippetLower = item.snippet.toLowerCase();

  // 1. Keyword Relevance
  if (criteria.query) {
    const queryTerms = criteria.query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let queryMatchInTitle = false;
    let queryMatchInSnippet = false;

    for (const term of queryTerms) {
      if (titleLower.includes(term)) {
        score += 25;
        queryMatchInTitle = true;
      } else if (snippetLower.includes(term)) {
        score += 10;
        queryMatchInSnippet = true;
      }
    }

    if (queryMatchInTitle) {
      signals.push("Keyword match in title");
    } else if (queryMatchInSnippet) {
      signals.push("Keyword match in description");
    }
  }

  // 2. Location Relevance
  if (criteria.location) {
    const locLower = criteria.location.toLowerCase();
    const locInTitle = titleLower.includes(locLower);
    const locInSnippet = snippetLower.includes(locLower);
    const locInLocationInfo = item.locationInfo?.toLowerCase().includes(locLower);

    if (locInTitle || locInLocationInfo) {
      score += 25;
      signals.push(`Location matched: ${criteria.location}`);
    } else if (locInSnippet) {
      score += 15;
      signals.push(`Location mentioned: ${criteria.location}`);
    }
  }

  // 3. Category Match Bonus
  if (criteria.category && criteria.category !== "All Categories") {
    const catLower = criteria.category.toLowerCase();
    if (
      item.category.toLowerCase().includes(catLower) ||
      catLower.includes(item.category.toLowerCase())
    ) {
      score += 20;
      signals.push(`Category matched: ${item.category}`);
    }
  }

  // 4. Date Confirmation Bonus (Actionable, time-bound events rank higher)
  if (item.dateInfo && item.dateInfo.trim()) {
    score += 15;
    signals.push("Confirmed event date present");
  }

  // 5. Verified Event Platform Bonus
  try {
    const domain = new URL(item.originalUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (RECOGNIZED_EVENT_DOMAINS.has(domain)) {
      score += 10;
      signals.push(`Event platform (${domain})`);
    }
  } catch {
    // ignore URL parse errors
  }

  return {
    score,
    signals: signals.length > 0 ? signals : ["Standard web discovery result"],
  };
}
