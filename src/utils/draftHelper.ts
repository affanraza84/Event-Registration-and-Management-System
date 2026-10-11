import { IDiscoveredEvent } from "@/types/discovery";
import { isValidHttpUrl } from "@/lib/serpapi";

export interface DraftEligibility {
  isEligible: boolean;
  reason?: string;
  missingFields: string[];
}

/**
 * Evaluates whether an external search result contains sufficient information
 * to prepare an event draft. Disallows sparse, malformed, or junk results.
 */
export function evaluateDraftEligibility(event: IDiscoveredEvent): DraftEligibility {
  const missingFields: string[] = [];

  const hasTitle = Boolean(event.title && event.title.trim().length >= 5);
  if (!hasTitle) {
    missingFields.push("Descriptive Title");
  }

  const hasValidUrl = Boolean(event.originalUrl && isValidHttpUrl(event.originalUrl));
  if (!hasValidUrl) {
    missingFields.push("Valid Source URL");
  }

  const hasSnippet = Boolean(event.snippet && event.snippet.trim().length >= 15);
  if (!hasSnippet) {
    missingFields.push("Event Description / Snippet");
  }

  if (!event.hasConfirmedDate) {
    missingFields.push("Event Date (requires manual entry)");
  }

  if (!event.hasConfirmedLocation) {
    missingFields.push("Event Venue / Location (requires manual entry)");
  }

  // To prepare a draft, we strictly require at least a valid source URL, a title (>= 5 chars), and descriptive text
  const isEligible = hasTitle && hasValidUrl && hasSnippet;

  if (!isEligible) {
    return {
      isEligible: false,
      reason:
        "This search result is too sparse or incomplete to prepare an event draft. A descriptive title and valid source URL are required.",
      missingFields,
    };
  }

  return {
    isEligible: true,
    missingFields,
  };
}

/**
 * Safely parses an explicit event date string into YYYY-MM-DD if it represents a valid future date.
 * Strictly returns an empty string if date is missing, ambiguous, or in the past.
 * NEVER fabricates or guesses an event date.
 */
export function extractSafeDraftDate(dateInfo?: string): string {
  if (!dateInfo || !dateInfo.trim()) return "";

  try {
    const parsed = new Date(dateInfo.trim());
    if (isNaN(parsed.getTime())) return "";

    // Verify it is in the future
    const now = new Date();
    if (parsed <= now) return "";

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Encodes discovery details into URL query parameters for the /events/new draft preparation workflow.
 */
export function buildDraftUrlParams(event: IDiscoveredEvent): string {
  const params = new URLSearchParams();
  params.set("importSource", "discovery");
  params.set("title", event.title.trim());

  // Attach clear attribution directly in description draft
  const descriptionWithSource = `${event.snippet.trim()}\n\nSource: ${event.originalUrl}`;
  params.set("description", descriptionWithSource);

  if (event.hasConfirmedLocation && event.locationInfo) {
    params.set("location", event.locationInfo.trim());
  }

  const safeDate = extractSafeDraftDate(event.dateInfo);
  if (safeDate) {
    params.set("date", safeDate);
  }

  params.set("sourceUrl", event.originalUrl);

  if (event.category && event.category !== "Unclassified") {
    params.set("category", event.category);
  }

  return params.toString();
}
