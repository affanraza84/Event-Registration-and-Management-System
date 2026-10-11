import { connectToDatabase } from "@/lib/db";
import RateLimit from "@/models/RateLimit";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Extracts client IP from standard reverse proxy and CDN headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Distributed multi-instance rate limiter backed by MongoDB TTL collection.
 * Works seamlessly across multi-instance serverless deployments (Vercel, AWS, etc.).
 *
 * @param key Unique identifier (e.g. `discovery:203.0.113.195`)
 * @param limit Maximum allowed requests per window
 * @param windowSeconds Time window duration in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number = 20,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  try {
    await connectToDatabase();

    const now = new Date();
    const existing = await RateLimit.findOne({ key });

    // Window does not exist or has expired
    if (!existing || existing.expiresAt <= now) {
      const expiresAt = new Date(Date.now() + windowSeconds * 1000);
      await RateLimit.findOneAndUpdate(
        { key },
        { count: 1, expiresAt },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetSeconds: windowSeconds,
      };
    }

    // Window active and limit exceeded
    if (existing.count >= limit) {
      const resetSeconds = Math.max(
        1,
        Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000)
      );
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetSeconds,
      };
    }

    // Window active and within limit -> increment count atomically
    const updated = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { new: true }
    );

    const count = updated?.count ?? existing.count + 1;
    const remaining = Math.max(0, limit - count);
    const resetSeconds = Math.max(
      1,
      Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000)
    );

    return {
      allowed: true,
      limit,
      remaining,
      resetSeconds,
    };
  } catch (error) {
    // If database connection fails, fail open gracefully to prevent complete service outage
    console.warn("Distributed rate limiter unavailable, falling back:", error);
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetSeconds: windowSeconds,
    };
  }
}
