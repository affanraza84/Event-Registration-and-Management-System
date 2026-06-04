import Event from "@/models/Event";

/**
 * Normalizes a string into a URL-friendly slug.
 * E.g., "Byamn Dev Meetup 2026" -> "byamn-dev-meetup-2026"
 */
export function generateBaseSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters (except spaces and hyphens)
    .replace(/[\s_-]+/g, "-") // Replace spaces and multiple hyphens/underscores with a single hyphen
    .replace(/^-+|-+$/g, ""); // Trim leading and trailing hyphens
}

/**
 * Checks the database for collisions and returns a guaranteed unique slug.
 */
export async function getUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateBaseSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Event.findOne({ slug });
    if (!existing) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
