/**
 * Utility to construct effective and natural Google Search queries
 * for discovering live tech events, meetups, and hackathons via SerpApi.
 */

export interface DiscoveryQueryInput {
  query?: string;
  location?: string;
  category?: string;
  date?: string;
}

/**
 * Sanitizes input string by removing control characters, excessive whitespace,
 * and dangerous punctuation.
 */
function sanitizeInput(str: string): string {
  return str
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .replace(/[<>"{}[\]\\]/g, "") // Remove potentially disruptive characters
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds a natural Google search query for event discovery.
 * Example: "upcoming AI meetups and hackathons in Ranchi October 2026"
 */
export function buildDiscoveryQuery(input: DiscoveryQueryInput): string {
  const rawQuery = input.query ? sanitizeInput(input.query) : "";
  const rawLocation = input.location ? sanitizeInput(input.location) : "";
  const rawCategory = input.category ? sanitizeInput(input.category) : "";
  const rawDate = input.date ? sanitizeInput(input.date) : "";

  // 1. Determine core subject terms
  let subject = "";

  if (rawCategory && rawQuery) {
    const categoryLower = rawCategory.toLowerCase();
    const queryLower = rawQuery.toLowerCase();
    const categoryWords = categoryLower.split(/\s+/).filter(Boolean);
    const allWordsPresent =
      categoryWords.length > 0 &&
      categoryWords.every((w) => queryLower.includes(w));

    if (queryLower.includes(categoryLower) || allWordsPresent) {
      subject = rawQuery;
    } else {
      subject = `${rawCategory} ${rawQuery}`;
    }
  } else if (rawQuery) {
    subject = rawQuery;
  } else if (rawCategory) {
    // If only category is provided, default to meetups and hackathons
    const catLower = rawCategory.toLowerCase();
    if (
      catLower.includes("event") ||
      catLower.includes("meetup") ||
      catLower.includes("hackathon") ||
      catLower.includes("conference")
    ) {
      subject = rawCategory;
    } else {
      subject = `${rawCategory} meetups and hackathons`;
    }
  } else {
    subject = "tech meetups and hackathons";
  }

  // 2. Add "upcoming" prefix if not already present
  let queryText = subject;
  if (!queryText.toLowerCase().startsWith("upcoming")) {
    queryText = `upcoming ${queryText}`;
  }

  // 3. Add location if present and not already mentioned
  if (rawLocation) {
    const queryLower = queryText.toLowerCase();
    const locLower = rawLocation.toLowerCase();
    if (!queryLower.includes(locLower)) {
      queryText = `${queryText} in ${rawLocation}`;
    }
  }

  // 4. Add date terms if present and not already mentioned
  if (rawDate) {
    const queryLower = queryText.toLowerCase();
    const dateLower = rawDate.toLowerCase();
    if (!queryLower.includes(dateLower)) {
      queryText = `${queryText} ${rawDate}`;
    }
  }

  return queryText.replace(/\s+/g, " ").trim();
}
