/**
 * Media Tagging & Taxonomy Service
 *
 * Implements Cloudinary AI tag extraction with honest, clearly-separated
 * contextual event-domain intelligence fallbacks when Cloudinary AI add-ons are inactive.
 */

export interface EventMediaContext {
  title?: string;
  description?: string;
  category?: string;
  assetType?: string;
}

export interface TaggingResult {
  tags: string[];
  tagSource: "cloudinary_ai" | "context" | "manual";
}

const CATEGORY_TAXONOMY: Record<string, string[]> = {
  hackathon: ["Hackathon", "Coding", "Technology", "Innovation"],
  tech: ["Technology", "Software", "Engineering", "Developer"],
  ai: ["Artificial Intelligence", "Machine Learning", "Technology", "Innovation"],
  conference: ["Conference", "Keynote", "Industry", "Networking"],
  summit: ["Summit", "Leadership", "Technology", "Conference"],
  workshop: ["Workshop", "Education", "Hands-on", "Training"],
  meetup: ["Networking", "Community", "Meetup", "Social"],
  design: ["Design", "Creative", "UI/UX", "Art"],
  startup: ["Startup", "Entrepreneurship", "Pitch", "Business"],
  music: ["Music", "Concert", "Entertainment", "Festival"],
  sports: ["Sports", "Fitness", "Athletics", "Competition"],
  student: ["Student", "Campus", "Academic", "Education"],
};

/**
 * Normalizes a tag string: trims, removes symbols, capitalizes words nicely.
 */
export function normalizeTag(tag: string): string {
  const clean = tag.trim().replace(/^#+/, "").replace(/[^a-zA-Z0-9\s-]/g, "");
  if (!clean) return "";
  return clean
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Sanitizes an array of tags (de-duplicates, filters out empty/invalid tags, limits count).
 */
export function sanitizeTags(tags: (string | unknown)[]): string[] {
  if (!Array.isArray(tags)) return [];

  const unique = new Set<string>();
  for (const raw of tags) {
    if (typeof raw === "string") {
      const normalized = normalizeTag(raw);
      if (normalized && normalized.length >= 2 && normalized.length <= 30) {
        unique.add(normalized);
      }
    }
  }

  return Array.from(unique).slice(0, 15);
}

/**
 * Extracts tags from Cloudinary AI response if available; otherwise falls back to
 * EventScout's event-context taxonomy without pretending Cloudinary AI generated them.
 */
export function extractMediaTags(
  cloudinaryInput?: string[] | Record<string, unknown> | null,
  context?: EventMediaContext
): TaggingResult {
  let rawTags: string[] = [];

  if (Array.isArray(cloudinaryInput)) {
    rawTags = cloudinaryInput.filter((t): t is string => typeof t === "string");
  } else if (cloudinaryInput && typeof cloudinaryInput === "object") {
    // Check .tags property
    if (Array.isArray((cloudinaryInput as Record<string, unknown>).tags)) {
      rawTags = ((cloudinaryInput as Record<string, unknown>).tags as unknown[]).filter(
        (t): t is string => typeof t === "string"
      );
    }
    // Check .info.categorization.google_tagging.data
    const info = (cloudinaryInput as Record<string, unknown>).info as Record<string, unknown> | undefined;
    const cat = info?.categorization as Record<string, unknown> | undefined;
    const googleTagging = cat?.google_tagging as Record<string, unknown> | undefined;
    if (Array.isArray(googleTagging?.data)) {
      for (const item of googleTagging.data as Array<Record<string, unknown>>) {
        if (typeof item?.tag === "string") {
          rawTags.push(item.tag);
        }
      }
    }
  }

  // Filter out internal system prefixes
  const systemPrefixes = ["eventscout", "user_", "event_", "host_", "profile"];
  const aiTags = rawTags.filter(
    (t) => !systemPrefixes.some((prefix) => t.toLowerCase().startsWith(prefix))
  );

  if (aiTags.length > 0) {
    const cleanedAiTags = sanitizeTags(aiTags);
    if (cleanedAiTags.length > 0) {
      return {
        tags: cleanedAiTags,
        tagSource: "cloudinary_ai",
      };
    }
  }

  // 2. Fallback: Contextual Event Domain Taxonomy
  const derivedTags = new Set<string>();

  // Add asset type descriptor
  if (context?.assetType) {
    if (context.assetType === "promo_video") derivedTags.add("Promo Video");
    else if (context.assetType === "poster") derivedTags.add("Event Poster");
    else if (context.assetType === "banner") derivedTags.add("Banner");
    else if (context.assetType === "gallery") derivedTags.add("Gallery Photo");
  }

  const combinedText = [
    context?.title || "",
    context?.category || "",
    context?.description || "",
  ]
    .join(" ")
    .toLowerCase();

  // Match keyword rules against taxonomy
  for (const [key, tagList] of Object.entries(CATEGORY_TAXONOMY)) {
    if (combinedText.includes(key)) {
      tagList.forEach((t) => derivedTags.add(t));
    }
  }

  // If still empty, add default generic gathering tags
  if (derivedTags.size === 0) {
    derivedTags.add("Event");
    derivedTags.add("Community");
  }

  return {
    tags: Array.from(derivedTags).slice(0, 10),
    tagSource: "context",
  };
}
