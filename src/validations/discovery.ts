import { z } from "zod";

export const discoverySearchSchema = z
  .object({
    query: z
      .string()
      .max(120, "Query cannot exceed 120 characters")
      .trim()
      .optional(),
    location: z
      .string()
      .max(100, "Location cannot exceed 100 characters")
      .trim()
      .optional(),
    city: z
      .string()
      .max(100, "City cannot exceed 100 characters")
      .trim()
      .optional(),
    category: z
      .string()
      .max(50, "Category cannot exceed 50 characters")
      .trim()
      .optional(),
    date: z
      .string()
      .max(50, "Date parameter cannot exceed 50 characters")
      .trim()
      .optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(20, "Limit cannot exceed 20")
      .default(10),
  })
  .transform((data) => {
    // If city is passed but location is not, map city to location
    const effectiveLocation = data.location || data.city;
    return {
      query: data.query,
      location: effectiveLocation,
      category: data.category,
      date: data.date,
      limit: data.limit,
    };
  })
  .refine(
    (data) => {
      const hasQuery = typeof data.query === "string" && data.query.length > 0;
      const hasLocation =
        typeof data.location === "string" && data.location.length > 0;
      const hasCategory =
        typeof data.category === "string" && data.category.length > 0;
      return hasQuery || hasLocation || hasCategory;
    },
    {
      message:
        "Please provide at least one search parameter: query, location (or city), or category.",
      path: ["query"],
    }
  );

export type DiscoverySearchInput = z.infer<typeof discoverySearchSchema>;
